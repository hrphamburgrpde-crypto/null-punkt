const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    active: {
        type: Boolean,
        default: false
    },
    reason: String,
    startedBy: String,
    startedAt: Date,
    endsAt: Date,
    eventId: String,
    messages: {
        type: Array,
        default: []
    },
    channels: {
        type: Array,
        default: []
    }
});

module.exports =
    mongoose.models.LockdownSystem ||
    mongoose.model('LockdownSystem', schema);