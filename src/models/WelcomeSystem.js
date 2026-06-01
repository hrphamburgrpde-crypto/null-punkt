const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    title: { type: String, default: '👋 Willkommen' },
    message: {
        type: String,
        default: 'Hallo {user}\n\nWillkommen auf {server}!\nDu bist Mitglied Nummer {membercount}.'
    },
    color: { type: String, default: '#00aaff' },
    imageUrl: { type: String, default: null },
    thumbnailUrl: { type: String, default: null },
    pingUser: { type: Boolean, default: false }
});

module.exports =
    mongoose.models.WelcomeSystem ||
    mongoose.model('WelcomeSystem', schema);