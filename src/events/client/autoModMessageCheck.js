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
    'nigger',
    'nigga',
    'fick dich'
];

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        if (!message.guild) return;
        if (message.author.bot) return;

        const data = await AutoModSystem.findOne({
            guildId: message.guild.id
        });

        if (!data) return;

        if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const content = message.content || '';
        const lower = content.toLowerCase();

        let reason = null;

        if (data.antiEveryone && containsEveryone(message)) {
    reason = 'Anti Everyone/Here';
}

        if (!reason && data.antiLink && containsLink(content)) {
            reason = 'Anti Link';
        }

        if (!reason && data.antiInvite && containsInvite(content)) {
            reason = 'Anti Invite';
        }

        if (!reason && data.antiBadWords && containsBadWord(lower)) {
            reason = 'Anti Bad Words';
        }

        if (!reason && data.antiMassMention && hasMassMentions(message)) {
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

        if (!reason) return;

        await punish(message, data, reason);
    }
};

function containsLink(text) {
    return /(https?:\/\/|www\.|\.com|\.net|\.gg|\.de|\.org|\.io|\.xyz)/i.test(text);
}

function containsInvite(text) {
    return /(discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)/i.test(text);
}

function containsEveryone(message) {
    return message.mentions.everyone;
}

function containsBadWord(text) {
    return badWords.some(word => text.includes(word));
}

function hasMassMentions(message) {
    return message.mentions.users.size >= 5 || message.mentions.roles.size >= 3;
}

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

    const data = spamCache.get(key) || [];
    const recent = data.filter(time => now - time < 5000);

    recent.push(now);
    spamCache.set(key, recent);

    return recent.length >= 5;
}

async function punish(message, data, reason) {
    await message.delete().catch(() => {});

    if (data.punishment === 'timeout') {
        if (message.member.moderatable) {
            await message.member.timeout(
                data.timeoutDuration || 5 * 60 * 1000,
                reason
            ).catch(() => {});
        }
    }

    if (data.punishment === 'kick') {
        if (message.member.kickable) {
            await message.member.kick(reason).catch(() => {});
        }
    }

    if (data.punishment === 'ban') {
        if (message.member.bannable) {
            await message.member.ban({
                reason
            }).catch(() => {});
        }
    }

    if (data.punishment === 'warn') {
        // Nur einfache Warn-Nachricht, falls dein Warn-Model anders ist
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
            {
                name: '👤 User',
                value: `${message.author}`,
                inline: true
            },
            {
                name: '📍 Kanal',
                value: `${message.channel}`,
                inline: true
            },
            {
                name: '⚠️ Grund',
                value: `\`${reason}\``,
                inline: true
            },
            {
                name: '⚖️ Strafe',
                value: `\`${data.punishment}\``,
                inline: true
            },
            {
                name: '💬 Nachricht',
                value: `\`${(message.content || 'Keine Nachricht').slice(0, 900)}\``
            }
        )
        .setTimestamp();

    await logChannel.send({
        embeds: [embed]
    }).catch(() => {});
}