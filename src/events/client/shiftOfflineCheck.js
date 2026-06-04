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
        const presence = newPresence || oldPresence;
        if (!presence?.guild || !presence?.userId) return;

        const guild = presence.guild;
        const userId = presence.userId;

        const data = await ShiftSystem.findOne({
            guildId: guild.id
        });

        if (!data || !data.antiOfflineFarming) return;

        const key = `${guild.id}_${userId}`;

        const status = newPresence?.status || 'offline';

        if (status !== 'offline') {
            if (offlineTimers.has(key)) {
                clearTimeout(offlineTimers.get(key));
                offlineTimers.delete(key);
            }
            return;
        }

        const shiftTime = await ShiftTime.findOne({
            guildId: guild.id,
            userId,
            activeSince: { $ne: null }
        });

        if (!shiftTime) return;
        if (offlineTimers.has(key)) return;

        const timer = setTimeout(async () => {
            try {
                const freshShift = await ShiftTime.findOne({
                    guildId: guild.id,
                    userId,
                    activeSince: { $ne: null }
                });

                if (!freshShift) {
                    offlineTimers.delete(key);
                    return;
                }

                const member = await guild.members.fetch(userId).catch(() => null);

                if (!member) {
                    offlineTimers.delete(key);
                    return;
                }

                const dutyRole = guild.roles.cache.get(data.dutyRoleId);
                const offDutyRole = data.offDutyRoleId
                    ? guild.roles.cache.get(data.offDutyRoleId)
                    : null;

                if (!dutyRole || !member.roles.cache.has(dutyRole.id)) {
                    freshShift.activeSince = null;
                    await freshShift.save();

                    offlineTimers.delete(key);
                    return;
                }

                const workedMs = Date.now() - new Date(freshShift.activeSince).getTime();

                freshShift.totalMs += workedMs;
                freshShift.activeSince = null;
                await freshShift.save();

                await member.roles.remove(dutyRole).catch(() => {});

                if (offDutyRole && !member.roles.cache.has(offDutyRole.id)) {
                    await member.roles.add(offDutyRole).catch(() => {});
                }

                const embed = new EmbedBuilder()
                    .setColor('#ffaa00')
                    .setTitle('📡 Automatisch ausgecheckt')
                    .setDescription(`${member.user} wurde nach 5 Minuten Offline automatisch ausgecheckt.`)
                    .addFields({
                        name: '⏱️ Arbeitszeit',
                        value: `\`${formatDuration(workedMs)}\``
                    })
                    .setTimestamp();

                const logChannel = guild.channels.cache.get(data.logChannelId);

                if (logChannel) {
                    await logChannel.send({
                        embeds: [embed]
                    }).catch(() => {});
                }

                await member.send({
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

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    return `${days}T ${hours}H ${minutes}M ${seconds}S`;
}