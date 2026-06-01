const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    maxUses: {
        type: Number,
        default: 1
    },
    usedBy: {
        type: Array,
        default: []
    },
    durationMs: {
        type: Number,
        required: true
    },
    createdBy: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports =
    mongoose.models.PremiumCode ||
    mongoose.model('PremiumCode', schema);