const {
    Events,
    EmbedBuilder
} = require('discord.js');

const AutoBackup = require('../../models/AutoBackup');
const { createGuildBackup } = require('../../utils/createBackup');

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        console.log('✅ AutoBackup System gestartet');

        setInterval(async () => {
            const settings = await AutoBackup.find({
                enabled: true
            });

            for (const setting of settings) {
                const guild = client.guilds.cache.get(setting.guildId);
                if (!guild) continue;

                const last = setting.lastBackupAt
                    ? new Date(setting.lastBackupAt).getTime()
                    : 0;

                const next = last + setting.intervalMs;

                if (Date.now() < next) continue;

                const backup = await createGuildBackup(guild, 'AUTO');

                setting.lastBackupAt = new Date();
                await setting.save();

                const logChannel = setting.logChannelId
                    ? guild.channels.cache.get(setting.logChannelId)
                    : null;

                if (logChannel) {
                    await logChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#00ff88')
                                .setTitle('📦 AutoBackup erstellt')
                                .addFields(
                                    {
                                        name: '🆔 Backup ID',
                                        value: `\`${backup.backupId}\``,
                                        inline: true
                                    },
                                    {
                                        name: '🔁 Wiederholung',
                                        value: `\`${formatInterval(setting.intervalMs)}\``,
                                        inline: true
                                    }
                                )
                                .setTimestamp()
                        ]
                    }).catch(() => {});
                }
            }
        }, 60 * 1000);
    }
};

function formatInterval(ms) {
    const hours = ms / 1000 / 60 / 60;

    if (hours < 24) return `${hours} Stunden`;

    return `${hours / 24} Tage`;
}