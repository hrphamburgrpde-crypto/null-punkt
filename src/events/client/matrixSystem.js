const {
    Events
} = require('discord.js');

const MatrixSystem = require('../../models/MatrixSystem');
const PremiumGuild = require('../../models/PremiumGuild');

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        console.log('✅ Matrix System gestartet');

        setInterval(async () => {
            const entries = await MatrixSystem.find({
                enabled: true
            });

            for (const entry of entries) {
                const premium = await PremiumGuild.findOne({
                    guildId: entry.guildId,
                    active: true
                });

                if (!premium || Date.now() > new Date(premium.expiresAt).getTime()) {
                    entry.enabled = false;
                    await entry.save();
                    continue;
                }

                const guild = client.guilds.cache.get(entry.guildId);
                if (!guild) continue;

                const channel = guild.channels.cache.get(entry.channelId);
                if (!channel) continue;

                const now = Date.now();

                if (!entry.lastRunAt) {
                    entry.lastRunAt = new Date(0);
                }

                const lastRun = new Date(entry.lastRunAt).getTime();

                if (now - lastRun < entry.intervalMs) continue;

                const nextName = entry.current === 1
                    ? entry.name2
                    : entry.name1;

                await channel.setName(nextName).catch(() => {});

                entry.current = entry.current === 1 ? 2 : 1;
                entry.lastRunAt = new Date();
                await entry.save();
            }
        }, 10 * 1000);
    }
};