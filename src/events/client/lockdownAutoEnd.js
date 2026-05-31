const {
    Events
} = require('discord.js');

const LockdownSystem = require('../../models/LockdownSystem');
const { endLockdown } = require('../../commands/utility/server-unlockdown');

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        console.log('✅ Lockdown AutoEnd System gestartet');

        setInterval(async () => {
            const activeLockdowns = await LockdownSystem.find({
                active: true,
                endsAt: { $ne: null }
            });

            for (const lockdown of activeLockdowns) {
                if (Date.now() < new Date(lockdown.endsAt).getTime()) continue;

                const guild = client.guilds.cache.get(lockdown.guildId);
                if (!guild) continue;

                await endLockdown(guild, lockdown, null);
            }
        }, 30 * 1000);
    }
};