const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const { createGuildBackup } = require('../../utils/createBackup');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup-create')
        .setDescription('Erstellt ein Server Backup'),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Dafür brauchst du Administrator Rechte.',
                flags: 64
            });
        }

        await interaction.deferReply({ flags: 64 });

        const backup = await createGuildBackup(
            interaction.guild,
            interaction.user.id
        );

        return interaction.editReply({
            content: `✅ Backup erstellt.\n🆔 Backup ID: \`${backup.backupId}\``
        });
    }
};