const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const GoodbyeSystem = require('../../models/GoodbyeSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-goodbye')
        .setDescription('Erstellt das Goodbye System Panel'),

    async execute(interaction) {
        const allowed =
            interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
            interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);

        if (!allowed) {
            return interaction.reply({
                content: '❌ Keine Rechte.',
                flags: 64
            });
        }

        const data = await GoodbyeSystem.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { guildId: interaction.guild.id },
            { upsert: true, new: true }
        );

        return interaction.reply({
            embeds: [createGoodbyeEmbed(data)],
            components: createGoodbyeComponents(),
            flags: 64
        });
    }
};

function status(value) {
    return value ? '🟢 `Aktiviert`' : '🔴 `Deaktiviert`';
}

function createGoodbyeEmbed(data) {
    return new EmbedBuilder()
        .setColor(data.color || '#ff0000')
        .setTitle('👋 Goodbye System')
        .setDescription('Nutze die Buttons unten, um das Goodbye System einzustellen.')
        .addFields(
            { name: '📡 Status', value: status(data.enabled), inline: true },
            { name: '📍 Kanal', value: data.channelId ? `<#${data.channelId}>` : '`Nicht gesetzt`', inline: true },
            { name: '👤 User pingen', value: status(data.pingUser), inline: true },
            { name: '🎨 Farbe', value: `\`${data.color || 'Keine'}\``, inline: true },
            { name: '📝 Titel', value: `\`${data.title}\``, inline: false },
            { name: '💬 Nachricht', value: `\`\`\`${data.message.slice(0, 900)}\`\`\``, inline: false },
            { name: '🖼️ Bild URL', value: data.imageUrl ? `\`${data.imageUrl}\`` : '`Keine`', inline: false },
            { name: '🌄 Thumbnail URL', value: data.thumbnailUrl ? `\`${data.thumbnailUrl}\`` : '`Keine`', inline: false }
        )
        .setTimestamp();
}

function createGoodbyeComponents() {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('goodbye_edit_text')
            .setLabel('Nachricht bearbeiten')
            .setEmoji('✏️')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('goodbye_select_channel')
            .setLabel('Kanal auswählen')
            .setEmoji('📍')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('goodbye_select_color')
            .setLabel('Farbe auswählen')
            .setEmoji('🎨')
            .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('goodbye_toggle_ping')
            .setLabel('Ping An/Aus')
            .setEmoji('👤')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('goodbye_toggle_enabled')
            .setLabel('Aktivieren/Deaktivieren')
            .setEmoji('🔁')
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId('goodbye_preview')
            .setLabel('Vorschau')
            .setEmoji('🔍')
            .setStyle(ButtonStyle.Secondary)
    );

    return [row1, row2];
}

module.exports.createGoodbyeEmbed = createGoodbyeEmbed;
module.exports.createGoodbyeComponents = createGoodbyeComponents;