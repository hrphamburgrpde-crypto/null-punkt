const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const TeamDashboard = require('../../models/TeamDashboard');
const PremiumGuild = require('../../models/PremiumGuild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-team-dashboard')
        .setDescription('Richtet das Team Dashboard ein')

        .addRoleOption(option =>
            option
                .setName('manager_rolle')
                .setDescription('Manager Rolle')
                .setRequired(true)
        )

        .addRoleOption(option =>
            option
                .setName('moderator_rolle')
                .setDescription('Moderator Rolle')
                .setRequired(true)
        )

        .addRoleOption(option =>
            option
                .setName('support_rolle')
                .setDescription('Support Rolle')
                .setRequired(true)
        )

        .addChannelOption(option =>
            option
                .setName('log_kanal')
                .setDescription('Team Log Kanal')
                .setRequired(true)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {

        const managerRole =
            interaction.options.getRole('manager_rolle');

        const moderatorRole =
            interaction.options.getRole('moderator_rolle');

        const supportRole =
            interaction.options.getRole('support_rolle');

        const logChannel =
            interaction.options.getChannel('log_kanal');

        const premium = await PremiumGuild.findOne({
            guildId: interaction.guild.id,
            active: true
        });

        const maxMembers = premium ? 999999 : 100;

        await TeamDashboard.findOneAndUpdate(
            {
                guildId: interaction.guild.id
            },
            {
                guildId: interaction.guild.id,

                managerRoles: [
                    managerRole.id
                ],

                moderatorRoles: [
                    moderatorRole.id
                ],

                supportRoles: [
                    supportRole.id
                ],

                logChannel: logChannel.id,

                premium: !!premium,

                maxMembers
            },
            {
                upsert: true,
                new: true
            }
        );

        await interaction.reply({
            embeds: [
                {
                    color: 0x00ff88,
                    title: '✅ Team Dashboard eingerichtet',
                    fields: [
                        {
                            name: '👑 Manager',
                            value: `<@&${managerRole.id}>`
                        },
                        {
                            name: '🛡 Moderator',
                            value: `<@&${moderatorRole.id}>`
                        },
                        {
                            name: '🎫 Support',
                            value: `<@&${supportRole.id}>`
                        },
                        {
                            name: '📄 Log Kanal',
                            value: `<#${logChannel.id}>`
                        },
                        {
                            name: '👥 Team Limit',
                            value: premium
                                ? '∞ (Premium)'
                                : '100'
                        }
                    ]
                }
            ]
        });
    }
};