const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const Backup = require('../../models/Backup');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup-list')
        .setDescription('Zeigt alle Backups dieses Servers'),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Dafür brauchst du Administrator Rechte.',
                flags: 64
            });
        }

        const backups = await Backup.find({
            guildId: interaction.guild.id
        }).sort({
            createdAt: -1
        }).limit(10);

        if (!backups.length) {
            return interaction.reply({
                content: '❌ Es gibt noch keine Backups.',
                flags: 64
            });
        }

        const text = backups.map((backup, index) => {
            return `**${index + 1}.** \`${backup.backupId}\` • <t:${Math.floor(backup.createdAt.getTime() / 1000)}:R>`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle('📦 Server Backups')
            .setDescription(text)
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
            flags: 64
        });
    }
};