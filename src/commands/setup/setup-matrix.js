const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');

const MatrixSystem = require('../../models/MatrixSystem');
const PremiumGuild = require('../../models/PremiumGuild');

const intervals = {
    '10s': 10 * 1000,
    '20s': 20 * 1000,
    '30s': 30 * 1000,
    '60s': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '10m': 10 * 60 * 1000
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-matrix')
        .setDescription('Premium: Wechselt automatisch einen Kanalnamen')
        .addChannelOption(option =>
            option
                .setName('kanal')
                .setDescription('Kanal der umbenannt werden soll')
                .addChannelTypes(
                    ChannelType.GuildText,
                    ChannelType.GuildVoice,
                    ChannelType.GuildAnnouncement,
                    ChannelType.GuildCategory,
                    ChannelType.GuildStageVoice
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('name1')
                .setDescription('Erster Kanalname')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('name2')
                .setDescription('Zweiter Kanalname')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('abstand')
                .setDescription('Wie oft soll gewechselt werden?')
                .setRequired(true)
                .addChoices(
                    { name: '10 Sekunden', value: '10s' },
                    { name: '20 Sekunden', value: '20s' },
                    { name: '30 Sekunden', value: '30s' },
                    { name: '60 Sekunden', value: '60s' },
                    { name: '5 Minuten', value: '5m' },
                    { name: '10 Minuten', value: '10m' }
                )
        ),

    async execute(interaction) {
        if (
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
            !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)
        ) {
            return interaction.reply({
                content: '❌ Dafür brauchst du `Kanäle verwalten` Rechte.',
                flags: 64
            });
        }

        const premium = await PremiumGuild.findOne({
            guildId: interaction.guild.id,
            active: true
        });

        if (!premium || Date.now() > new Date(premium.expiresAt).getTime()) {
            return interaction.reply({
                content: '⭐ Dieser Command ist nur für Premium Server verfügbar.',
                flags: 64
            });
        }

        const channel = interaction.options.getChannel('kanal');
        const name1 = interaction.options.getString('name1');
        const name2 = interaction.options.getString('name2');
        const intervalKey = interaction.options.getString('abstand');

        await MatrixSystem.findOneAndUpdate(
            {
                guildId: interaction.guild.id,
                channelId: channel.id
            },
            {
                guildId: interaction.guild.id,
                channelId: channel.id,
                name1,
                name2,
                intervalMs: intervals[intervalKey],
                current: 1,
                enabled: true
            },
            {
                upsert: true,
                new: true
            }
        );

        await channel.setName(name1).catch(() => {});

        return interaction.reply({
            content:
                `✅ Matrix System aktiviert.\n\n` +
                `📍 Kanal: ${channel}\n` +
                `🔁 Wechsel: \`${name1}\` ↔ \`${name2}\`\n` +
                `⏱️ Abstand: \`${intervalKey}\`\n\n` +
                `⚠️ Hinweis: Sehr kurze Abstände können von Discord limitiert werden.`,
            flags: 64
        });
    }
};