const { EmbedBuilder } = require('discord.js');

const BotBan = require('../models/BotBan');
const BotBanPanel = require('../models/BotBanPanel');

async function createBotBanEmbed(client) {
    const bans = await BotBan.find().sort({ createdAt: -1 });

    const lines = [];

    for (let i = 0; i < bans.length; i++) {
        const ban = bans[i];
        const user = await client.users.fetch(ban.userId).catch(() => null);

        lines.push(
            `**${i + 1}.** ${user ? `${user.tag}` : ban.username || 'Unbekannt'}\n` +
            `🆔 \`${ban.userId}\`\n` +
            `👮 Gesperrt von: <@${ban.bannedBy}>\n` +
            `📅 <t:${Math.floor(new Date(ban.createdAt).getTime() / 1000)}:R>`
        );
    }

    return new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🚫 Bot Sperrliste')
        .setDescription(lines.length ? lines.join('\n\n') : 'Aktuell ist niemand gesperrt.')
        .setTimestamp();
}

async function updateBotBanPanels(client) {
    const panels = await BotBanPanel.find();

    for (const panel of panels) {
        const guild = client.guilds.cache.get(panel.guildId);
        if (!guild) continue;

        const channel = guild.channels.cache.get(panel.channelId);
        if (!channel) continue;

        const message = await channel.messages.fetch(panel.messageId).catch(() => null);
        if (!message) continue;

        const embed = await createBotBanEmbed(client);

        await message.edit({ embeds: [embed] }).catch(() => {});
    }
}

module.exports = {
    createBotBanEmbed,
    updateBotBanPanels
};