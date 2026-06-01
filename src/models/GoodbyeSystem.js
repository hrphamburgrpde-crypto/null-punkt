const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    title: { type: String, default: '👋 Auf Wiedersehen' },
    message: {
        type: String,
        default: '{username} hat den Server verlassen.\nWir haben jetzt {membercount} Mitglieder.'
    },
    color: { type: String, default: '#ff0000' },
    imageUrl: { type: String, default: null },
    thumbnailUrl: { type: String, default: null },
    pingUser: { type: Boolean, default: false }
});

module.exports =
    mongoose.models.GoodbyeSystem ||
    mongoose.model('GoodbyeSystem', schema);