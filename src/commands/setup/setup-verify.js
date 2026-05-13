const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-verify')
        .setDescription('Erstellt ein Verify Panel')
        .addChannelOption(option =>
            option
                .setName('kanal')
                .setDescription('Der Kanal für das Verify Panel')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName('rolle')
                .setDescription('Die Rolle die vergeben werden soll')
                .setRequired(true)
        ),

    async execute(interaction) {

        if (
            !interaction.member.permissions.has(PermissionFlagsBits.KickMembers) &&
            !interaction.member.permissions.has(PermissionFlagsBits.BanMembers)
        ) {
            return interaction.reply({
                content: '❌ Keine Rechte.',
                ephemeral: true
            });
        }

        const channel = interaction.options.getChannel('kanal');
        const role = interaction.options.getRole('rolle');

        const embed = new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle('✅ Verifizierung')
            .setDescription('Klicke auf den Button unten um dich zu verifizieren.')
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`verify_${role.id}`)
                .setLabel('Verifizieren')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success)
        );

        await channel.send({
            embeds: [embed],
            components: [row]
        });

        return interaction.reply({
            content: '✅ Verify Panel erstellt.',
            ephemeral: true
        });
    }
};