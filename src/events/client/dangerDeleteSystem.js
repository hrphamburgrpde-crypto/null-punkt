const {
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        if (interaction.isButton()) {
            if (interaction.customId === 'danger_delete_code') {
                return openCodeModal(interaction);
            }

            if (interaction.customId.startsWith('danger_delete_confirm_')) {
                return handleConfirm(interaction);
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'danger_delete_code_modal') {
                return handleCodeModal(interaction);
            }
        }
    }
};

async function openCodeModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('danger_delete_code_modal')
        .setTitle('Sicherheitscode eingeben');

    const input = new TextInputBuilder()
        .setCustomId('code')
        .setLabel('Code aus deiner DM')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
}

async function handleCodeModal(interaction) {
    const key = `${interaction.guild.id}_${interaction.user.id}`;
    const session = global.dangerDeleteSessions?.get(key);

    if (!session) {
        return interaction.reply({
            content: '❌ Keine aktive Sicherheitsprüfung gefunden.',
            flags: 64
        });
    }

    if (interaction.guild.ownerId !== interaction.user.id) {
        return interaction.reply({
            content: '❌ Nur der Server Owner darf das bestätigen.',
            flags: 64
        });
    }

    const code = interaction.fields.getTextInputValue('code');

    if (code.toUpperCase() !== session.code.toUpperCase()) {
        return interaction.reply({
            content: '❌ Falscher Sicherheitscode.',
            flags: 64
        });
    }

    session.step = 1;
    global.dangerDeleteSessions.set(key, session);

    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('⚠️ Sicherheitsbestätigung 1/3')
        .setDescription(`Code korrekt.\n\nDu möchtest **${session.type === 'roles' ? 'alle löschbaren Rollen' : 'alle Kanäle'}** löschen.\n\nDrücke **Bestätigen 1/3**.`)
        .setTimestamp();

    const button = new ButtonBuilder()
        .setCustomId('danger_delete_confirm_1')
        .setLabel('Bestätigen 1/3')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⚠️');

    return interaction.reply({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(button)],
        flags: 64
    });
}

async function handleConfirm(interaction) {
    const key = `${interaction.guild.id}_${interaction.user.id}`;
    const session = global.dangerDeleteSessions?.get(key);

    if (!session) {
        return interaction.reply({
            content: '❌ Keine aktive Sicherheitsprüfung gefunden.',
            flags: 64
        });
    }

    if (interaction.guild.ownerId !== interaction.user.id) {
        return interaction.reply({
            content: '❌ Nur der Server Owner darf das bestätigen.',
            flags: 64
        });
    }

    const clickedStep = Number(interaction.customId.replace('danger_delete_confirm_', ''));

    if (clickedStep !== session.step) {
        return interaction.reply({
            content: '❌ Falsche Bestätigungs-Reihenfolge.',
            flags: 64
        });
    }

    if (session.step < 3) {
        session.step++;
        global.dangerDeleteSessions.set(key, session);

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`⚠️ Sicherheitsbestätigung ${session.step}/3`)
            .setDescription(`Drücke **Bestätigen ${session.step}/3**, um fortzufahren.`)
            .setTimestamp();

        const button = new ButtonBuilder()
            .setCustomId(`danger_delete_confirm_${session.step}`)
            .setLabel(`Bestätigen ${session.step}/3`)
            .setStyle(ButtonStyle.Danger)
            .setEmoji('⚠️');

        return interaction.update({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(button)]
        });
    }

    await interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🧨 Löschung gestartet')
                .setDescription('Der Vorgang wird jetzt ausgeführt.')
                .setTimestamp()
        ],
        components: []
    });

    if (session.type === 'roles') {
        await deleteRoles(interaction);
    }

    if (session.type === 'channels') {
        await deleteChannels(interaction);
    }

    global.dangerDeleteSessions.delete(key);
}

async function deleteRoles(interaction) {
    const guild = interaction.guild;
    const botMember = guild.members.me;

    const roles = guild.roles.cache
        .filter(role =>
            role.id !== guild.id &&
            !role.managed &&
            role.editable &&
            role.position < botMember.roles.highest.position
        )
        .sort((a, b) => b.position - a.position);

    let deleted = 0;

    for (const role of roles.values()) {
        const success = await role.delete('Danger Delete Roles').then(() => true).catch(() => false);
        if (success) deleted++;
    }

    await interaction.user.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#00ff88')
                .setTitle('✅ Rollen gelöscht')
                .setDescription(`Es wurden **${deleted}** Rollen gelöscht.\nBot-/managed Rollen wurden ignoriert.`)
                .setTimestamp()
        ]
    }).catch(() => {});
}

async function deleteChannels(interaction) {
    const guild = interaction.guild;
    const currentChannelId = interaction.channel.id;

    const channels = guild.channels.cache.filter(channel => channel.id !== currentChannelId);

    let deleted = 0;

    for (const channel of channels.values()) {
        const success = await channel.delete('Danger Delete Channels').then(() => true).catch(() => false);
        if (success) deleted++;
    }

    await interaction.user.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#00ff88')
                .setTitle('✅ Kanäle gelöscht')
                .setDescription(`Es wurden **${deleted}** Kanäle gelöscht.`)
                .setTimestamp()
        ]
    }).catch(() => {});

    setTimeout(async () => {
        const oldChannel = guild.channels.cache.get(currentChannelId);
        if (oldChannel) {
            await oldChannel.delete('Danger Delete Channels - letzter Kanal').catch(() => {});
        }
    }, 5000);
}