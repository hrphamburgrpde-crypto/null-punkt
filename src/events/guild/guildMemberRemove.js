const { EmbedBuilder } = require('discord.js');
const getLogChannel = require('../../utils/getLogChannel');

module.exports = {

    name: 'guildMemberRemove',

    async execute(member) {

        const logChannel =
            getLogChannel(member.guild);

        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('📤 User left')
            .setDescription(`${member.user.tag}`)
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    }
};