const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');

const SecuritySystem = require('../../models/SecuritySystem');
const PremiumGuild = require('../../models/PremiumGuild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-security-alerts')
        .setDescription('Premium: Richtet Security Alerts ein')
        .addChannelOption(option =>
            option
                .setName('logkanal')
                .setDescription('Kanal für Security Alerts')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName('owner_dm')
                .setDescription('Soll der Owner per DM informiert werden?')
                .setRequired(false)
        ),

    async execute(interaction) {
        if (
            interaction.guild.ownerId !== interaction.user.id &&
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
        ) {
            return interaction.reply({
                content: '❌ Dafür brauchst du Administrator Rechte.',
                flags: 64
            });
        }

        const premium = await PremiumGuild.findOne({
            guildId: interaction.guild.id,
            active: true
        });

        if (!premium || Date.now() > new Date(premium.expiresAt).getTime()) {
            return interaction.reply({
                content: '⭐ Dieses Feature ist nur für Premium Server verfügbar.',
                flags: 64
            });
        }

        const logChannel = interaction.options.getChannel('logkanal');
        const ownerDm = interaction.options.getBoolean('owner_dm') ?? true;

        await SecuritySystem.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                guildId: interaction.guild.id,
                securityAlertsEnabled: true,
                alertLogChannelId: logChannel.id,
                ownerDmAlerts: ownerDm
            },
            { upsert: true, new: true }
        );

        return interaction.reply({
            content:
                `✅ Security Alerts aktiviert.\n` +
                `📍 Log Kanal: ${logChannel}\n` +
                `📩 Owner DM: \`${ownerDm ? 'Aktiviert' : 'Deaktiviert'}\``,
            flags: 64
        });
    }
};