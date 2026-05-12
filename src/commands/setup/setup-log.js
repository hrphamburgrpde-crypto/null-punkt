const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const LogChannel = require('../../models/LogChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-log')
        .setDescription('Setzt den Log Channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Der Log Channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Dafür brauchst du Administrator Rechte.',
                flags: MessageFlags.Ephemeral
            });
        }

        const channel = interaction.options.getChannel('channel');

        await LogChannel.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { channelId: channel.id },
            { upsert: true, new: true }
        );

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('✅ Log Channel gesetzt')
            .setDescription(`Logs werden jetzt in ${channel} gesendet.`)
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }
};