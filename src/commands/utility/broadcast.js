const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');

const PremiumGuild = require('../../models/PremiumGuild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('broadcast')
        .setDescription('Bot Owner Broadcast')
        .addStringOption(option =>
            option
                .setName('ziel')
                .setDescription('Broadcast Ziel')
                .setRequired(true)
                .addChoices(
                    { name: 'Alle Server', value: 'all' },
                    { name: 'Premium Server', value: 'premium' },
                    { name: 'Einzelner Server', value: 'single' }
                )
        )
        .addStringOption(option =>
            option
                .setName('serverid')
                .setDescription('Server ID')
                .setRequired(false)
        ),

    async execute(interaction) {

        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: '❌ Nur der Bot Owner darf diesen Command benutzen.',
                flags: 64
            });
        }

        const target = interaction.options.getString('ziel');
        const serverId = interaction.options.getString('serverid') || 'none';

        if (target === 'single' && serverId === 'none') {
            return interaction.reply({
                content: '❌ Bitte gib eine Server ID an.',
                flags: 64
            });
        }

        const modal = new ModalBuilder()
            .setCustomId(`broadcast_${target}_${serverId}`)
            .setTitle('Broadcast');

        const title = new TextInputBuilder()
            .setCustomId('title')
            .setLabel('Titel')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const message = new TextInputBuilder()
            .setCustomId('message')
            .setLabel('Nachricht')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(title),
            new ActionRowBuilder().addComponents(message)
        );

        return interaction.showModal(modal);
    }
};

module.exports.handleBroadcastModal = async function(interaction) {

    if (!interaction.customId.startsWith('broadcast_')) return false;

    if (interaction.user.id !== process.env.OWNER_ID) {
        return true;
    }

    await interaction.deferReply({
        flags: 64
    });

    const raw = interaction.customId.replace('broadcast_', '');

    const [target, ...rest] = raw.split('_');

    const serverId = rest.join('_');

    const title = interaction.fields.getTextInputValue('title');
    const message = interaction.fields.getTextInputValue('message');

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(title)
        .setDescription(message)
        .setFooter({
            text: 'Null Punkt Broadcast'
        })
        .setTimestamp();

    let guilds = [];

    if (target === 'all') {
        guilds = [...interaction.client.guilds.cache.values()];
    }

    if (target === 'single') {
        const guild = interaction.client.guilds.cache.get(serverId);

        if (guild) guilds = [guild];
    }

    if (target === 'premium') {

        const premiumGuilds = await PremiumGuild.find({
            active: true
        });

        const ids = premiumGuilds.map(g => g.guildId);

        guilds = [...interaction.client.guilds.cache.values()]
            .filter(g => ids.includes(g.id));
    }

    let success = 0;
    let failed = 0;

    for (const guild of guilds) {

        const channel = findBestChannel(guild);

        if (!channel) {
            failed++;
            continue;
        }

        try {

            await channel.send({
                embeds: [embed]
            });

            success++;

        } catch {

            failed++;

        }

        await wait(500);
    }

    await interaction.editReply({
        content:
            `✅ Broadcast abgeschlossen\n\n` +
            `📨 Erfolgreich: ${success}\n` +
            `❌ Fehlgeschlagen: ${failed}`
    });

    return true;
};

function findBestChannel(guild) {

    const me = guild.members.me;

    if (!me) return null;

    const textChannels = guild.channels.cache
        .filter(channel =>
            channel.type === ChannelType.GuildText &&
            channel.permissionsFor(me)?.has([
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks
            ])
        );

    const preferredNames = [
        'announcements',
        'ankündigungen',
        'ankundigungen',
        'updates',
        'news'
    ];

    for (const name of preferredNames) {

        const found = textChannels.find(channel =>
            channel.name.toLowerCase().includes(name)
        );

        if (found) return found;
    }

    return textChannels
        .sort((a, b) => a.position - b.position)
        .first() || null;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}