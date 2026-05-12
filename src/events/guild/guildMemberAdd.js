const { EmbedBuilder } = require('discord.js');
const getLogChannel = require('../../utils/getLogChannel');

module.exports = {

    name: 'guildMemberAdd',

    async execute(member) {

        const logChannel =
            getLogChannel(member.guild);

        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('📥 User gejoint')
            .setDescription(`${member.user.tag}`)
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    }
};