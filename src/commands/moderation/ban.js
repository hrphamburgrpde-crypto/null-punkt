const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

function getLogChannel(guild) {
    const filePath = path.join(__dirname, '../../data/logs.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return guild.channels.cache.get(data[guild.id]);
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bannt einen User')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('grund')
                .setDescription('Grund')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {

        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: '❌ Keine Rechte.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';

        if (user.id === interaction.user.id)
            return interaction.reply({ content: '❌ Self-Ban geht nicht.', ephemeral: true });

        const member = await interaction.guild.members.fetch(user.id);

        if (!member.bannable)
            return interaction.reply({ content: '❌ Kann User nicht bannen.', ephemeral: true });

        await member.ban({ reason });

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('🔨 Ban')
            .addFields(
                { name: 'User', value: user.tag, inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Grund', value: reason }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        const log = getLogChannel(interaction.guild);
        if (log) log.send({ embeds: [embed] });
    }
};