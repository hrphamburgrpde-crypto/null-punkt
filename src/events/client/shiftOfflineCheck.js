const {
    Events,
    EmbedBuilder
} = require('discord.js');

const ShiftSystem = require('../../models/ShiftSystem');
const ShiftTime = require('../../models/ShiftTime');

const offlineTimers = new Map();

module.exports = {
    name: Events.PresenceUpdate,

    async execute(oldPresence, newPresence) {
        if (!newPresence?.guild) return;

        const data = await ShiftSystem.findOne({
            guildId: newPresence.guild.id
        });

        if (!data || !data.antiOfflineFarming) return;

        const member = newPresence.member;

        if (!member) return;

        const dutyRole = newPresence.guild.roles.cache.get(data.dutyRoleId);

        if (!dutyRole) return;

        const key = `${newPresence.guild.id}_${member.id}`;

        if (newPresence.status !== 'offline') {
            if (offlineTimers.has(key)) {
                clearTimeout(offlineTimers.get(key));
                offlineTimers.delete(key);
            }

            return;
        }

        if (!member.roles.cache.has(dutyRole.id)) return;
        if (offlineTimers.has(key)) return;

        const timer = setTimeout(async () => {
            try {
                const refreshedMember = await newPresence.guild.members.fetch(member.id);

                if (!refreshedMember.roles.cache.has(dutyRole.id)) {
                    offlineTimers.delete(key);
                    return;
                }

                const workedMs = await stopTime(newPresence.guild.id, member.id);

                await refreshedMember.roles.remove(dutyRole).catch(() => {});

                const offDutyRole = data.offDutyRoleId
                    ? newPresence.guild.roles.cache.get(data.offDutyRoleId)
                    : null;

                if (offDutyRole) {
                    await refreshedMember.roles.add(offDutyRole).catch(() => {});
                }

                const embed = new EmbedBuilder()
                    .setColor('#ffaa00')
                    .setTitle('📡 Automatisch ausgecheckt')
                    .setDescription(`${refreshedMember.user} wurde nach 5 Minuten Offline automatisch ausgecheckt.`)
                    .addFields({
                        name: '⏱️ Arbeitszeit',
                        value: `\`${formatDuration(workedMs)}\``
                    })
                    .setTimestamp();

                const logChannel = newPresence.guild.channels.cache.get(data.logChannelId);

                if (logChannel) {
                    await logChannel.send({
                        embeds: [embed]
                    }).catch(() => {});
                }

                await refreshedMember.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#ffaa00')
                            .setTitle('📡 Automatisch ausgecheckt')
                            .setDescription('Du wurdest automatisch ausgecheckt, weil du länger als 5 Minuten offline warst.')
                            .addFields({
                                name: '⏱️ Arbeitszeit',
                                value: `\`${formatDuration(workedMs)}\``
                            })
                            .setTimestamp()
                    ]
                }).catch(() => {});

                offlineTimers.delete(key);
            } catch (err) {
                console.log('Shift Offline Check Fehler:', err);
                offlineTimers.delete(key);
            }
        }, 5 * 60 * 1000);

        offlineTimers.set(key, timer);
    }
};

async function stopTime(guildId, userId) {
    const shiftTime = await ShiftTime.findOne({
        guildId,
        userId
    });

    if (!shiftTime || !shiftTime.activeSince) return 0;

    const workedMs = Date.now() - new Date(shiftTime.activeSince).getTime();

    shiftTime.totalMs += workedMs;
    shiftTime.activeSince = null;

    await shiftTime.save();

    return workedMs;
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    return `${days}T ${hours}H ${minutes}M ${seconds}S`;
}