const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const ShiftTime = require('../../models/ShiftTime');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('time-lb')
        .setDescription('Zeigt die Schicht-Zeit Rangliste'),

    async execute(interaction) {
        const entries = await ShiftTime.find({
            guildId: interaction.guild.id
        }).sort({
            totalMs: -1
        }).limit(10);

        if (!entries.length) {
            return interaction.reply({
                content: '❌ Es gibt noch keine Schichtzeiten.',
                flags: 64
            });
        }

        const lines = [];

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];

            let totalMs = entry.totalMs || 0;

            if (entry.activeSince) {
                totalMs += Date.now() - new Date(entry.activeSince).getTime();
            }

            lines.push(
                `**${i + 1}.** <@${entry.userId}> — \`${formatDuration(totalMs)}\``
            );
        }

        const embed = new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle('🏆 Schicht Rangliste')
            .setDescription(lines.join('\n'))
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    return `${days}T ${hours}H ${minutes}M ${seconds}S`;
}