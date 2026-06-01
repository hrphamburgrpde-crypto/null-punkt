const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const WelcomeSystem = require('../../models/WelcomeSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('Erstellt das Welcome System Panel'),

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

        const data = await WelcomeSystem.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { guildId: interaction.guild.id },
            { upsert: true, new: true }
        );

        return interaction.reply({
            embeds: [createWelcomeEmbed(data)],
            components: createWelcomeComponents(),
            flags: 64
        });
    }
};

function status(value) {
    return value ? '🟢 `Aktiviert`' : '🔴 `Deaktiviert`';
}

function createWelcomeEmbed(data) {
    return new EmbedBuilder()
        .setColor(data.color || '#00aaff')
        .setTitle('👋 Welcome System')
        .setDescription('Nutze die Buttons unten, um das Welcome System einzustellen.')
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

function createWelcomeComponents() {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('welcome_edit_text')
            .setLabel('Nachricht bearbeiten')
            .setEmoji('✏️')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('welcome_select_channel')
            .setLabel('Kanal auswählen')
            .setEmoji('📍')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('welcome_select_color')
            .setLabel('Farbe auswählen')
            .setEmoji('🎨')
            .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('welcome_toggle_ping')
            .setLabel('Ping An/Aus')
            .setEmoji('👤')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('welcome_toggle_enabled')
            .setLabel('Aktivieren/Deaktivieren')
            .setEmoji('🔁')
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId('welcome_preview')
            .setLabel('Vorschau')
            .setEmoji('🔍')
            .setStyle(ButtonStyle.Secondary)
    );

    return [row1, row2];
}

module.exports.createWelcomeEmbed = createWelcomeEmbed;
module.exports.createWelcomeComponents = createWelcomeComponents;