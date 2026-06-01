const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const PremiumServerPanel = require('../../models/PremiumServerPanel');
const { createPremiumServerEmbed } = require('../../utils/premiumServerList');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium-server-panel')
        .setDescription('Erstellt das Premium Server Verzeichnis Panel'),

    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: '❌ Nur der Bot Owner darf dieses Panel erstellen.',
                flags: 64
            });
        }

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Du brauchst Administrator Rechte.',
                flags: 64
            });
        }

        const embed = await createPremiumServerEmbed(interaction.client);

        const msg = await interaction.channel.send({
            embeds: [embed]
        });

        await PremiumServerPanel.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                messageId: msg.id
            },
            {
                upsert: true,
                new: true
            }
        );

        return interaction.reply({
            content: '✅ Premium Server Panel wurde erstellt und wird alle 10 Minuten aktualisiert.',
            flags: 64
        });
    }
};