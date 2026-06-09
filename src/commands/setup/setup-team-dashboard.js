const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

const TeamDashboard = require("../../models/TeamDashboard");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup-team-dashboard")
        .setDescription("Richtet das Team Dashboard ein")

        .addRoleOption(option =>
            option
                .setName("dashboard_rolle")
                .setDescription("Wer darf das Dashboard nutzen")
                .setRequired(true)
        )

        .addRoleOption(option =>
            option
                .setName("manager_rolle")
                .setDescription("Manager Rolle")
                .setRequired(true)
        )

        .addRoleOption(option =>
            option
                .setName("support_rolle")
                .setDescription("Support Rolle")
                .setRequired(true)
        )

        .addRoleOption(option =>
            option
                .setName("moderator_rolle")
                .setDescription("Moderator Rolle")
                .setRequired(true)
        )

        .addRoleOption(option =>
            option
                .setName("admin_rolle")
                .setDescription("Administrator Rolle")
                .setRequired(true)
        )

        .addChannelOption(option =>
            option
                .setName("uprank_kanal")
                .setDescription("Uprank Logs")
                .setRequired(true)
        )

        .addChannelOption(option =>
            option
                .setName("downrank_kanal")
                .setDescription("Downrank Logs")
                .setRequired(true)
        )

        .addChannelOption(option =>
            option
                .setName("warn_kanal")
                .setDescription("Warn Logs")
                .setRequired(true)
        )

        .addChannelOption(option =>
            option
                .setName("kick_kanal")
                .setDescription("Kick Logs")
                .setRequired(true)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {

        const dashboardRole =
            interaction.options.getRole("dashboard_rolle");

        const managerRole =
            interaction.options.getRole("manager_rolle");

        const supportRole =
            interaction.options.getRole("support_rolle");

        const moderatorRole =
            interaction.options.getRole("moderator_rolle");

        const adminRole =
            interaction.options.getRole("admin_rolle");

        const uprankChannel =
            interaction.options.getChannel("uprank_kanal");

        const downrankChannel =
            interaction.options.getChannel("downrank_kanal");

        const warnChannel =
            interaction.options.getChannel("warn_kanal");

        const kickChannel =
            interaction.options.getChannel("kick_kanal");

        await TeamDashboard.findOneAndUpdate(
            {
                guildId: interaction.guild.id
            },
            {
                guildId: interaction.guild.id,

                dashboardRole: dashboardRole.id,
                managerRole: managerRole.id,

                supportRole: supportRole.id,
                moderatorRole: moderatorRole.id,
                adminRole: adminRole.id,

                uprankChannel: uprankChannel.id,
                downrankChannel: downrankChannel.id,
                warnChannel: warnChannel.id,
                kickChannel: kickChannel.id
            },
            {
                upsert: true,
                new: true
            }
        );

        return interaction.reply({
            embeds: [
                {
                    color: 0x5865F2,
                    title: "✅ Team Dashboard eingerichtet",
                    description:
                        "Das Team Dashboard wurde erfolgreich konfiguriert.",

                    fields: [
                        {
                            name: "Dashboard Rolle",
                            value: `<@&${dashboardRole.id}>`
                        },
                        {
                            name: "Manager Rolle",
                            value: `<@&${managerRole.id}>`
                        },
                        {
                            name: "Support Rolle",
                            value: `<@&${supportRole.id}>`
                        },
                        {
                            name: "Moderator Rolle",
                            value: `<@&${moderatorRole.id}>`
                        },
                        {
                            name: "Admin Rolle",
                            value: `<@&${adminRole.id}>`
                        }
                    ]
                }
            ]
        });
    }
};