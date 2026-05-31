const {
    Events,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const colors = {
    blue: '#00aaff',
    red: '#ff0000',
    green: '#00ff88',
    yellow: '#ffaa00',
    purple: '#9b59b6',
    orange: '#ff8800',
    black: '#2b2d31',
    gray: '#808080',
    pink: '#ff66cc',
    turquoise: '#00ffff',
    white: '#ffffff',
    gold: '#ffd700',
    dark_blue: '#00008b',
    dark_red: '#8b0000',
    dark_green: '#006400'
};

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        if (!interaction.isModalSubmit()) return;
        if (!interaction.customId.startsWith('send_embed_modal_')) return;

        const allowed =
            interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
            interaction.member.permissions.has(PermissionFlagsBits.KickMembers) ||
            interaction.member.permissions.has(PermissionFlagsBits.BanMembers) ||
            interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!allowed) {
            return interaction.reply({
                content: '❌ Du brauchst Timeout-, Kick- oder Ban-Rechte.',
                flags: 64
            });
        }

        const colorName = interaction.customId.replace('send_embed_modal_', '');
        const title = interaction.fields.getTextInputValue('embed_title');
        const text = interaction.fields.getTextInputValue('embed_text');

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(text)
            .setFooter({
                text: `Gesendet von ${interaction.user.tag}`
            })
            .setTimestamp();

        if (colorName !== 'none') {
            embed.setColor(colors[colorName] || '#00aaff');
        }

        await interaction.channel.send({
            embeds: [embed]
        });

        return interaction.reply({
            content: '✅ Embed wurde gesendet.',
            flags: 64
        });
    }
};