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
        .setDescription('Bot Owner: Sendet eine Broadcast Nachricht')
        .addStringOption(option =>
            option
                .setName('ziel')
                .setDescription('Wohin soll gesendet werden?')
                .setRequired(true)
                .addChoices(
                    { name: 'Alle Server', value: 'all' },
                    { name: 'Nur Premium Server', value: 'premium' },
                    { name: 'Einzelner Server', value: 'single' }
                )
        )
        .addStringOption(option =>
            option
                .setName('serverid')
                .setDescription('Nur bei einzelner Server: Server ID')
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
                content: '❌ Bitte gib bei `Einzelner Server` auch eine Server ID an.',
                flags: 64
            });
        }

        const modal = new ModalBuilder()
            .setCustomId(`broadcast_modal_${target}_${serverId}`)
            .setTitle('Broadcast erstellen');

        const titleInput = new TextInputBuilder()
            .setCustomId('title')
            .setLabel('Titel')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(256)
            .setPlaceholder('z.B. Null Punkt Update');

        const messageInput = new TextInputBuilder()
            .setCustomId('message')
            .setLabel('Nachricht')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(3500)
            .setPlaceholder('Schreibe hier deine Broadcast Nachricht...');

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(messageInput)
        );

        return interaction.showModal(modal);
    }
};

module.exports.handleBroadcastModal = async function handleBroadcastModal(interaction) {
    if (!interaction.customId.startsWith('broadcast_modal_')) return false;

    if (interaction.user.id !== process.env.OWNER_ID) {
        await interaction.reply({
            content: '❌ Nur der Bot Owner darf Broadcasts senden.',
            flags: 64
        });
        return true;
    }

    await interaction.deferReply({
        flags: 64
    });

    const raw = interaction.customId.replace('broadcast_modal_', '');
    const [target, ...serverParts] = raw.split('_');
    const serverId = serverParts.join('_');

    const title = interaction.fields.getTextInputValue('title');
    const message = interaction.fields.getTextInputValue('message');

    const embed = new EmbedBuilder()
        .setColor('#00aaff')
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

        const premiumIds = premiumGuilds
            .filter(p => p.expiresAt && Date.now() < new Date(p.expiresAt).getTime())
            .map(p => p.guildId);

        guilds = [...interaction.client.guilds.cache.values()]
            .filter(guild => premiumIds.includes(guild.id));
    }

    let success = 0;
    let failed = 0;

    for (const guild of guilds) {
        const channel = findBestChannel(guild);

        if (!channel) {
            failed++;
            continue;
        }

        await channel.send({
            embeds: [embed]
        }).then(() => {
            success++;
        }).catch(() => {
            failed++;
        });

        await wait(750);
    }

    return interaction.editReply({
        content:
            `✅ Broadcast abgeschlossen.\n\n` +
            `📨 Erfolgreich: \`${success}\`\n` +
            `❌ Fehlgeschlagen: \`${failed}\`\n` +
            `🎯 Ziel: \`${target}\``
    });
};

function findBestChannel(guild) {
    const me = guild.members.me;
    if (!me) return null;

    const names = [
        'announcements',
        'ankündigungen',
        'ankundigungen',
        'updates',
        'news',
        'general',
        'allgemein',
        'chat'
    ];

    const textChannels = guild.channels.cache.filter(channel =>
        channel.type === ChannelType.GuildText &&
        channel.permissionsFor(me)?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ])
    );

    for (const name of names) {
        const found = textChannels.find(channel =>
            channel.name.toLowerCase().includes(name)
        );

        if (found) return found;
    }

    return textChannels
        .sort((a, b) => a.rawPosition - b.rawPosition)
        .first() || null;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}