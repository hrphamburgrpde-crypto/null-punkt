const { Events, EmbedBuilder } = require('discord.js');
const LogChannel = require('../../models/LogChannel');

module.exports = {
    name: Events.MessageDelete,

    async execute(message) {
        if (!message.guild) return;
        if (!message.author) return;
        if (message.author.bot) return;

        const data = await LogChannel.findOne({
            guildId: message.guild.id
        });

        if (!data) return;

        const logChannel = message.guild.channels.cache.get(data.channelId);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('🗑️ Nachricht gelöscht')
            .addFields(
                {
                    name: '👤 User',
                    value: `${message.author}`,
                    inline: true
                },
                {
                    name: '📍 Kanal',
                    value: `${message.channel}`,
                    inline: true
                },
                {
                    name: '📄 Nachricht',
                    value: message.content
                        ? `\`${message.content.slice(0, 1000)}\``
                        : '`Keine Textnachricht / Embed / Attachment`'
                }
            )
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    }
};