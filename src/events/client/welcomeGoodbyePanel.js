const {
    Events,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    StringSelectMenuBuilder,
    ChannelType
} = require('discord.js');

const WelcomeSystem = require('../../models/WelcomeSystem');
const GoodbyeSystem = require('../../models/GoodbyeSystem');

const {
    createWelcomeEmbed,
    createWelcomeComponents
} = require('../../commands/setup/setup-welcome');

const {
    createGoodbyeEmbed,
    createGoodbyeComponents
} = require('../../commands/setup/setup-goodbye');

const colors = {
    none: null,
    blue: '#00aaff',
    red: '#ff0000',
    green: '#00ff88',
    yellow: '#ffaa00',
    purple: '#9b59b6',
    orange: '#ff8800',
    pink: '#ff66cc',
    gray: '#808080',
    black: '#2b2d31',
    gold: '#ffd700'
};

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        if (
            !interaction.isButton() &&
            !interaction.isModalSubmit() &&
            !interaction.isChannelSelectMenu() &&
            !interaction.isStringSelectMenu()
        ) return;

        const id = interaction.customId;
        if (!id?.startsWith('welcome_') && !id?.startsWith('goodbye_')) return;

        if (!hasPermission(interaction)) {
            return interaction.reply({
                content: '❌ Keine Rechte.',
                flags: 64
            });
        }

        const type = id.startsWith('welcome_') ? 'welcome' : 'goodbye';
        const model = type === 'welcome' ? WelcomeSystem : GoodbyeSystem;

        let data = await model.findOne({ guildId: interaction.guild.id });

        if (!data) {
            data = await model.create({ guildId: interaction.guild.id });
        }

        if (id.endsWith('_edit_text')) {
            const modal = new ModalBuilder()
                .setCustomId(`${type}_text_modal`)
                .setTitle(type === 'welcome' ? 'Welcome Nachricht' : 'Goodbye Nachricht');

            const titleInput = new TextInputBuilder()
                .setCustomId('title')
                .setLabel('Titel')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(256)
                .setValue(data.title || '');

            const messageInput = new TextInputBuilder()
                .setCustomId('message')
                .setLabel('Nachricht')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(3000)
                .setValue(data.message || '');

            const imageInput = new TextInputBuilder()
                .setCustomId('image')
                .setLabel('Bild URL oder leer')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setValue(data.imageUrl || '');

            const thumbnailInput = new TextInputBuilder()
                .setCustomId('thumbnail')
                .setLabel('Thumbnail URL oder leer')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setValue(data.thumbnailUrl || '');

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(messageInput),
                new ActionRowBuilder().addComponents(imageInput),
                new ActionRowBuilder().addComponents(thumbnailInput)
            );

            return interaction.showModal(modal);
        }

        if (id.endsWith('_select_channel')) {
            const menu = new ChannelSelectMenuBuilder()
                .setCustomId(`${type}_channel_select`)
                .setPlaceholder('Kanal auswählen')
                .setMinValues(1)
                .setMaxValues(1)
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

            return interaction.reply({
                content: '📍 Wähle den Kanal aus.',
                components: [new ActionRowBuilder().addComponents(menu)],
                flags: 64
            });
        }

        if (id.endsWith('_select_color')) {
            const menu = new StringSelectMenuBuilder()
                .setCustomId(`${type}_color_select`)
                .setPlaceholder('Farbe auswählen')
                .addOptions(
                    { label: 'Keine Farbe', value: 'none' },
                    { label: 'Blau', value: 'blue' },
                    { label: 'Rot', value: 'red' },
                    { label: 'Grün', value: 'green' },
                    { label: 'Gelb', value: 'yellow' },
                    { label: 'Lila', value: 'purple' },
                    { label: 'Orange', value: 'orange' },
                    { label: 'Pink', value: 'pink' },
                    { label: 'Grau', value: 'gray' },
                    { label: 'Schwarz', value: 'black' },
                    { label: 'Gold', value: 'gold' }
                );

            return interaction.reply({
                content: '🎨 Wähle eine Farbe aus.',
                components: [new ActionRowBuilder().addComponents(menu)],
                flags: 64
            });
        }

        if (id.endsWith('_toggle_ping')) {
            data.pingUser = !data.pingUser;
            await data.save();
            return updatePanel(interaction, type, data);
        }

        if (id.endsWith('_toggle_enabled')) {
            data.enabled = !data.enabled;
            await data.save();
            return updatePanel(interaction, type, data);
        }

        if (interaction.isModalSubmit() && id.endsWith('_text_modal')) {
            data.title = interaction.fields.getTextInputValue('title');
            data.message = interaction.fields.getTextInputValue('message');

            const image = interaction.fields.getTextInputValue('image');
            const thumbnail = interaction.fields.getTextInputValue('thumbnail');

            data.imageUrl = image || null;
            data.thumbnailUrl = thumbnail || null;

            await data.save();

            return interaction.reply({
                content: '✅ Nachricht gespeichert.',
                flags: 64
            });
        }

        if (interaction.isChannelSelectMenu() && id.endsWith('_channel_select')) {
            data.channelId = interaction.values[0];
            await data.save();

            return interaction.update({
                content: '✅ Kanal gespeichert.',
                components: []
            });
        }

        if (interaction.isStringSelectMenu() && id.endsWith('_color_select')) {
            const color = interaction.values[0];

            data.color = colors[color];
            await data.save();

            return interaction.update({
                content: '✅ Farbe gespeichert.',
                components: []
            });
        }
    }
};

function hasPermission(interaction) {
    return (
        interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
        interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)
    );
}

function updatePanel(interaction, type, data) {
    if (type === 'welcome') {
        return interaction.update({
            embeds: [createWelcomeEmbed(data)],
            components: createWelcomeComponents()
        });
    }

    return interaction.update({
        embeds: [createGoodbyeEmbed(data)],
        components: createGoodbyeComponents()
    });
}