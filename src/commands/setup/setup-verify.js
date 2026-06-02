const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const VerifySystem = require('../../models/VerifySystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-verify')
        .setDescription('Erstellt ein Verify Panel')
        .addChannelOption(option =>
            option
                .setName('kanal')
                .setDescription('Kanal für das Verify Panel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName('rolle_hinzufuegen')
                .setDescription('Rolle, die nach der Verifizierung gegeben wird')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName('captcha')
                .setDescription('Captcha aktivieren?')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName('rolle_entfernen')
                .setDescription('Rolle, die nach der Verifizierung entfernt wird')
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

        const channel = interaction.options.getChannel('kanal');
        const addRole = interaction.options.getRole('rolle_hinzufuegen');
        const removeRole = interaction.options.getRole('rolle_entfernen');
        const captcha = interaction.options.getBoolean('captcha');

        await VerifySystem.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                guildId: interaction.guild.id,
                channelId: channel.id,
                addRoleId: addRole.id,
                removeRoleId: removeRole ? removeRole.id : null,
                captchaEnabled: captcha
            },
            {
                upsert: true,
                new: true
            }
        );

        const embed = new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle('✅ Verifizierung')
            .setDescription(
                captcha
                    ? 'Klicke auf den Button und löse das Captcha.'
                    : 'Klicke auf den Button, um dich zu verifizieren.'
            )
            .addFields(
                {
                    name: '➕ Rolle hinzufügen',
                    value: `${addRole}`,
                    inline: true
                },
                {
                    name: '➖ Rolle entfernen',
                    value: removeRole ? `${removeRole}` : '`Keine`',
                    inline: true
                },
                {
                    name: '🔐 Captcha',
                    value: captcha ? '`Aktiviert`' : '`Deaktiviert`',
                    inline: true
                }
            )
            .setTimestamp();

        const button = new ButtonBuilder()
            .setCustomId('verify_start_v2')
            .setLabel('Verifizieren')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);

        await channel.send({
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(button)
            ]
        });

        return interaction.reply({
            content: `✅ Verify Panel wurde in ${channel} erstellt.`,
            flags: 64
        });
    }
};