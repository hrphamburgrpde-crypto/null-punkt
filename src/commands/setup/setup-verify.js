const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags
} = require('discord.js');

const VerifySystem = require('../../models/VerifySystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-verify')
        .setDescription('Erstellt ein Verify System')
        .addChannelOption(option =>
            option
                .setName('kanal')
                .setDescription('Der Verify Kanal')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName('captcha')
                .setDescription('Captcha aktivieren oder deaktivieren')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName('rolle_hinzufügen')
                .setDescription('Rolle nach Verify geben')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option
                .setName('rolle_entfernen')
                .setDescription('Rolle nach Verify entfernen')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Dafür brauchst du Administrator Rechte.',
                flags: MessageFlags.Ephemeral
            });
        }

        const channel = interaction.options.getChannel('kanal');
        const captchaEnabled = interaction.options.getBoolean('captcha');
        const verifyRole = interaction.options.getRole('rolle_hinzufügen');
        const removeRole = interaction.options.getRole('rolle_entfernen');

        await VerifySystem.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                channelId: channel.id,
                captchaEnabled,
                verifyRole: verifyRole ? verifyRole.id : null,
                removeRole: removeRole ? removeRole.id : null
            },
            { upsert: true, new: true }
        );

        const embed = new EmbedBuilder()
            .setColor('#00ff88')
            .setTitle('✅ Verifizierung')
            .setDescription('Klicke auf den Button, um dich zu verifizieren.')
            .addFields(
                {
                    name: '🛡️ Captcha',
                    value: captchaEnabled ? '`Aktiviert`' : '`Deaktiviert`',
                    inline: true
                },
                {
                    name: '🎭 Rolle erhalten',
                    value: verifyRole ? `${verifyRole}` : '`Keine`',
                    inline: true
                },
                {
                    name: '🗑️ Rolle entfernen',
                    value: removeRole ? `${removeRole}` : '`Keine`',
                    inline: true
                }
            )
            .setThumbnail(interaction.guild.iconURL())
            .setTimestamp();

        const button = new ButtonBuilder()
            .setCustomId('verify_button')
            .setLabel('Verifizieren')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        await channel.send({
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: `✅ Verify Panel wurde in ${channel} erstellt.`,
            flags: MessageFlags.Ephemeral
        });
    }
};