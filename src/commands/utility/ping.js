const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Zeigt Bot Performance'),

    async execute(interaction, client) {

        await interaction.reply({
            content: '🦺 Ping wird gemessen...'
        });

        const sent = await interaction.fetchReply();

        const botLatency =
            sent.createdTimestamp -
            interaction.createdTimestamp;

        const apiLatency =
            Math.round(client.ws.ping);

        const uptimeSeconds =
            Math.floor(process.uptime());

        const uptime =
            `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`;

        const score =
            Math.max(0, 100 - (botLatency + apiLatency) / 5);

        let status = '🟢 Sehr gut';
        if (score < 70) status = '🟡 Mittel';
        if (score < 40) status = '🔴 Schlecht';

        const embed = new EmbedBuilder()
            .setColor(
                score > 70 ? 'Green' :
                score > 40 ? 'Yellow' : 'Red'
            )
            .setTitle('Ping erfolgreich berechnet!')
            .addFields(
                {
                    name: '📡 API Ping',
                    value: `${apiLatency}ms`,
                    inline: true
                },
                {
                    name: '⚡ Bot Latenz',
                    value: `${botLatency}ms`,
                    inline: true
                },
                {
                    name: '⏱️ Uptime',
                    value: uptime,
                    inline: true
                },
                {
                    name: '📊 Status',
                    value: status,
                    inline: true
                },
                {
                    name: '📈 Score',
                    value: `${score.toFixed(1)} / 100`,
                    inline: true
                }
            )
            .setFooter({
                text: `${client.user.username} System`
            })
            .setTimestamp();

        await interaction.editReply({
            content: null,
            embeds: [embed]
        });
    }
};