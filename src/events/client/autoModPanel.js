const {
    Events,
    PermissionFlagsBits,
    ActionRowBuilder,
    RoleSelectMenuBuilder,
    ChannelSelectMenuBuilder,
    ChannelType
} = require('discord.js');

const AutoModSystem = require('../../models/AutoModSystem');

const {
    createAutoModEmbed,
    createAutoModComponents
} = require('../../commands/setup/setup-automod');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        if (
            !interaction.isButton() &&
            !interaction.isStringSelectMenu() &&
            !interaction.isRoleSelectMenu() &&
            !interaction.isChannelSelectMenu()
        ) return;

        const valid =
            interaction.customId.startsWith('automod_toggle_') ||
            interaction.customId === 'automod_punishment' ||
            interaction.customId === 'automod_timeout' ||
            interaction.customId === 'automod_whitelist_roles' ||
            interaction.customId === 'automod_whitelist_channels' ||
            interaction.customId === 'automod_whitelist_roles_select' ||
            interaction.customId === 'automod_whitelist_channels_select';

        if (!valid) return;

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

        let data = await AutoModSystem.findOne({
            guildId: interaction.guild.id
        });

        if (!data) {
            return interaction.reply({
                content: '❌ AutoMod wurde noch nicht eingerichtet. Nutze zuerst `/setup-automod`.',
                flags: 64
            });
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'automod_whitelist_roles') {
                const menu = new RoleSelectMenuBuilder()
                    .setCustomId('automod_whitelist_roles_select')
                    .setPlaceholder('Whitelist Rollen auswählen')
                    .setMinValues(0)
                    .setMaxValues(10);

                return interaction.reply({
                    content: '🛡️ Wähle Rollen aus, die AutoMod ignorieren soll.',
                    components: [
                        new ActionRowBuilder().addComponents(menu)
                    ],
                    flags: 64
                });
            }

            if (interaction.customId === 'automod_whitelist_channels') {
                const menu = new ChannelSelectMenuBuilder()
                    .setCustomId('automod_whitelist_channels_select')
                    .setPlaceholder('Whitelist Kanäle auswählen')
                    .setMinValues(0)
                    .setMaxValues(10)
                    .addChannelTypes(
                        ChannelType.GuildText,
                        ChannelType.GuildAnnouncement
                    );

                return interaction.reply({
                    content: '📁 Wähle Kanäle aus, in denen AutoMod ignoriert werden soll.',
                    components: [
                        new ActionRowBuilder().addComponents(menu)
                    ],
                    flags: 64
                });
            }

            const key = interaction.customId.replace('automod_toggle_', '');

            if (typeof data[key] !== 'boolean') {
                return interaction.reply({
                    content: '❌ Ungültige Einstellung.',
                    flags: 64
                });
            }

            data[key] = !data[key];
            await data.save();

            data = await AutoModSystem.findOne({
                guildId: interaction.guild.id
            });

            return interaction.update({
                embeds: [createAutoModEmbed(data)],
                components: createAutoModComponents(data)
            });
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'automod_punishment') {
                data.punishment = interaction.values[0];
                await data.save();
            }

            if (interaction.customId === 'automod_timeout') {
                data.timeoutDuration = Number(interaction.values[0]);
                await data.save();
            }

            data = await AutoModSystem.findOne({
                guildId: interaction.guild.id
            });

            return interaction.update({
                embeds: [createAutoModEmbed(data)],
                components: createAutoModComponents(data)
            });
        }

        if (interaction.isRoleSelectMenu()) {
            if (interaction.customId !== 'automod_whitelist_roles_select') return;

            data.whitelistRoleIds = interaction.values;
            await data.save();

            data = await AutoModSystem.findOne({
                guildId: interaction.guild.id
            });

            return interaction.update({
                content: '✅ Whitelist Rollen wurden gespeichert.',
                embeds: [createAutoModEmbed(data)],
                components: createAutoModComponents(data)
            });
        }

        if (interaction.isChannelSelectMenu()) {
            if (interaction.customId !== 'automod_whitelist_channels_select') return;

            data.whitelistChannelIds = interaction.values;
            await data.save();

            data = await AutoModSystem.findOne({
                guildId: interaction.guild.id
            });

            return interaction.update({
                content: '✅ Whitelist Kanäle wurden gespeichert.',
                embeds: [createAutoModEmbed(data)],
                components: createAutoModComponents(data)
            });
        }
    }
};