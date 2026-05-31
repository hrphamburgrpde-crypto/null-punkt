const {
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    UserSelectMenuBuilder
} = require('discord.js');

const ShiftSystem = require('../../models/ShiftSystem');
const ShiftTime = require('../../models/ShiftTime');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        if (interaction.isButton()) {
            if (
                ![
                    'shift_checkin',
                    'shift_checkout',
                    'shift_current',
                    'shift_manage',
                    'shift_times_manage'
                ].includes(interaction.customId)
            ) return;

            const data = await ShiftSystem.findOne({
                guildId: interaction.guild.id
            });

            if (!data) {
                return interaction.reply({
                    content: '❌ Schicht System wurde nicht eingerichtet.',
                    flags: 64
                });
            }

            if (interaction.customId === 'shift_checkin') {
                return checkIn(interaction, data);
            }

            if (interaction.customId === 'shift_checkout') {
                return checkOut(interaction, data, interaction.member, false);
            }

            if (interaction.customId === 'shift_current') {
                return showCurrentShifts(interaction, data);
            }

            if (interaction.customId === 'shift_manage') {
                return openManagement(interaction, data);
            }

            if (interaction.customId === 'shift_times_manage') {
                return showTimeManagement(interaction, data);
            }
        }

        if (interaction.isUserSelectMenu()) {
            if (interaction.customId !== 'shift_manage_remove_user') return;

            const data = await ShiftSystem.findOne({
                guildId: interaction.guild.id
            });

            if (!data) {
                return interaction.reply({
                    content: '❌ Schicht System wurde nicht eingerichtet.',
                    flags: 64
                });
            }

            if (!hasManagementPermission(interaction, data)) {
                return interaction.reply({
                    content: '❌ Keine Verwaltungsrechte.',
                    flags: 64
                });
            }

            const memberId = interaction.values[0];
            const member = await interaction.guild.members.fetch(memberId).catch(() => null);

            if (!member) {
                return interaction.update({
                    content: '❌ User wurde nicht gefunden.',
                    components: []
                });
            }

            return forceCheckout(interaction, data, member);
        }
    }
};

async function checkIn(interaction, data) {
    const dutyRole = interaction.guild.roles.cache.get(data.dutyRoleId);
    const offDutyRole = data.offDutyRoleId
        ? interaction.guild.roles.cache.get(data.offDutyRoleId)
        : null;

    if (!dutyRole) {
        return interaction.reply({
            content: '❌ Duty Rolle wurde nicht gefunden.',
            flags: 64
        });
    }

    const roleCheck = checkBotRoles(interaction, dutyRole, offDutyRole);

    if (!roleCheck.ok) {
        return interaction.reply({
            content: roleCheck.message,
            flags: 64
        });
    }

    if (interaction.member.roles.cache.has(dutyRole.id)) {
        return interaction.reply({
            content: '❌ Du bist bereits eingecheckt.',
            flags: 64
        });
    }

    await interaction.member.roles.add(dutyRole);

    if (offDutyRole && interaction.member.roles.cache.has(offDutyRole.id)) {
        await interaction.member.roles.remove(offDutyRole);
    }

    await ShiftTime.findOneAndUpdate(
        {
            guildId: interaction.guild.id,
            userId: interaction.user.id
        },
        {
            guildId: interaction.guild.id,
            userId: interaction.user.id,
            activeSince: new Date()
        },
        {
            upsert: true,
            new: true
        }
    );

    const embed = new EmbedBuilder()
        .setColor('#00ff88')
        .setTitle('🟢 Eingecheckt')
        .setDescription(`${interaction.user} hat sich eingecheckt.`)
        .setTimestamp();

    await sendShiftLog(interaction.guild, data, embed);

    return interaction.reply({
        embeds: [embed],
        flags: 64
    });
}

async function checkOut(interaction, data, member, silent) {
    const dutyRole = interaction.guild.roles.cache.get(data.dutyRoleId);
    const offDutyRole = data.offDutyRoleId
        ? interaction.guild.roles.cache.get(data.offDutyRoleId)
        : null;

    if (!dutyRole) {
        return interaction.reply({
            content: '❌ Duty Rolle wurde nicht gefunden.',
            flags: 64
        });
    }

    const roleCheck = checkBotRoles(interaction, dutyRole, offDutyRole);

    if (!roleCheck.ok) {
        return interaction.reply({
            content: roleCheck.message,
            flags: 64
        });
    }

    if (!member.roles.cache.has(dutyRole.id)) {
        return interaction.reply({
            content: '❌ Du bist nicht eingecheckt.',
            flags: 64
        });
    }

    const workedMs = await stopTime(interaction.guild.id, member.id);

    await member.roles.remove(dutyRole);

    if (offDutyRole && !member.roles.cache.has(offDutyRole.id)) {
        await member.roles.add(offDutyRole);
    }

    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🔴 Ausgecheckt')
        .setDescription(`${member.user} hat sich ausgecheckt.`)
        .addFields({
            name: '⏱️ Arbeitszeit',
            value: `\`${formatDuration(workedMs)}\``
        })
        .setTimestamp();

    await sendShiftLog(interaction.guild, data, embed);

    if (silent) return embed;

    return interaction.reply({
        embeds: [embed],
        flags: 64
    });
}

async function forceCheckout(interaction, data, member) {
    const dutyRole = interaction.guild.roles.cache.get(data.dutyRoleId);
    const offDutyRole = data.offDutyRoleId
        ? interaction.guild.roles.cache.get(data.offDutyRoleId)
        : null;

    if (!dutyRole || !member.roles.cache.has(dutyRole.id)) {
        return interaction.update({
            content: '❌ Dieser User ist nicht in der Schicht.',
            components: []
        });
    }

    const workedMs = await stopTime(interaction.guild.id, member.id);

    await member.roles.remove(dutyRole).catch(() => {});

    if (offDutyRole && !member.roles.cache.has(offDutyRole.id)) {
        await member.roles.add(offDutyRole).catch(() => {});
    }

    const embed = new EmbedBuilder()
        .setColor('#ffaa00')
        .setTitle('🛠️ Manuell ausgecheckt')
        .setDescription(`${member.user} wurde von ${interaction.user} aus der Schicht entfernt.`)
        .addFields({
            name: '⏱️ Arbeitszeit',
            value: `\`${formatDuration(workedMs)}\``
        })
        .setTimestamp();

    await sendShiftLog(interaction.guild, data, embed);

    await member.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('🛠️ Aus Schicht entfernt')
                .setDescription(`Du wurdest auf **${interaction.guild.name}** aus der Schicht entfernt.`)
                .setTimestamp()
        ]
    }).catch(() => {});

    return interaction.update({
        content: `✅ ${member.user} wurde ausgecheckt.`,
        embeds: [embed],
        components: []
    });
}

async function showCurrentShifts(interaction, data) {
    const active = await ShiftTime.find({
        guildId: interaction.guild.id,
        activeSince: { $ne: null }
    });

    if (!active.length) {
        return interaction.reply({
            content: '❌ Aktuell ist niemand in der Schicht.',
            flags: 64
        });
    }

    const lines = [];

    for (let i = 0; i < active.length; i++) {
        const entry = active[i];
        const ms = Date.now() - new Date(entry.activeSince).getTime();

        lines.push(
            `**${i + 1}.** <@${entry.userId}> — \`${formatDuration(ms)}\``
        );
    }

    const embed = new EmbedBuilder()
        .setColor('#00aaff')
        .setTitle('📋 Aktuelle Schichten')
        .setDescription(lines.join('\n'))
        .setTimestamp();

    return interaction.reply({
        embeds: [embed],
        flags: 64
    });
}

async function openManagement(interaction, data) {
    if (!hasManagementPermission(interaction, data)) {
        return interaction.reply({
            content: '❌ Keine Verwaltungsrechte.',
            flags: 64
        });
    }

    const menu = new UserSelectMenuBuilder()
        .setCustomId('shift_manage_remove_user')
        .setPlaceholder('User aus der Schicht entfernen')
        .setMinValues(1)
        .setMaxValues(1);

    return interaction.reply({
        content: 'Wähle den User aus, der aus der Schicht entfernt werden soll.',
        components: [
            new ActionRowBuilder().addComponents(menu)
        ],
        flags: 64
    });
}

async function showTimeManagement(interaction, data) {
    if (!hasManagementPermission(interaction, data)) {
        return interaction.reply({
            content: '❌ Keine Verwaltungsrechte.',
            flags: 64
        });
    }

    const entries = await ShiftTime.find({
        guildId: interaction.guild.id
    }).sort({
        totalMs: -1
    }).limit(25);

    if (!entries.length) {
        return interaction.reply({
            content: '❌ Es gibt noch keine gespeicherten Zeiten.',
            flags: 64
        });
    }

    const lines = [];

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        let total = entry.totalMs || 0;

        if (entry.activeSince) {
            total += Date.now() - new Date(entry.activeSince).getTime();
        }

        lines.push(
            `**${i + 1}.** <@${entry.userId}> — \`${formatDuration(total)}\``
        );
    }

    const embed = new EmbedBuilder()
        .setColor('#ffaa00')
        .setTitle('🏆 Schichten Verwaltung')
        .setDescription(lines.join('\n'))
        .setTimestamp();

    return interaction.reply({
        embeds: [embed],
        flags: 64
    });
}

function hasManagementPermission(interaction, data) {
    if (interaction.member.permissions.has('Administrator')) return true;

    if (!data.managementRoleIds || !data.managementRoleIds.length) return false;

    return data.managementRoleIds.some(roleId =>
        interaction.member.roles.cache.has(roleId)
    );
}

function checkBotRoles(interaction, dutyRole, offDutyRole) {
    const botMember = interaction.guild.members.me;

    if (dutyRole.position >= botMember.roles.highest.position) {
        return {
            ok: false,
            message: '⬆️ Stelle sicher das die Bot Rolle Hoch Genug ist'
        };
    }

    if (offDutyRole && offDutyRole.position >= botMember.roles.highest.position) {
        return {
            ok: false,
            message: '⬆️ Stelle sicher das die Bot Rolle Hoch Genug ist'
        };
    }

    return { ok: true };
}

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

async function sendShiftLog(guild, data, embed) {
    const logChannel = guild.channels.cache.get(data.logChannelId);

    if (logChannel) {
        await logChannel.send({
            embeds: [embed]
        }).catch(() => {});
    }
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    return `${days}T ${hours}H ${minutes}M ${seconds}S`;
}