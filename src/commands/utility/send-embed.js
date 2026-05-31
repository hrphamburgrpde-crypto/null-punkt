const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send-embed')
        .setDescription('Sende ein Embed mit eigenem Text')
        .addStringOption(option =>
            option
                .setName('farbe')
                .setDescription('Wähle die Embed Farbe')
                .setRequired(true)
                .addChoices(
                    { name: 'Keine Farbe', value: 'none' },
                    { name: 'Blau', value: 'blue' },
                    { name: 'Rot', value: 'red' },
                    { name: 'Grün', value: 'green' },
                    { name: 'Gelb', value: 'yellow' },
                    { name: 'Lila', value: 'purple' },
                    { name: 'Orange', value: 'orange' },
                    { name: 'Schwarz', value: 'black' },
                    { name: 'Grau', value: 'gray' },
                    { name: 'Pink', value: 'pink' },
                    { name: 'Türkis', value: 'turquoise' },
                    { name: 'Weiß', value: 'white' },
                    { name: 'Gold', value: 'gold' },
                    { name: 'Dunkelblau', value: 'dark_blue' },
                    { name: 'Dunkelrot', value: 'dark_red' },
                    { name: 'Dunkelgrün', value: 'dark_green' }
                )
        ),

    async execute(interaction) {
        const allowed =
            interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
            interaction.member.permissions.has(PermissionFlagsBits.KickMembers) ||
            interaction.member.permissions.has(PermissionFlagsBits.BanMembers) ||
            interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!allowed) {
            return interaction.reply({
                content: '❌ Du brauchst Timeout-, Kick- oder Ban-Rechte.',
                flags: 64
            });
        }

        const color = interaction.options.getString('farbe');

        const modal = new ModalBuilder()
            .setCustomId(`send_embed_modal_${color}`)
            .setTitle('Embed erstellen');

        const titleInput = new TextInputBuilder()
            .setCustomId('embed_title')
            .setLabel('Embed Überschrift')
            .setPlaceholder('Schreibe hier die Überschrift...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(256);

        const textInput = new TextInputBuilder()
            .setCustomId('embed_text')
            .setLabel('Embed Text')
            .setPlaceholder('Hier kannst du auch mehrere Zeilen schreiben.')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4000);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(textInput)
        );

        return interaction.showModal(modal);
    }
};