const {
    Events,
    EmbedBuilder
} = require('discord.js');

const WelcomeSystem = require('../../models/WelcomeSystem');

module.exports = {
    name: Events.GuildMemberAdd,

    async execute(member) {
        const data = await WelcomeSystem.findOne({
            guildId: member.guild.id,
            enabled: true
        });

        if (!data || !data.channelId) return;

        const channel = member.guild.channels.cache.get(data.channelId);
        if (!channel) return;

        const embed = createEmbed(data, member);

        await channel.send({
            content: data.pingUser ? `${member}` : null,
            embeds: [embed]
        }).catch(() => {});
    }
};

function createEmbed(data, member) {
    const embed = new EmbedBuilder()
        .setTitle(replaceVars(data.title, member))
        .setDescription(replaceVars(data.message, member))
        .setTimestamp();

    if (data.color) embed.setColor(data.color);
    if (data.imageUrl) embed.setImage(replaceVars(data.imageUrl, member));
    if (data.thumbnailUrl) embed.setThumbnail(replaceVars(data.thumbnailUrl, member));

    return embed;
}

function replaceVars(text, member) {
    if (!text) return '';

    return text
        .replaceAll('{user}', `${member}`)
        .replaceAll('{username}', member.user.username)
        .replaceAll('{userid}', member.id)
        .replaceAll('{server}', member.guild.name)
        .replaceAll('{membercount}', `${member.guild.memberCount}`);
}