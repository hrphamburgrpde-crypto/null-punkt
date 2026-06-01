const {
    SlashCommandBuilder
} = require('discord.js');

const PremiumCode = require('../../models/PremiumCode');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium-code-delete')
        .setDescription('Löscht einen Premium Code')
        .addStringOption(option =>
            option
                .setName('code')
                .setDescription('Premium Code')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: '❌ Nur der Bot Owner darf Premium Codes löschen.',
                flags: 64
            });
        }

        const code = interaction.options.getString('code').toUpperCase();

        const deleted = await PremiumCode.findOneAndDelete({
            code
        });

        if (!deleted) {
            return interaction.reply({
                content: '❌ Dieser Premium Code wurde nicht gefunden.',
                flags: 64
            });
        }

        return interaction.reply({
            content: `✅ Premium Code \`${code}\` wurde gelöscht.`,
            flags: 64
        });
    }
};