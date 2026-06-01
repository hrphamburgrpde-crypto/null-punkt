const {
    Events
} = require('discord.js');

const PremiumServerPanel = require('../../models/PremiumServerPanel');
const { createPremiumServerEmbed } = require('../../utils/premiumServerList');

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        console.log('✅ Premium Server Panel Updater gestartet');

        setInterval(async () => {
            const panels = await PremiumServerPanel.find();

            for (const panel of panels) {
                const guild = client.guilds.cache.get(panel.guildId);
                if (!guild) continue;

                const channel = guild.channels.cache.get(panel.channelId);
                if (!channel) continue;

                const message = await channel.messages.fetch(panel.messageId).catch(() => null);
                if (!message) continue;

                const embed = await createPremiumServerEmbed(client);

                await message.edit({
                    embeds: [embed]
                }).catch(() => {});
            }
        }, 10 * 60 * 1000);
    }
};