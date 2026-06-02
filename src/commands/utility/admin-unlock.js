const {
    SlashCommandBuilder
} = require('discord.js');

const SecuritySystem = require('../../models/SecuritySystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-unlock')
        .setDescription('Deaktiviert den Admin Lock Schutz'),

    async execute(interaction) {
        if (interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({
                content: '❌ Nur der Server Owner darf Admin Lock deaktivieren.',
                flags: 64
            });
        }

        await SecuritySystem.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                guildId: interaction.guild.id,
                adminLockEnabled: false
            },
            { upsert: true, new: true }
        );

        return interaction.reply({
            content: '🔓 Admin Lock wurde deaktiviert.',
            flags: 64
        });
    }
};