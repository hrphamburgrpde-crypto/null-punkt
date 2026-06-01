const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const PremiumGuild = require('../../models/PremiumGuild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium-server-invite')
        .setDescription('Setzt den Invite für die Premium Server Liste')
        .addStringOption(option =>
            option
                .setName('invite')
                .setDescription('Discord Invite Link')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (
            interaction.guild.ownerId !== interaction.user.id &&
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
        ) {
            return interaction.reply({
                content: '❌ Nur der Server Owner oder Administrator darf den Invite setzen.',
                flags: 64
            });
        }

        const invite = interaction.options.getString('invite');

        if (
            !invite.startsWith('https://discord.gg/') &&
            !invite.startsWith('discord.gg/') &&
            !invite.startsWith('https://discord.com/invite/')
        ) {
            return interaction.reply({
                content: '❌ Bitte gib einen gültigen Discord Invite an.',
                flags: 64
            });
        }

        const premium = await PremiumGuild.findOne({
            guildId: interaction.guild.id,
            active: true
        });

        if (!premium || Date.now() > new Date(premium.expiresAt).getTime()) {
            return interaction.reply({
                content: '❌ Dieser Server hat kein aktives Premium.',
                flags: 64
            });
        }

        premium.invite = invite;
        await premium.save();

        return interaction.reply({
            content: `✅ Premium Server Invite gespeichert:\n${invite}`,
            flags: 64
        });
    }
};