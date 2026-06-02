const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const SecuritySystem = require('../../models/SecuritySystem');
const PremiumGuild = require('../../models/PremiumGuild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-lock')
        .setDescription('Premium: Aktiviert den Admin Lock Schutz'),

    async execute(interaction) {
        if (interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({
                content: '❌ Nur der Server Owner darf Admin Lock aktivieren.',
                flags: 64
            });
        }

        const premium = await PremiumGuild.findOne({
            guildId: interaction.guild.id,
            active: true
        });

        if (!premium || Date.now() > new Date(premium.expiresAt).getTime()) {
            return interaction.reply({
                content: '⭐ Dieses Feature ist nur für Premium Server verfügbar.',
                flags: 64
            });
        }

        await SecuritySystem.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                guildId: interaction.guild.id,
                adminLockEnabled: true
            },
            { upsert: true, new: true }
        );

        return interaction.reply({
            content: '🔒 Admin Lock wurde aktiviert.',
            flags: 64
        });
    }
};