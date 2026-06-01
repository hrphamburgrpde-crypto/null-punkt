const {
    Events,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const AutoModSystem = require('../../models/AutoModSystem');

const spamCache = new Map();

const badWords = [
    'hurensohn',
    'huso',
    'fick dich'
];

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        if (!message.guild) return;
        if (message.author.bot) return;

        console.log(`[AutoMod] Nachricht erkannt von ${message.author.tag}: ${message.content}`);

        const data = await AutoModSystem.findOne({
            guildId: message.guild.id
        });

        if (!data) {
            console.log('[AutoMod] Kein AutoMod Setup gefunden.');
            return;
        }

        if (message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    	return;
	}

	if (data.whitelistChannelIds?.includes(message.channel.id)) {
    return;
}

if (
    data.whitelistRoleIds?.some(roleId =>
        message.member.roles.cache.has(roleId)
    )
) {
    return;
}

        const content = message.content || '';
        const lower = content.toLowerCase();

        let reason = null;

        if (data.antiEveryone && message.mentions.everyone) {
            reason = 'Anti Everyone/Here';
        }

        if (!reason && data.antiLink && /(https?:\/\/|www\.|\.com|\.net|\.de|\.org|\.io|\.xyz)/i.test(content)) {
            reason = 'Anti Link';
        }

        if (!reason && data.antiInvite && /(discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)/i.test(content)) {
            reason = 'Anti Invite';
        }

        if (!reason && data.antiBadWords && badWords.some(word => lower.includes(word))) {
            reason = 'Anti Bad Words';
        }

        if (!reason && data.antiMassMention && (message.mentions.users.size >= 5 || message.mentions.roles.size >= 3)) {
            reason = 'Anti Mass Mention';
        }

        if (!reason && data.antiCaps && isCapsSpam(content)) {
            reason = 'Anti Caps';
        }

        if (!reason && data.antiEmojiSpam && hasEmojiSpam(content)) {
            reason = 'Anti Emoji Spam';
        }

        if (!reason && data.antiStickerSpam && message.stickers.size >= 2) {
            reason = 'Anti Sticker Spam';
        }

        if (!reason && data.antiSpam && isSpam(message)) {
            reason = 'Anti Spam';
        }

        if (!reason) {
            console.log('[AutoMod] Keine Regel ausgelöst.');
            return;
        }

        console.log(`[AutoMod] Regel ausgelöst: ${reason}`);

        await punish(message, data, reason);
    }
};

function isCapsSpam(text) {
    const letters = text.replace(/[^a-zA-ZÄÖÜäöüß]/g, '');
    if (letters.length < 12) return false;

    const upper = letters.replace(/[^A-ZÄÖÜ]/g, '');
    return upper.length / letters.length >= 0.75;
}

function hasEmojiSpam(text) {
    const customEmojis = text.match(/<a?:\w+:\d+>/g) || [];
    const unicodeEmojis = text.match(/[\u{1F300}-\u{1FAFF}]/gu) || [];

    return customEmojis.length + unicodeEmojis.length >= 8;
}

function isSpam(message) {
    const key = `${message.guild.id}_${message.author.id}`;
    const now = Date.now();

    const old = spamCache.get(key) || [];
    const recent = old.filter(time => now - time < 5000);

    recent.push(now);
    spamCache.set(key, recent);

    return recent.length >= 5;
}

async function punish(message, data, reason) {
    await message.delete().catch(err => {
        console.log('[AutoMod] Nachricht konnte nicht gelöscht werden:', err.message);
    });

    if (data.punishment === 'timeout' && message.member.moderatable) {
        await message.member.timeout(data.timeoutDuration || 300000, reason).catch(() => {});
    }

    if (data.punishment === 'kick' && message.member.kickable) {
        await message.member.kick(reason).catch(() => {});
    }

    if (data.punishment === 'ban' && message.member.bannable) {
        await message.member.ban({ reason }).catch(() => {});
    }

    if (data.punishment === 'warn') {
        await message.channel.send({
            content: `⚠️ ${message.author}, bitte beachte die Regeln. Grund: **${reason}**`
        }).then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 5000);
        }).catch(() => {});
    }

    await logAutoMod(message, data, reason);
}

async function logAutoMod(message, data, reason) {
    const logChannel = data.logChannelId
        ? message.guild.channels.cache.get(data.logChannelId)
        : null;

    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🛡️ AutoMod Aktion')
        .addFields(
            { name: '👤 User', value: `${message.author}`, inline: true },
            { name: '📍 Kanal', value: `${message.channel}`, inline: true },
            { name: '⚠️ Grund', value: `\`${reason}\``, inline: true },
            { name: '⚖️ Strafe', value: `\`${data.punishment}\``, inline: true },
            { name: '💬 Nachricht', value: `\`${(message.content || 'Keine Nachricht').slice(0, 900)}\`` }
        )
        .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => {});
}