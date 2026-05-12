const mongoose = require('mongoose');

const warnSchema = new mongoose.Schema({

    guildId: String,

    userId: String,

    moderatorId: String,

    reason: String,

    duration: Number,

    createdAt: {
        type: Date,
        default: Date.now
    },

    expiresAt: Date,

    appealed: {
        type: Boolean,
        default: false
    }
});

module.exports =
    mongoose.model('Warn', warnSchema);