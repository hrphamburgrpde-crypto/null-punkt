const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-channels')
        .setDescription('Löscht alle Kanäle mit Sicherheitsprüfung'),

    async execute(interaction) {
        if (interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({
                content: '❌ Nur der Server Owner darf diesen Command benutzen.',
                flags: 64
            });
        }

        const code = createCode();

        global.dangerDeleteSessions ??= new Map();
        global.dangerDeleteSessions.set(`${interaction.guild.id}_${interaction.user.id}`, {
            type: 'channels',
            code,
            step: 0
        });

        await interaction.user.send({
            embeds: [
                new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🔐 Sicherheitscode')
                    .setDescription(`Dein Code für **/delete-channels** lautet:\n\n\`${code}\``)
                    .setTimestamp()
            ]
        }).catch(() => {});

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('⚠️ Kanäle löschen')
            .setDescription('Gib zuerst den Sicherheitscode aus deiner DM ein.')
            .setTimestamp();

        const button = new ButtonBuilder()
            .setCustomId('danger_delete_code')
            .setLabel('Code eingeben')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔐');

        return interaction.reply({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(button)],
            flags: 64
        });
    }
};

function createCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}