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
        .setName('timeout')
        .setDescription('Timeoutet einen User')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('dauer')
                .setDescription('Dauer in Minuten')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('grund')
                .setDescription('Grund')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {

        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: '❌ Keine Rechte.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('dauer');
        const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';

        const member = await interaction.guild.members.fetch(user.id);

        if (!member.moderatable)
            return interaction.reply({ content: '❌ Kann User nicht timeouten.', ephemeral: true });

        await member.timeout(duration * 60 * 1000, reason);

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('⏳ Timeout')
            .addFields(
                { name: 'User', value: user.tag, inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Dauer', value: `${duration} Minuten`, inline: true },
                { name: 'Grund', value: reason }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        const log = getLogChannel(interaction.guild);
        if (log) log.send({ embeds: [embed] });
    }
};