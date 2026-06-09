const mongoose = require('mongoose');

module.exports = mongoose.model('TeamActionLog', new mongoose.Schema({

    guildId: {
        type: String,
        required: true
    },

    executorId: {
        type: String,
        required: true
    },

    targetId: {
        type: String,
        default: null
    },

    actionType: {
        type: String,
        required: true
    },

    reason: {
        type: String,
        default: 'Kein Grund'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

}));