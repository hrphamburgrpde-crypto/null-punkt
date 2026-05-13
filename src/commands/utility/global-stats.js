const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('global-stats')
        .setDescription('Zeigt globale Bot Statistiken an'),

    async execute(interaction, client) {

        const guilds = client.guilds.cache.size;

        const users = client.guilds.cache.reduce(
            (acc, guild) => acc + guild.memberCount,
            0
        );

        const channels = client.channels.cache.size;

        const uptime = formatTime(client.uptime);

        const embed = new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle('🌍 Globale Bot Statistiken')
            .addFields(
                {
                    name: '🖥️ Server',
                    value: `\`${guilds}\``,
                    inline: true
                },
                {
                    name: '👥 Mitglieder',
                    value: `\`${users}\``,
                    inline: true
                },
                {
                    name: '💬 Kanäle',
                    value: `\`${channels}\``,
                    inline: true
                },
                {
                    name: '⏱️ Uptime',
                    value: `\`${uptime}\``,
                    inline: true
                },
                {
                    name: '🤖 Bot',
                    value: `${client.user}`,
                    inline: true
                }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};

function formatTime(ms) {

    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    return `${days}T ${hours}H ${minutes}M ${seconds}S`;
}