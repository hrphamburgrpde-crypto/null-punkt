const { Events, EmbedBuilder } = require('discord.js');
const LogChannel = require('../../models/LogChannel');

module.exports = {
    name: Events.MessageUpdate,

    async execute(oldMessage, newMessage) {
        if (!oldMessage.guild) return;
        if (!oldMessage.author) return;
        if (oldMessage.author.bot) return;

        if (oldMessage.content === newMessage.content) return;

        const data = await LogChannel.findOne({
            guildId: oldMessage.guild.id
        });

        if (!data) return;

        const logChannel = oldMessage.guild.channels.cache.get(data.channelId);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('✏️ Nachricht bearbeitet')
            .addFields(
                {
                    name: '👤 User',
                    value: `${oldMessage.author}`,
                    inline: true
                },
                {
                    name: '📍 Kanal',
                    value: `${oldMessage.channel}`,
                    inline: true
                },
                {
                    name: '📄 Alt',
                    value: oldMessage.content
                        ? `\`${oldMessage.content.slice(0, 1000)}\``
                        : '`Keine alte Nachricht`'
                },
                {
                    name: '📄 Neu',
                    value: newMessage.content
                        ? `\`${newMessage.content.slice(0, 1000)}\``
                        : '`Keine neue Nachricht`'
                }
            )
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    }
};