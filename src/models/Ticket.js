const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    channelId: String,
    ownerId: String,

    claimedBy: {
        type: String,
        default: null
    },

    lastClaimedBy: {
        type: String,
        default: null
    },

    category: String,

    priority: {
        type: String,
        default: 'Normal'
    },

    timeCloseUsed: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports =
    mongoose.models.Ticket ||
    mongoose.model('Ticket', schema);