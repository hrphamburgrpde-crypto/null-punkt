const {
    Events,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    UserSelectMenuBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const TicketSystem = require('../../models/TicketSystem');
const Ticket = require('../../models/Ticket');
const LogChannel = require('../../models/LogChannel');

const ticketCreateCooldowns = new Map();
const closeTimers = new Map();

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        try {
            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'ticket_select') return createTicket(interaction);
            }

            if (interaction.isUserSelectMenu()) {
                if (interaction.customId === 'ticket_user_add_select') return handleUserSelect(interaction, 'add');
                if (interaction.customId === 'ticket_user_remove_select') return handleUserSelect(interaction, 'remove');
            }

            if (interaction.isButton()) {
                if (interaction.customId === 'claim_ticket') return claimTicket(interaction);
                if (interaction.customId === 'unclaim_ticket') return unclaimTicket(interaction);
                if (interaction.customId === 'ticket_add_user') return openUserSelect(interaction, 'add');
                if (interaction.customId === 'ticket_remove_user') return openUserSelect(interaction, 'remove');
                if (interaction.customId === 'time_close_ticket') return openTimeCloseModal(interaction);
                if (interaction.customId === 'cancel_time_close_ticket') return cancelTimeClose(interaction);
                if (interaction.customId === 'close_ticket') return openCloseReasonModal(interaction);
            }

            if (interaction.isModalSubmit()) {
                if (interaction.customId.startsWith('time_close_modal_')) return handleTimeCloseModal(interaction);
                if (interaction.customId === 'ticket_close_reason_modal') return handleCloseReasonModal(interaction);
            }

        } catch (err) {
            console.error('Ticket System Fehler:', err);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Fehler im Ticket System.',
                    flags: 64
                }).catch(() => {});
            }
        }
    }
};

async function createTicket(interaction) {
    const cooldown = ticketCreateCooldowns.get(interaction.user.id);

    if (cooldown && cooldown > Date.now()) {
        const remaining = Math.ceil((cooldown - Date.now()) / 1000);

        return interaction.reply({
            content: `❌ Bitte warte noch ${remaining} Sekunden.`,
            flags: 64
        });
    }

    ticketCreateCooldowns.set(interaction.user.id, Date.now() + 30 * 1000);

    const data = await TicketSystem.findOne({
        guildId: interaction.guild.id
    });

    if (!data || !data.categories || !Array.isArray(data.categories)) {
        return interaction.reply({
            content: '❌ Ticket System wurde nicht eingerichtet.',
            flags: 64
        });
    }

    const selected = interaction.values[0];

    const category = data.categories.find(c =>
        c.id === selected || c.name === selected
    );

    if (!category) {
        return interaction.reply({
            content: '❌ Kategorie wurde nicht gefunden.',
            flags: 64
        });
    }

    const existing = await Ticket.findOne({
        guildId: interaction.guild.id,
        ownerId: interaction.user.id
    });

    if (existing) {
        const existingChannel = interaction.guild.channels.cache.get(existing.channelId);

        if (existingChannel) {
            return interaction.reply({
                content: `❌ Du hast bereits ein Ticket: ${existingChannel}`,
                flags: 64
            });
        }

        await Ticket.findByIdAndDelete(existing._id).catch(() => {});
    }

    const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90),
        type: ChannelType.GuildText,
        parent: data.ticketCategoryId || null,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            },
            {
                id: category.roleId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            }
        ]
    });

    const ticket = await Ticket.create({
        guildId: interaction.guild.id,
        channelId: channel.id,
        ownerId: interaction.user.id,
        category: category.name,
        claimedBy: null,
        lastClaimedBy: null
    });

    const embed = new EmbedBuilder()
        .setColor('#00aaff')
        .setTitle('🎫 Ticket erstellt')
        .setDescription(`Hallo ${interaction.user}, ein Teammitglied wird dir bald helfen.`)
        .addFields(
            {
                name: '📂 Kategorie',
                value: `\`${category.name}\``,
                inline: true
            },
            {
                name: '📌 Status',
                value: '❌ Nicht geclaimt',
                inline: true
            }
        )
        .setTimestamp();

    await channel.send({
        content: `<@&${category.roleId}> ${interaction.user}`,
        embeds: [embed],
        components: [
            createTicketButtons(ticket),
            createManageButtons()
        ]
    });

    return interaction.reply({
        content: `✅ Ticket erstellt: ${channel}`,
        flags: 64
    });
}

async function claimTicket(interaction) {
    const ticket = await Ticket.findOne({
        channelId: interaction.channel.id
    });

    if (!ticket) {
        return interaction.reply({
            content: '❌ Dieses Ticket wurde nicht gefunden.',
            flags: 64
        });
    }

    const allowed = await hasTicketPermission(interaction, ticket);

    if (!allowed) {
        return interaction.reply({
            content: '❌ Du darfst dieses Ticket nicht claimen.',
            flags: 64
        });
    }

    if (ticket.claimedBy) {
        return interaction.reply({
            content: '❌ Dieses Ticket ist bereits geclaimt.',
            flags: 64
        });
    }

    ticket.claimedBy = interaction.user.id;
    ticket.lastClaimedBy = interaction.user.id;
    await ticket.save();

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor('#00ff88')
        .spliceFields(1, 1, {
            name: '📌 Status',
            value: `✅ Geclaimt von ${interaction.user}`,
            inline: true
        });

    await interaction.update({
        embeds: [embed],
        components: [
            createTicketButtons(ticket),
            createManageButtons()
        ]
    });

    return interaction.channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#00ff88')
                .setTitle('✅ Ticket geclaimt')
                .setDescription(`${interaction.user} hat dieses Ticket übernommen.`)
                .setTimestamp()
        ]
    });
}

async function unclaimTicket(interaction) {
    const ticket = await Ticket.findOne({
        channelId: interaction.channel.id
    });

    if (!ticket) {
        return interaction.reply({
            content: '❌ Dieses Ticket wurde nicht gefunden.',
            flags: 64
        });
    }

    const allowed = await hasTicketPermission(interaction, ticket);

    if (!allowed) {
        return interaction.reply({
            content: '❌ Du darfst dieses Ticket nicht freigeben.',
            flags: 64
        });
    }

    if (!ticket.claimedBy) {
        return interaction.reply({
            content: '❌ Dieses Ticket ist nicht geclaimt.',
            flags: 64
        });
    }

    ticket.claimedBy = null;
    await ticket.save();

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor('#00aaff')
        .spliceFields(1, 1, {
            name: '📌 Status',
            value: '❌ Nicht geclaimt',
            inline: true
        });

    await interaction.update({
        embeds: [embed],
        components: [
            createTicketButtons(ticket),
            createManageButtons()
        ]
    });

    return interaction.channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#00aaff')
                .setTitle('❌ Ticket freigegeben')
                .setDescription(`${interaction.user} hat dieses Ticket freigegeben.`)
                .setTimestamp()
        ]
    });
}

function openUserSelect(interaction, mode) {
    const menu = new UserSelectMenuBuilder()
        .setCustomId(mode === 'add' ? 'ticket_user_add_select' : 'ticket_user_remove_select')
        .setPlaceholder(mode === 'add' ? 'User zum Ticket hinzufügen' : 'User aus Ticket entfernen')
        .setMinValues(1)
        .setMaxValues(1);

    return interaction.reply({
        content: mode === 'add'
            ? 'Wähle den User aus, der hinzugefügt werden soll.'
            : 'Wähle den User aus, der entfernt werden soll.',
        components: [
            new ActionRowBuilder().addComponents(menu)
        ],
        flags: 64
    });
}

async function handleUserSelect(interaction, mode) {
    const ticket = await Ticket.findOne({
        channelId: interaction.channel.id
    });

    if (!ticket) {
        return interaction.reply({
            content: '❌ Dieses Ticket wurde nicht gefunden.',
            flags: 64
        });
    }

    const allowed = await hasTicketPermission(interaction, ticket);

    if (!allowed) {
        return interaction.reply({
            content: '❌ Du darfst das nicht.',
            flags: 64
        });
    }

    const userId = interaction.values[0];
    const user = await interaction.client.users.fetch(userId).catch(() => null);

    if (!user) {
        return interaction.update({
            content: '❌ User wurde nicht gefunden.',
            components: []
        });
    }

    if (mode === 'add') {
        await interaction.channel.permissionOverwrites.edit(user.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });

        return interaction.update({
            content: `✅ ${user} wurde zum Ticket hinzugefügt.`,
            components: []
        });
    }

    await interaction.channel.permissionOverwrites.delete(user.id).catch(() => {});

    return interaction.update({
        content: `✅ ${user} wurde aus dem Ticket entfernt.`,
        components: []
    });
}

function openTimeCloseModal(interaction) {
    if (closeTimers.has(interaction.channel.id)) {
        return interaction.reply({
            content: '❌ Für dieses Ticket läuft bereits ein Time Close.',
            flags: 64
        });
    }

    const modal = new ModalBuilder()
        .setCustomId(`time_close_modal_${interaction.message.id}`)
        .setTitle('Ticket automatisch schließen');

    const input = new TextInputBuilder()
        .setCustomId('minutes')
        .setLabel('In wie vielen Minuten schließen?')
        .setPlaceholder('Beispiel: 10')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(input)
    );

    return interaction.showModal(modal);
}

async function handleTimeCloseModal(interaction) {
    const ticket = await Ticket.findOne({
        channelId: interaction.channel.id
    });

    if (!ticket) {
        return interaction.reply({
            content: '❌ Dieses Ticket wurde nicht gefunden.',
            flags: 64
        });
    }

    const allowed = await hasTicketPermission(interaction, ticket);

    if (!allowed) {
        return interaction.reply({
            content: '❌ Du darfst das nicht.',
            flags: 64
        });
    }

    if (closeTimers.has(interaction.channel.id)) {
        return interaction.reply({
            content: '❌ Für dieses Ticket läuft bereits ein Time Close.',
            flags: 64
        });
    }

    const minutes = Number(interaction.fields.getTextInputValue('minutes'));

    if (!minutes || isNaN(minutes) || minutes < 1) {
        return interaction.reply({
            content: '❌ Bitte gib eine gültige Zahl ein.',
            flags: 64
        });
    }

    const closeAt = Date.now() + minutes * 60 * 1000;

    const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_time_close_ticket')
        .setLabel('Abbrechen')
        .setEmoji('🛑')
        .setStyle(ButtonStyle.Secondary);

    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('⏰ Time Close aktiviert')
                .setDescription('Dieses Ticket wird automatisch geschlossen, falls es nicht abgebrochen wird.')
                .addFields(
                    {
                        name: '👮 Eingestellt von',
                        value: `${interaction.user}`,
                        inline: true
                    },
                    {
                        name: '⏱️ Dauer',
                        value: `\`${minutes} Minuten\``,
                        inline: true
                    },
                    {
                        name: '🕒 Schließt um',
                        value: `<t:${Math.floor(closeAt / 1000)}:F>`,
                        inline: false
                    }
                )
                .setTimestamp()
        ],
        components: [
            new ActionRowBuilder().addComponents(cancelButton)
        ]
    });

    const timer = setTimeout(async () => {
        await closeTicketByChannel(
            interaction.channel,
            interaction.client,
            'Automatisch geschlossen durch Time Close.'
        );
    }, minutes * 60 * 1000);

    closeTimers.set(interaction.channel.id, timer);
}

async function cancelTimeClose(interaction) {
    const ticket = await Ticket.findOne({
        channelId: interaction.channel.id
    });

    if (!ticket) {
        return interaction.reply({
            content: '❌ Dieses Ticket wurde nicht gefunden.',
            flags: 64
        });
    }

    const allowed = await hasTicketPermission(interaction, ticket);

    if (!allowed) {
        return interaction.reply({
            content: '❌ Du darfst das nicht.',
            flags: 64
        });
    }

    if (!closeTimers.has(interaction.channel.id)) {
        return interaction.reply({
            content: '❌ Für dieses Ticket läuft kein Time Close.',
            flags: 64
        });
    }

    clearTimeout(closeTimers.get(interaction.channel.id));
    closeTimers.delete(interaction.channel.id);

    return interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor('#00ff88')
                .setTitle('🛑 Time Close abgebrochen')
                .setDescription(`Der automatische Close wurde von ${interaction.user} abgebrochen.`)
                .setTimestamp()
        ],
        components: []
    });
}

function openCloseReasonModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('ticket_close_reason_modal')
        .setTitle('Ticket schließen');

    const input = new TextInputBuilder()
        .setCustomId('close_reason')
        .setLabel('Grund für das Schließen')
        .setPlaceholder('Beispiel: Problem gelöst')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(input)
    );

    return interaction.showModal(modal);
}

async function handleCloseReasonModal(interaction) {
    const ticket = await Ticket.findOne({
        channelId: interaction.channel.id
    });

    if (!ticket) {
        return interaction.reply({
            content: '❌ Dieses Ticket wurde nicht gefunden.',
            flags: 64
        });
    }

    const allowed = await hasTicketPermission(interaction, ticket);

    if (!allowed) {
        return interaction.reply({
            content: '❌ Du darfst dieses Ticket nicht schließen.',
            flags: 64
        });
    }

    const reason = interaction.fields.getTextInputValue('close_reason');

    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔒 Ticket wird geschlossen')
                .setDescription('Das Ticket wird in wenigen Sekunden geschlossen.')
                .addFields({
                    name: '📄 Grund',
                    value: `\`${reason}\``
                })
                .setTimestamp()
        ]
    });

    await closeTicketByChannel(interaction.channel, interaction.client, reason);
}

async function closeTicketByChannel(channel, client, reason) {
    const ticket = await Ticket.findOne({
        channelId: channel.id
    });

    const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);

    let html = `
<html>
<head>
<title>Ticket Transcript</title>
</head>
<body style="background:#2b2d31;color:white;font-family:Arial;">
<h1>Ticket Transcript</h1>
<p><b>Close Reason:</b> ${escapeHtml(reason || 'Kein Grund angegeben')}</p>
`;

    if (messages) {
        messages.reverse().forEach(msg => {
            html += `
<div style="margin-bottom:10px;padding:10px;background:#1e1f22;border-radius:10px;">
<b>${escapeHtml(msg.author.tag)}</b><br>
<span>${escapeHtml(msg.content || 'Keine Nachricht')}</span>
</div>
`;
        });
    }

    html += `
</body>
</html>
`;

    const transcriptsDir = path.join(__dirname, '../../../transcripts');

    if (!fs.existsSync(transcriptsDir)) {
        fs.mkdirSync(transcriptsDir, { recursive: true });
    }

    const filePath = path.join(
        transcriptsDir,
        `transcript-${channel.id}.html`
    );

    fs.writeFileSync(filePath, html);

    await channel.send({
        files: [filePath]
    }).catch(() => {});

    const logData = await LogChannel.findOne({
        guildId: channel.guild.id
    });

    const logChannel = logData
        ? channel.guild.channels.cache.get(logData.channelId)
        : null;

    const supporterId = ticket?.lastClaimedBy || ticket?.claimedBy || null;

    const supporter = supporterId
        ? await client.users.fetch(supporterId).catch(() => null)
        : null;

    if (logChannel) {
        await logChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🎫 Ticket geschlossen')
                    .addFields(
                        {
                            name: '📍 Ticket',
                            value: `\`${channel.name}\``,
                            inline: true
                        },
                        {
                            name: '📄 Grund',
                            value: `\`${reason || 'Kein Grund angegeben'}\``
                        },
                        {
                            name: '👮 Supporter',
                            value: supporter ? `${supporter}` : '`Nicht geclaimt`',
                            inline: true
                        }
                    )
                    .setTimestamp()
            ],
            files: [filePath]
        }).catch(() => {});
    }

    await Ticket.findOneAndDelete({
        channelId: channel.id
    }).catch(() => {});

    if (closeTimers.has(channel.id)) {
        clearTimeout(closeTimers.get(channel.id));
        closeTimers.delete(channel.id);
    }

    setTimeout(() => {
        channel.delete().catch(() => {});
    }, 5000);
}

function createTicketButtons(ticket) {
    return new ActionRowBuilder().addComponents(
        ticket.claimedBy
            ? new ButtonBuilder()
                .setCustomId('unclaim_ticket')
                .setLabel('Unclaim')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Secondary)
            : new ButtonBuilder()
                .setCustomId('claim_ticket')
                .setLabel('Claim')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Schließen')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger)
    );
}

function createManageButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_add_user')
            .setLabel('User hinzufügen')
            .setEmoji('➕')
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId('ticket_remove_user')
            .setLabel('User entfernen')
            .setEmoji('➖')
            .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId('time_close_ticket')
            .setLabel('Time Close')
            .setEmoji('⏰')
            .setStyle(ButtonStyle.Primary)
    );
}

async function hasTicketPermission(interaction, ticket) {
    if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }

    const data = await TicketSystem.findOne({
        guildId: interaction.guild.id
    });

    if (!data || !data.categories) return false;

    const category = data.categories.find(c => c.name === ticket.category);

    if (!category) return false;

    return interaction.member.roles.cache.has(category.roleId);
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}