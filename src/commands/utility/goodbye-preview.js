const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const GoodbyeSystem = require('../../models/GoodbyeSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('goodbye-preview')
        .setDescription('Zeigt eine Vorschau der Goodbye Nachricht'),

    async execute(interaction) {
        if (
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
            !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)
        ) {
            return interaction.reply({
                content: '❌ Keine Rechte.',
                flags: 64
            });
        }

        const data = await GoodbyeSystem.findOne({
            guildId: interaction.guild.id
        });

        if (!data) {
            return interaction.reply({
                content: '❌ Goodbye System wurde noch nicht eingerichtet.',
                flags: 64
            });
        }

        const embed = createEmbed(data, interaction.member);

        return interaction.reply({
            content: data.pingUser ? `${interaction.user}` : null,
            embeds: [embed],
            flags: 64
        });
    }
};

function createEmbed(data, member) {
    const embed = new EmbedBuilder()
        .setTitle(replaceVars(data.title, member))
        .setDescription(replaceVars(data.message, member))
        .setTimestamp();

    if (data.color) embed.setColor(data.color);
    if (data.imageUrl) embed.setImage(replaceVars(data.imageUrl, member));
    if (data.thumbnailUrl) embed.setThumbnail(replaceVars(data.thumbnailUrl, member));

    return embed;
}

function replaceVars(text, member) {
    if (!text) return '';

    return text
        .replaceAll('{user}', `${member.user}`)
        .replaceAll('{username}', member.user.username)
        .replaceAll('{userid}', member.id)
        .replaceAll('{server}', member.guild.name)
        .replaceAll('{membercount}', `${member.guild.memberCount}`);
}