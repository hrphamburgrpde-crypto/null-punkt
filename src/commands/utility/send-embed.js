const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send-embed')
        .setDescription('Sende ein Embed als Bot')
        .addStringOption(option =>
            option
                .setName('titel')
                .setDescription('Titel vom Embed')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('text')
                .setDescription('Text vom Embed')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('farbe')
                .setDescription('Embed Farbe HEX z.B. #00ff88')
                .setRequired(false)
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

        const titel = interaction.options.getString('titel');
        const text = interaction.options.getString('text');
        const farbe = interaction.options.getString('farbe') || '#00aaff';

        const embed = new EmbedBuilder()
            .setColor(farbe)
            .setTitle(titel)
            .setDescription(text)
            .setTimestamp();

        await interaction.channel.send({
            embeds: [embed]
        });

        return interaction.reply({
            content: '✅ Embed gesendet.',
            ephemeral: true
        });
    }
};