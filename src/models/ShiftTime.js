const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    userId: String,
    totalMs: {
        type: Number,
        default: 0
    },
    activeSince: {
        type: Date,
        default: null
    }
});

module.exports =
    mongoose.models.ShiftTime ||
    mongoose.model('ShiftTime', schema);