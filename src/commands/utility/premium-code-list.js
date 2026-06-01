const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const PremiumCode = require('../../models/PremiumCode');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium-code-list')
        .setDescription('Listet Premium Codes auf'),

    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: '❌ Nur der Bot Owner darf Premium Codes sehen.',
                flags: 64
            });
        }

        const codes = await PremiumCode.find().sort({
            createdAt: -1
        }).limit(20);

        if (!codes.length) {
            return interaction.reply({
                content: '❌ Es gibt noch keine Premium Codes.',
                flags: 64
            });
        }

        const text = codes.map(code => {
            return `\`${code.code}\` • ${code.usedBy.length}/${code.maxUses} Nutzungen`;
        }).join('\n');

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('#ffd700')
                    .setTitle('⭐ Premium Codes')
                    .setDescription(text)
                    .setTimestamp()
            ],
            flags: 64
        });
    }
};