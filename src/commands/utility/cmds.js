const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cmds')
        .setDescription('Zeigt alle Bot Commands'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle('📋 Null Punkt Commands')
            .setDescription('Hier findest du alle verfügbaren Commands.')
            .addFields(
                {
                    name: '🛡️ Moderation',
                    value:
                        '`/ban`\n' +
                        '`/kick`\n' +
                        '`/timeout`\n' +
                        '`/warn`\n' +
                        '`/warnings`\n' +
                        '`/remove-warn`',
                    inline: true
                },
                {
                    name: '⚙️ Setup',
                    value:
                        '`/setup-verify`\n' +
                        '`/setup-ticket`\n' +
                        '`/setup-bewerbung`\n' +
                        '`/setup-log`\n' +
                        '`/setup-schicht`\n' +
                        '`/setup-automod`\n' +
                        '`/setup-autobackup`\n' +
                        '`/setup-welcome`\n' +
                        '`/setup-goodbye`',
                    inline: true
                },
                {
                    name: '📦 Backup',
                    value:
                        '`/backup-create`\n' +
                        '`/backup-load`\n' +
                        '`/backup-list`\n' +
                        '`/backup-delete`',
                    inline: true
                },
                {
                    name: '🕒 Schicht System',
                    value:
                        '`/time-lb`',
                    inline: true
                },
                {
                    name: '📝 Embed / Utility',
                    value:
                        '`/send-embed`\n' +
                        '`/global-stats`\n' +
                        '`/live-ping`\n' +
                        '`/ping`\n' +
                        '`/welcome-preview`\n' +
                        '`/goodbye-preview`',
                    inline: true
                },
                {
                    name: '🔒 Sicherheit',
                    value:
                        '`/server-lockdown`\n' +
                        '`/server-unlockdown`\n' +
                        '`/delete-roles`\n' +
                        '`/delete-channels`',
                    inline: true
                },
                {
                    name: '📄 Sonstiges',
                    value:
                        '`/create-formula`',
                    inline: true
                }
            )
            .setFooter({
                text: `Angefragt von ${interaction.user.tag}`
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
            flags: 64
        });
    }
};