const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    channelId: String,
    name1: String,
    name2: String,
    intervalMs: Number,
    current: {
        type: Number,
        default: 1
    },
    lastRunAt: {
        type: Date,
        default: null
    },
    enabled: {
        type: Boolean,
        default: true
    }
});

module.exports =
    mongoose.models.MatrixSystem ||
    mongoose.model('MatrixSystem', schema);