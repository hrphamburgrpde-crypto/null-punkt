const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const WarnAppealChannel = require('../../models/WarnAppealChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-warn-einspruch')
        .setDescription('Setzt den Warn Einspruch Kanal')
        .addChannelOption(option =>
            option
                .setName('kanal')
                .setDescription('Der Einspruch Kanal')
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

        const channel = interaction.options.getChannel('kanal');

        await WarnAppealChannel.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { channelId: channel.id },
            { upsert: true, new: true }
        );

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('✅ Warn Einspruch Kanal gesetzt')
            .setDescription(`Einsprüche werden jetzt in ${channel} gesendet.`)
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }
};