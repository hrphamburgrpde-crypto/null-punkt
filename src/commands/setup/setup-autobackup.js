const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');

const AutoBackup = require('../../models/AutoBackup');

const intervals = {
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '2d': 2 * 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-autobackup')
        .setDescription('Richtet automatische Server Backups ein')
        .addStringOption(option =>
            option
                .setName('wiederholung')
                .setDescription('Wie oft soll automatisch ein Backup erstellt werden?')
                .setRequired(true)
                .addChoices(
                    { name: 'Alle 6 Stunden', value: '6h' },
                    { name: 'Alle 12 Stunden', value: '12h' },
                    { name: 'Alle 24 Stunden', value: '24h' },
                    { name: 'Alle 2 Tage', value: '2d' },
                    { name: 'Alle 3 Tage', value: '3d' },
                    { name: 'Alle 7 Tage', value: '7d' }
                )
        )
        .addChannelOption(option =>
            option
                .setName('logkanal')
                .setDescription('Kanal für AutoBackup Logs')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('aktiviert')
                .setDescription('AutoBackup aktivieren oder deaktivieren')
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Dafür brauchst du Administrator Rechte.',
                flags: 64
            });
        }

        const repeat = interaction.options.getString('wiederholung');
        const logChannel = interaction.options.getChannel('logkanal');
        const enabled = interaction.options.getBoolean('aktiviert') ?? true;

        await AutoBackup.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                guildId: interaction.guild.id,
                enabled,
                intervalMs: intervals[repeat],
                logChannelId: logChannel ? logChannel.id : null,
                lastBackupAt: null
            },
            {
                upsert: true,
                new: true
            }
        );

        return interaction.reply({
            content: `✅ AutoBackup wurde eingerichtet.\n🔁 Wiederholung: \`${repeat}\`\n📡 Status: \`${enabled ? 'Aktiviert' : 'Deaktiviert'}\``,
            flags: 64
        });
    }
};