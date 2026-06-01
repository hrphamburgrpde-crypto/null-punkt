const {
    EmbedBuilder
} = require('discord.js');

const PremiumGuild = require('../models/PremiumGuild');

async function createPremiumServerEmbed(client) {
    const premiumServers = await PremiumGuild.find({
        active: true,
        invite: { $ne: null }
    }).sort({
        activatedAt: -1
    });

    const lines = [];

    let index = 1;

    for (const premium of premiumServers) {
        if (!premium.expiresAt || Date.now() > new Date(premium.expiresAt).getTime()) {
            premium.active = false;
            await premium.save();
            continue;
        }

        const guild = client.guilds.cache.get(premium.guildId);

        if (!guild) continue;

        lines.push(
            `**#${index} ⭐ ${guild.name}**\n` +
            `👥 Mitglieder: \`${guild.memberCount}\`\n` +
            `🔗 ${premium.invite}\n` +
            `⏱️ Premium bis: <t:${Math.floor(new Date(premium.expiresAt).getTime() / 1000)}:R>`
        );

        index++;
    }

    return new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('⭐ Premium Server Verzeichnis')
        .setDescription(
            lines.length
                ? lines.join('\n\n')
                : 'Aktuell sind keine Premium Server eingetragen.'
        )
        .setFooter({
            text: 'Wird automatisch alle 10 Minuten aktualisiert'
        })
        .setTimestamp();
}

module.exports = {
    createPremiumServerEmbed
};