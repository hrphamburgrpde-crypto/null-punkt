const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const PremiumGuild = require('../../models/PremiumGuild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium-status')
        .setDescription('Zeigt den Premium Status dieses Servers'),

    async execute(interaction) {
        const premium = await PremiumGuild.findOne({
            guildId: interaction.guild.id
        });

        if (!premium || !premium.active || Date.now() > new Date(premium.expiresAt).getTime()) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('⭐ Premium Status')
                        .setDescription('❌ Dieser Server hat aktuell kein aktives Premium.')
                        .setTimestamp()
                ],
                flags: 64
            });
        }

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('#ffd700')
                    .setTitle('⭐ Premium Status')
                    .setDescription('✅ Dieser Server hat aktives Premium.')
                    .addFields(
                        {
                            name: '⏱️ Läuft ab',
                            value: `<t:${Math.floor(new Date(premium.expiresAt).getTime() / 1000)}:R>`,
                            inline: true
                        },
                        {
                            name: '👤 Aktiviert von',
                            value: `<@${premium.activatedBy}>`,
                            inline: true
                        },
                        {
                            name: '🆔 Code',
                            value: `\`${premium.code}\``,
                            inline: true
                        }
                    )
                    .setTimestamp()
            ],
            flags: 64
        });
    }
};