const {
    Events,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const VerifySystem = require('../../models/VerifySystem');

const captchaCache = new Map();

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        if (interaction.isButton() && interaction.customId === 'verify_start_v2') {
            return handleVerifyButton(interaction);
        }

        if (
            interaction.isModalSubmit() &&
            interaction.customId === `verify_captcha_modal_v2_${interaction.user.id}`
        ) {
            return handleCaptchaSubmit(interaction);
        }
    }
};

async function handleVerifyButton(interaction) {
    const data = await VerifySystem.findOne({
        guildId: interaction.guild.id
    });

    if (!data) {
        return sendEmbed(
            interaction,
            '❌ Fehler',
            'Verify System wurde nicht eingerichtet.',
            '#ff0000'
        );
    }

    const addRole = interaction.guild.roles.cache.get(data.addRoleId);
    const removeRole = data.removeRoleId
        ? interaction.guild.roles.cache.get(data.removeRoleId)
        : null;

    if (!addRole) {
        return sendEmbed(
            interaction,
            '❌ Rolle wurde nicht gefunden',
            'Bitte führe `/setup-verify` nochmal neu aus und wähle die Rolle erneut aus.',
            '#ff0000'
        );
    }

    if (interaction.member.roles.cache.has(addRole.id)) {
        return sendEmbed(
            interaction,
            '❌ Bereits verifiziert',
            'Du bist bereits verifiziert.',
            '#ff0000'
        );
    }

    const roleCheck = checkBotRole(interaction, addRole, removeRole);

    if (!roleCheck.ok) {
        return sendEmbed(
            interaction,
            '⬆️ Rollen Fehler',
            roleCheck.message,
            '#ffaa00'
        );
    }

    if (!data.captchaEnabled) {
        await giveRoles(interaction, addRole, removeRole);

        return sendEmbed(
            interaction,
            '✅ Verifiziert',
            `Du hast die Rolle ${addRole} erhalten.`,
            '#00ff88'
        );
    }

    const code = createCaptcha();
    const key = `${interaction.guild.id}_${interaction.user.id}`;

    captchaCache.set(key, {
        code,
        addRoleId: addRole.id,
        removeRoleId: removeRole ? removeRole.id : null,
        expiresAt: Date.now() + 5 * 60 * 1000
    });

    const modal = new ModalBuilder()
        .setCustomId(`verify_captcha_modal_v2_${interaction.user.id}`)
        .setTitle('Captcha Verifizierung');

    const input = new TextInputBuilder()
        .setCustomId('captcha_code')
        .setLabel(`Code eingeben: ${code}`)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(code.length)
        .setMaxLength(code.length);

    modal.addComponents(
        new ActionRowBuilder().addComponents(input)
    );

    return interaction.showModal(modal);
}

async function handleCaptchaSubmit(interaction) {
    const key = `${interaction.guild.id}_${interaction.user.id}`;
    const cache = captchaCache.get(key);

    if (!cache || Date.now() > cache.expiresAt) {
        captchaCache.delete(key);

        return sendEmbed(
            interaction,
            '❌ Captcha abgelaufen',
            'Bitte klicke nochmal auf **Verifizieren**.',
            '#ff0000'
        );
    }

    const input = interaction.fields.getTextInputValue('captcha_code');

    if (input.toUpperCase() !== cache.code.toUpperCase()) {
        return sendEmbed(
            interaction,
            '❌ Falscher Code',
            'Der eingegebene Captcha Code ist falsch.',
            '#ff0000'
        );
    }

    const addRole = interaction.guild.roles.cache.get(cache.addRoleId);
    const removeRole = cache.removeRoleId
        ? interaction.guild.roles.cache.get(cache.removeRoleId)
        : null;

    if (!addRole) {
        captchaCache.delete(key);

        return sendEmbed(
            interaction,
            '❌ Rolle wurde nicht gefunden',
            'Bitte führe `/setup-verify` nochmal neu aus und wähle die Rolle erneut aus.',
            '#ff0000'
        );
    }

    if (interaction.member.roles.cache.has(addRole.id)) {
        captchaCache.delete(key);

        return sendEmbed(
            interaction,
            '❌ Bereits verifiziert',
            'Du bist bereits verifiziert.',
            '#ff0000'
        );
    }

    const roleCheck = checkBotRole(interaction, addRole, removeRole);

    if (!roleCheck.ok) {
        return sendEmbed(
            interaction,
            '⬆️ Rollen Fehler',
            roleCheck.message,
            '#ffaa00'
        );
    }

    await giveRoles(interaction, addRole, removeRole);

    captchaCache.delete(key);

    return sendEmbed(
        interaction,
        '✅ Verifiziert',
        `Du hast die Rolle ${addRole} erhalten.`,
        '#00ff88'
    );
}

function checkBotRole(interaction, addRole, removeRole) {
    const botMember = interaction.guild.members.me;

    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return {
            ok: false,
            message: 'Der Bot braucht die Berechtigung `Rollen verwalten`.'
        };
    }

    if (addRole.position >= botMember.roles.highest.position) {
        return {
            ok: false,
            message: 'Stelle sicher das die Bot Rolle Hoch Genug ist.'
        };
    }

    if (removeRole && removeRole.position >= botMember.roles.highest.position) {
        return {
            ok: false,
            message: 'Stelle sicher das die Bot Rolle Hoch Genug ist.'
        };
    }

    return {
        ok: true
    };
}

async function giveRoles(interaction, addRole, removeRole) {
    await interaction.member.roles.add(addRole);

    if (removeRole && interaction.member.roles.cache.has(removeRole.id)) {
        await interaction.member.roles.remove(removeRole);
    }
}

function createCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
}

function sendEmbed(interaction, title, description, color) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();

    return interaction.reply({
        embeds: [embed],
        flags: 64
    });
}