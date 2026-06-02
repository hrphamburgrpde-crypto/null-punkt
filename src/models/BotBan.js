const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    username: String,
    bannedBy: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports =
    mongoose.models.BotBan ||
    mongoose.model('BotBan', schema);