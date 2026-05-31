const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const Backup = require('../../models/Backup');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup-delete')
        .setDescription('Löscht ein Backup')
        .addStringOption(option =>
            option
                .setName('backup_id')
                .setDescription('Die Backup ID')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Dafür brauchst du Administrator Rechte.',
                flags: 64
            });
        }

        const backupId = interaction.options.getString('backup_id');

        const backup = await Backup.findOne({
            guildId: interaction.guild.id,
            backupId
        });

        if (!backup) {
            return interaction.reply({
                content: '❌ Dieses Backup wurde nicht gefunden.',
                flags: 64
            });
        }

        await Backup.deleteOne({
            guildId: interaction.guild.id,
            backupId
        });

        return interaction.reply({
            content: `✅ Backup \`${backupId}\` wurde gelöscht.`,
            flags: 64
        });
    }
};