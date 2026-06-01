const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    active: {
        type: Boolean,
        default: false
    },
    expiresAt: Date,
    activatedBy: String,
    code: String,
    activatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports =
    mongoose.models.PremiumGuild ||
    mongoose.model('PremiumGuild', schema);