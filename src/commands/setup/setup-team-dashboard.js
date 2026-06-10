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
                .setDescription("Dashboard Zugriff")
                .setRequired(true)
        )

        .addRoleOption(option =>
            option
                .setName("manager_rolle")
                .setDescription("Manager Rolle")
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
            interaction.options.getRole(
                "dashboard_rolle"
            );

        const managerRole =
            interaction.options.getRole(
                "manager_rolle"
            );

        const uprankChannel =
            interaction.options.getChannel(
                "uprank_kanal"
            );

        const downrankChannel =
            interaction.options.getChannel(
                "downrank_kanal"
            );

        const warnChannel =
            interaction.options.getChannel(
                "warn_kanal"
            );

        const kickChannel =
            interaction.options.getChannel(
                "kick_kanal"
            );

        await TeamDashboard.findOneAndUpdate(
            {
                guildId: interaction.guild.id
            },
            {
                guildId: interaction.guild.id,

                dashboardRole:
                    dashboardRole.id,

                managerRole:
                    managerRole.id,

                uprankChannel:
                    uprankChannel.id,

                downrankChannel:
                    downrankChannel.id,

                warnChannel:
                    warnChannel.id,

                kickChannel:
                    kickChannel.id
            },
            {
                upsert: true,
                new: true
            }
        );

        await interaction.reply({
            embeds: [
                {
                    color: 0x57F287,
                    title:
                        "✅ Team Dashboard eingerichtet",

                    fields: [
                        {
                            name:
                                "👥 Dashboard Rolle",
                            value:
                                `<@&${dashboardRole.id}>`
                        },
                        {
                            name:
                                "🛡️ Manager Rolle",
                            value:
                                `<@&${managerRole.id}>`
                        },
                        {
                            name:
                                "📈 Uprank Logs",
                            value:
                                `<#${uprankChannel.id}>`
                        },
                        {
                            name:
                                "📉 Downrank Logs",
                            value:
                                `<#${downrankChannel.id}>`
                        },
                        {
                            name:
                                "⚠️ Warn Logs",
                            value:
                                `<#${warnChannel.id}>`
                        },
                        {
                            name:
                                "🚫 Kick Logs",
                            value:
                                `<#${kickChannel.id}>`
                        }
                    ]
                }
            ],
            ephemeral: true
        });

    }
};