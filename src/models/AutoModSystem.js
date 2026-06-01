const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    panelChannelId: String,
    logChannelId: {
        type: String,
        default: null
    },

    antiLink: { type: Boolean, default: false },
    antiInvite: { type: Boolean, default: false },
    antiSpam: { type: Boolean, default: false },
    antiCaps: { type: Boolean, default: false },
    antiMassMention: { type: Boolean, default: false },
    antiBadWords: { type: Boolean, default: false },
    antiEveryone: { type: Boolean, default: false },
    antiEmojiSpam: { type: Boolean, default: false },
    antiStickerSpam: { type: Boolean, default: false },
    antiRaid: { type: Boolean, default: false },

    punishment: {
        type: String,
        default: 'delete'
    },

    timeoutDuration: {
        type: Number,
        default: 5 * 60 * 1000
    }
});

module.exports =
    mongoose.models.AutoModSystem ||
    mongoose.model('AutoModSystem', schema);