const { SlashCommandBuilder } = require('discord.js');

const BotBan = require('../../models/BotBan');
const {
    updateBotBanPanels
} = require('../../utils/botBanList');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-sperre-entfernen')
        .setDescription('Bot Owner: Entfernt eine Bot Sperre')
        .addStringOption(option =>
            option
                .setName('userid')
                .setDescription('User ID')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: '❌ Nur der Bot Owner darf diesen Command benutzen.',
                flags: 64
            });
        }

        const userId = interaction.options.getString('userid');

        const deleted = await BotBan.findOneAndDelete({ userId });

        if (!deleted) {
            return interaction.reply({
                content: '❌ Dieser User ist nicht gesperrt.',
                flags: 64
            });
        }

        const user = await interaction.client.users.fetch(userId).catch(() => null);

        if (user) {
            await user.send({
                content:
                    `✅ Deine Bot-Sperre bei **Null Punkt** wurde entfernt.\n` +
                    `Du kannst den Bot jetzt wieder benutzen.`
            }).catch(() => {});
        }

        await updateBotBanPanels(interaction.client);

        return interaction.reply({
            content: `✅ Bot-Sperre für \`${userId}\` wurde entfernt.`,
            flags: 64
        });
    }
};