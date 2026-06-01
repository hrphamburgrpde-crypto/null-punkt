const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder
} = require('discord.js');

const AutoModSystem = require('../../models/AutoModSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-automod')
        .setDescription('Erstellt ein AutoMod Einstellungs Panel')
        .addChannelOption(option =>
            option
                .setName('panelkanal')
                .setDescription('Kanal für das AutoMod Panel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addChannelOption(option =>
            option
                .setName('logkanal')
                .setDescription('AutoMod Log Kanal')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        ),

    async execute(interaction) {
        const allowed =
            interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
            interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
            interaction.member.permissions.has(PermissionFlagsBits.KickMembers) ||
            interaction.member.permissions.has(PermissionFlagsBits.BanMembers);

        if (!allowed) {
            return interaction.reply({
                content: '❌ Keine Rechte.',
                flags: 64
            });
        }

        const panelChannel = interaction.options.getChannel('panelkanal');
        const logChannel = interaction.options.getChannel('logkanal');

        const data = await AutoModSystem.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                guildId: interaction.guild.id,
                panelChannelId: panelChannel.id,
                logChannelId: logChannel ? logChannel.id : null
            },
            {
                upsert: true,
                new: true
            }
        );

        await panelChannel.send({
            embeds: [createAutoModEmbed(data)],
            components: createAutoModComponents(data)
        });

        return interaction.reply({
            content: `✅ AutoMod Panel wurde in ${panelChannel} erstellt.`,
            flags: 64
        });
    }
};

function status(value) {
    return value ? '🟢 `Aktiviert`' : '🔴 `Deaktiviert`';
}

function buttonStyle(value) {
    return value ? ButtonStyle.Success : ButtonStyle.Danger;
}

function createAutoModEmbed(data) {
    return new EmbedBuilder()
        .setColor('#00aaff')
        .setTitle('🛡️ AutoMod Einstellungen')
        .setDescription('Nutze die Buttons und Menüs unten, um AutoMod einzustellen.')
        .addFields(
            { name: '🔗 Anti Link', value: status(data.antiLink), inline: true },
            { name: '📨 Anti Invite', value: status(data.antiInvite), inline: true },
            { name: '⚡ Anti Spam', value: status(data.antiSpam), inline: true },
            { name: '🔠 Anti Caps', value: status(data.antiCaps), inline: true },
            { name: '👥 Anti Mass Mention', value: status(data.antiMassMention), inline: true },
            { name: '📢 Anti Everyone/Here', value: status(data.antiEveryone), inline: true },
            { name: '⚖️ Strafe', value: `\`${data.punishment}\``, inline: true },
            { name: '⏱️ Timeout Dauer', value: `\`${Math.floor(data.timeoutDuration / 60000)} Minuten\``, inline: true },
            {
                name: '🛡️ Whitelist Rollen',
                value: data.whitelistRoleIds?.length
                    ? data.whitelistRoleIds.map(id => `<@&${id}>`).join('\n')
                    : '`Keine`',
                inline: true
            },
            {
                name: '📁 Whitelist Kanäle',
                value: data.whitelistChannelIds?.length
                    ? data.whitelistChannelIds.map(id => `<#${id}>`).join('\n')
                    : '`Keine`',
                inline: true
            }
        )
        .setTimestamp();
}
function createAutoModComponents(data) {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('automod_toggle_antiLink')
            .setLabel('Anti Link')
            .setEmoji(data.antiLink ? '🟢' : '🔴')
            .setStyle(buttonStyle(data.antiLink)),

        new ButtonBuilder()
            .setCustomId('automod_toggle_antiInvite')
            .setLabel('Anti Invite')
            .setEmoji(data.antiInvite ? '🟢' : '🔴')
            .setStyle(buttonStyle(data.antiInvite)),

        new ButtonBuilder()
            .setCustomId('automod_toggle_antiSpam')
            .setLabel('Anti Spam')
            .setEmoji(data.antiSpam ? '🟢' : '🔴')
            .setStyle(buttonStyle(data.antiSpam))

    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('automod_toggle_antiCaps')
            .setLabel('Anti Caps')
            .setEmoji(data.antiCaps ? '🟢' : '🔴')
            .setStyle(buttonStyle(data.antiCaps)),

        new ButtonBuilder()
            .setCustomId('automod_toggle_antiMassMention')
            .setLabel('Mass Mention')
            .setEmoji(data.antiMassMention ? '🟢' : '🔴')
            .setStyle(buttonStyle(data.antiMassMention)),

        new ButtonBuilder()
            .setCustomId('automod_toggle_antiEveryone')
            .setLabel('Everyone/Here')
            .setEmoji(data.antiEveryone ? '🟢' : '🔴')
            .setStyle(buttonStyle(data.antiEveryone))
    );

    const row3 = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('automod_punishment')
            .setPlaceholder('Strafe auswählen')
            .addOptions(
                { label: 'Nur Nachricht löschen', value: 'delete', emoji: '🗑️' },
                { label: 'Warnen', value: 'warn', emoji: '⚠️' },
                { label: 'Timeout', value: 'timeout', emoji: '⏱️' },
                { label: 'Kick', value: 'kick', emoji: '👢' },
                { label: 'Ban', value: 'ban', emoji: '🔨' }
            )
    );

    const row4 = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('automod_timeout')
            .setPlaceholder('Timeout Dauer auswählen')
            .addOptions(
                { label: '1 Minute', value: '60000' },
                { label: '5 Minuten', value: '300000' },
                { label: '10 Minuten', value: '600000' },
                { label: '1 Stunde', value: '3600000' },
                { label: '1 Tag', value: '86400000' }
            )
    );

const row5 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId('automod_whitelist_roles')
        .setLabel('Whitelist Rollen')
        .setEmoji('🛡️')
        .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
        .setCustomId('automod_whitelist_channels')
        .setLabel('Whitelist Kanäle')
        .setEmoji('📁')
        .setStyle(ButtonStyle.Primary)
);

    return [row1, row2, row3, row4, row5];
}

module.exports.createAutoModEmbed = createAutoModEmbed;
module.exports.createAutoModComponents = createAutoModComponents;