const {
    SlashCommandBuilder
} = require('discord.js');

const PremiumCode = require('../../models/PremiumCode');

const durations = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '365d': 365 * 24 * 60 * 60 * 1000
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium-code-create')
        .setDescription('Erstellt einen Premium Code')
        .addStringOption(option =>
            option
                .setName('code')
                .setDescription('Premium Code')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('nutzungen')
                .setDescription('Wie oft darf der Code eingelöst werden?')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addStringOption(option =>
            option
                .setName('dauer')
                .setDescription('Premium Dauer')
                .setRequired(true)
                .addChoices(
                    { name: '7 Tage', value: '7d' },
                    { name: '30 Tage', value: '30d' },
                    { name: '90 Tage', value: '90d' },
                    { name: '365 Tage', value: '365d' }
                )
        ),

    async execute(interaction) {

        console.log('========== PREMIUM DEBUG ==========');
        console.log('OWNER_ID:', process.env.OWNER_ID);
        console.log('USER_ID:', interaction.user.id);
        console.log('===================================');

        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content:
                    `❌ Nur der Bot Owner darf Premium Codes erstellen.\n\n` +
                    `👤 Deine ID:\n\`${interaction.user.id}\`\n\n` +
                    `⚙️ OWNER_ID aus Railway:\n\`${process.env.OWNER_ID || 'NICHT GESETZT'}\``,
                flags: 64
            });
        }

        const code = interaction.options
            .getString('code')
            .toUpperCase();

        const maxUses = interaction.options.getInteger('nutzungen');
        const duration = interaction.options.getString('dauer');

        const exists = await PremiumCode.findOne({
            code
        });

        if (exists) {
            return interaction.reply({
                content: '❌ Dieser Premium Code existiert bereits.',
                flags: 64
            });
        }

        await PremiumCode.create({
            code,
            maxUses,
            durationMs: durations[duration],
            createdBy: interaction.user.id
        });

        return interaction.reply({
            content:
                `✅ Premium Code erstellt.\n\n` +
                `🆔 Code: \`${code}\`\n` +
                `🔁 Nutzungen: \`${maxUses}\`\n` +
                `⏱️ Dauer: \`${duration}\``,
            flags: 64
        });
    }
};