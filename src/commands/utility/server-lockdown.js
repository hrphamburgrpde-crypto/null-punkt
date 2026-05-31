const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require('discord.js');

const LockdownSystem = require('../../models/LockdownSystem');

const durations = {
    '5m': 5 * 60 * 1000,
    '10m': 10 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '3h': 3 * 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    'manual': null
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-lockdown')
        .setDescription('Sperrt alle Textkanäle temporär')
        .addStringOption(option =>
            option
                .setName('dauer')
                .setDescription('Wie lange soll der Lockdown aktiv sein?')
                .setRequired(true)
                .addChoices(
                    { name: '5 Minuten', value: '5m' },
                    { name: '10 Minuten', value: '10m' },
                    { name: '30 Minuten', value: '30m' },
                    { name: '1 Stunde', value: '1h' },
                    { name: '3 Stunden', value: '3h' },
                    { name: '6 Stunden', value: '6h' },
                    { name: 'Manuell beenden', value: 'manual' }
                )
        )
        .addStringOption(option =>
            option
                .setName('grund')
                .setDescription('Grund für den Lockdown')
                .setRequired(false)
        ),

    async execute(interaction) {
        if (
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
            interaction.guild.ownerId !== interaction.user.id
        ) {
            return interaction.reply({
                content: '❌ Dafür brauchst du Administrator Rechte.',
                flags: 64
            });
        }

        await interaction.deferReply({ flags: 64 });

        const existing = await LockdownSystem.findOne({
            guildId: interaction.guild.id,
            active: true
        });

        if (existing) {
            return interaction.editReply({
                content: '❌ Auf diesem Server läuft bereits ein Lockdown.'
            });
        }

        const durationKey = interaction.options.getString('dauer');
        const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';
        const durationMs = durations[durationKey];
        const endsAt = durationMs ? new Date(Date.now() + durationMs) : null;

        const lockdownEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🔒 Server Lockdown')
            .setDescription('Dieser Kanal wurde vorübergehend auf **Read Only** gesetzt.')
            .addFields(
                {
                    name: '📄 Grund',
                    value: `\`${reason}\``
                },
                {
                    name: '👮 Gestartet von',
                    value: `${interaction.user}`,
                    inline: true
                },
                {
                    name: '⏱️ Ende',
                    value: endsAt ? `<t:${Math.floor(endsAt.getTime() / 1000)}:R>` : '`Manuell`',
                    inline: true
                }
            )
            .setTimestamp();

        const messages = [];
        const channels = [];

        const textChannels = interaction.guild.channels.cache.filter(channel =>
            [
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement
            ].includes(channel.type)
        );

        for (const channel of textChannels.values()) {
            const oldOverwrite = channel.permissionOverwrites.cache.get(interaction.guild.id);

            channels.push({
                channelId: channel.id,
                oldAllow: oldOverwrite ? oldOverwrite.allow.bitfield.toString() : null,
                oldDeny: oldOverwrite ? oldOverwrite.deny.bitfield.toString() : null,
                existed: !!oldOverwrite
            });

            await channel.permissionOverwrites.edit(interaction.guild.id, {
                SendMessages: false,
                CreatePublicThreads: false,
                CreatePrivateThreads: false,
                SendMessagesInThreads: false,
                AddReactions: false
            }).catch(() => {});

            const msg = await channel.send({
                embeds: [lockdownEmbed]
            }).catch(() => null);

            if (msg) {
                messages.push({
                    channelId: channel.id,
                    messageId: msg.id
                });
            }
        }

        let event = null;

        if (interaction.guild.scheduledEvents) {
            event = await interaction.guild.scheduledEvents.create({
                name: '🔒 Server Lockdown',
                description: `Grund: ${reason}`,
                scheduledStartTime: new Date(),
                scheduledEndTime: endsAt || new Date(Date.now() + 60 * 60 * 1000),
                privacyLevel: 2,
                entityType: 3,
                entityMetadata: {
                    location: 'Server Lockdown'
                },
                reason: 'Server Lockdown gestartet'
            }).catch(() => null);
        }

        await LockdownSystem.create({
            guildId: interaction.guild.id,
            active: true,
            reason,
            startedBy: interaction.user.id,
            startedAt: new Date(),
            endsAt,
            eventId: event ? event.id : null,
            messages,
            channels
        });

        return interaction.editReply({
            content: `✅ Lockdown gestartet.${endsAt ? `\n⏱️ Automatisches Ende: <t:${Math.floor(endsAt.getTime() / 1000)}:R>` : '\n⏱️ Ende: Manuell'}`
        });
    }
};