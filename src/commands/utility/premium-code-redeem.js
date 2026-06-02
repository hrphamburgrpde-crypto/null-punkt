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

        const existingCode = await PremiumCode.findOne({
            code: codeInput
        });

        if (!existingCode) {
            return interaction.reply({
                content: '❌ Dieser Premium Code existiert nicht.',
                flags: 64
            });
        }

        if (existingCode.usedBy.includes(interaction.guild.id)) {
            return interaction.reply({
                content: '❌ Dieser Server hat diesen Code bereits eingelöst.',
                flags: 64
            });
        }

        if (existingCode.usedBy.length >= existingCode.maxUses) {
            return interaction.reply({
                content: '❌ Dieser Premium Code wurde bereits maximal oft eingelöst.',
                flags: 64
            });
        }

        const updatedCode = await PremiumCode.findOneAndUpdate(
            {
                code: codeInput,
                usedBy: { $ne: interaction.guild.id },
                $expr: {
                    $lt: [
                        { $size: '$usedBy' },
                        '$maxUses'
                    ]
                }
            },
            {
                $addToSet: {
                    usedBy: interaction.guild.id
                }
            },
            {
                new: true
            }
        );

        if (!updatedCode) {
            return interaction.reply({
                content: '❌ Dieser Premium Code wurde gerade bereits maximal oft eingelöst.',
                flags: 64
            });
        }

        const expiresAt = new Date(Date.now() + updatedCode.durationMs);

        await PremiumGuild.findOneAndUpdate(
            {
                guildId: interaction.guild.id
            },
            {
                guildId: interaction.guild.id,
                active: true,
                expiresAt,
                activatedBy: interaction.user.id,
                code: updatedCode.code,
                activatedAt: new Date()
            },
            {
                upsert: true,
                new: true
            }
        );

        return interaction.reply({
            content:
                `✅ Premium wurde aktiviert!\n` +
                `⭐ Gültig bis: <t:${Math.floor(expiresAt.getTime() / 1000)}:F>\n` +
                `🔁 Nutzungen: \`${updatedCode.usedBy.length}/${updatedCode.maxUses}\``,
            flags: 64
        });
    }
};