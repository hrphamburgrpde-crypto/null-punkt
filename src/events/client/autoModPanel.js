const {
    Events,
    PermissionFlagsBits
} = require('discord.js');

const AutoModSystem = require('../../models/AutoModSystem');

const {
    createAutoModEmbed,
    createAutoModComponents
} = require('../../commands/setup/setup-automod');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

        if (
            !interaction.customId.startsWith('automod_toggle_') &&
            interaction.customId !== 'automod_punishment' &&
            interaction.customId !== 'automod_timeout'
        ) return;

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
            const key = interaction.customId.replace('automod_toggle_', '');

            if (typeof data[key] !== 'boolean') {
                return interaction.reply({
                    content: '❌ Ungültige Einstellung.',
                    flags: 64
                });
            }

            data[key] = !data[key];
            await data.save();
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
        }

        data = await AutoModSystem.findOne({
            guildId: interaction.guild.id
        });

        return interaction.update({
            embeds: [createAutoModEmbed(data)],
            components: createAutoModComponents(data)
        });
    }
};