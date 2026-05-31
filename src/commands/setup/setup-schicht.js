const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const ShiftSystem = require('../../models/ShiftSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-schicht')
        .setDescription('Erstellt ein Schicht System')
        .addChannelOption(option =>
            option
                .setName('panelkanal')
                .setDescription('Kanal für das Schicht Panel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName('duty_rolle')
                .setDescription('Rolle während der Schicht')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option
                .setName('logkanal')
                .setDescription('Schicht Log Kanal')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName('anti_offline_farming')
                .setDescription('Nach 5 Minuten offline automatisch auschecken?')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option
                .setName('off_duty_rolle')
                .setDescription('Rolle außerhalb der Schicht')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option
                .setName('verwaltung_rolle1')
                .setDescription('Verwaltungsrolle 1')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option
                .setName('verwaltung_rolle2')
                .setDescription('Verwaltungsrolle 2')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option
                .setName('verwaltung_rolle3')
                .setDescription('Verwaltungsrolle 3')
                .setRequired(false)
        ),

    async execute(interaction) {
        const allowed =
            interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
            interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
            interaction.member.permissions.has(PermissionFlagsBits.KickMembers) ||
            interaction.member.permissions.has(PermissionFlagsBits.BanMembers);

        if (!allowed) {
            return interaction.reply({
                content: '❌ Keine Rechte.',
                flags: 64
            });
        }

        const panelChannel = interaction.options.getChannel('panelkanal');
        const dutyRole = interaction.options.getRole('duty_rolle');
        const logChannel = interaction.options.getChannel('logkanal');
        const antiOffline = interaction.options.getBoolean('anti_offline_farming') || false;
        const offDutyRole = interaction.options.getRole('off_duty_rolle');

        const managementRoleIds = [];

        for (let i = 1; i <= 3; i++) {
            const role = interaction.options.getRole(`verwaltung_rolle${i}`);
            if (role) managementRoleIds.push(role.id);
        }

        await ShiftSystem.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                guildId: interaction.guild.id,
                panelChannelId: panelChannel.id,
                dutyRoleId: dutyRole.id,
                offDutyRoleId: offDutyRole ? offDutyRole.id : null,
                logChannelId: logChannel.id,
                antiOfflineFarming: antiOffline,
                managementRoleIds
            },
            {
                upsert: true,
                new: true
            }
        );

        const embed = new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle('🕒 Schicht System')
            .setDescription('Nutze die Buttons unten, um deine Schicht zu verwalten.')
            .addFields(
                {
                    name: '🟢 Duty Rolle',
                    value: `${dutyRole}`,
                    inline: true
                },
                {
                    name: '🔴 Off Duty Rolle',
                    value: offDutyRole ? `${offDutyRole}` : '`Keine`',
                    inline: true
                },
                {
                    name: '📡 Anti Offline Farming',
                    value: antiOffline ? '`Aktiviert`' : '`Deaktiviert`',
                    inline: true
                },
                {
                    name: '🛠️ Verwaltung',
                    value: managementRoleIds.length
                        ? managementRoleIds.map(id => `<@&${id}>`).join('\n')
                        : '`Keine Verwaltungsrollen`',
                    inline: false
                }
            )
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('shift_checkin')
                .setLabel('Einchecken')
                .setEmoji('🟢')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId('shift_checkout')
                .setLabel('Auschecken')
                .setEmoji('🔴')
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId('shift_current')
                .setLabel('Aktuelle Schichten')
                .setEmoji('📋')
                .setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('shift_manage')
                .setLabel('Verwaltung')
                .setEmoji('🛠️')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId('shift_times_manage')
                .setLabel('Schichten Verwaltung')
                .setEmoji('🏆')
                .setStyle(ButtonStyle.Secondary)
        );

        await panelChannel.send({
            embeds: [embed],
            components: [row1, row2]
        });

        return interaction.reply({
            content: `✅ Schicht System wurde in ${panelChannel} erstellt.`,
            flags: 64
        });
    }
};