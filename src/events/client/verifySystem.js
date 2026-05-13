const {
    Events
} = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {

        if (!interaction.isButton()) return;

        if (!interaction.customId.startsWith('verify_')) return;

        const roleId = interaction.customId.split('_')[1];

        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
            return interaction.reply({
                content: '❌ Rolle nicht gefunden.',
                ephemeral: true
            });
        }

        if (interaction.member.roles.cache.has(role.id)) {
            return interaction.reply({
                content: '❌ Du bist bereits verifiziert.',
                ephemeral: true
            });
        }

        await interaction.member.roles.add(role);

        return interaction.reply({
            content: `✅ Du hast die Rolle ${role} erhalten.`,
            ephemeral: true
        });
    }
};