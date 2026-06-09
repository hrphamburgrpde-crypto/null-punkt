const mongoose = require('mongoose');

module.exports = mongoose.model('TeamMember', new mongoose.Schema({

    guildId: {
        type: String,
        required: true
    },

    userId: {
        type: String,
        required: true
    },

    teamRole: {
        type: String,
        enum: ['manager', 'moderator', 'support'],
        required: true
    },

    addedBy: {
        type: String,
        required: true
    },

    joinedAt: {
        type: Date,
        default: Date.now
    },

    warnsGiven: {
        type: Number,
        default: 0
    },

    ticketsHandled: {
        type: Number,
        default: 0
    },

    actionsCount: {
        type: Number,
        default: 0
    },

    lastActivity: {
        type: Date,
        default: Date.now
    }

}));