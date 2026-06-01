const {
    SlashCommandBuilder
} = require('discord.js');

const PremiumCode = require('../../models/PremiumCode');
const PremiumGuild = require('../../models/PremiumGuild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium-code-redeem')
        .setDescription('Löst einen Premium Code ein')
        .addStringOption(option =>
            option
                .setName('code')
                .setDescription('Premium Code')
                .setRequired(true)
        ),

    async execute(interaction) {
        const codeInput = interaction.options.getString('code').toUpperCase();

        const code = await PremiumCode.findOne({
            code: codeInput
        });

        if (!code) {
            return interaction.reply({
                content: '❌ Dieser Premium Code existiert nicht.',
                flags: 64
            });
        }

        if (code.usedBy.includes(interaction.guild.id)) {
            return interaction.reply({
                content: '❌ Dieser Server hat diesen Code bereits eingelöst.',
                flags: 64
            });
        }

        if (code.usedBy.length >= code.maxUses) {
            return interaction.reply({
                content: '❌ Dieser Premium Code wurde bereits maximal oft eingelöst.',
                flags: 64
            });
        }

        const expiresAt = new Date(Date.now() + code.durationMs);

        await PremiumGuild.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                guildId: interaction.guild.id,
                active: true,
                expiresAt,
                activatedBy: interaction.user.id,
                code: code.code,
                activatedAt: new Date()
            },
            {
                upsert: true,
                new: true
            }
        );

        code.usedBy.push(interaction.guild.id);
        await code.save();

        return interaction.reply({
            content: `✅ Premium wurde aktiviert!\n⭐ Gültig bis: <t:${Math.floor(expiresAt.getTime() / 1000)}:F>`,
            flags: 64
        });
    }
};