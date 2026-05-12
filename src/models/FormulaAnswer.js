const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    userId: String,
    status: {
        type: String,
        default: 'open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports =
    mongoose.models.FormulaAnswer ||
    mongoose.model('FormulaAnswer', schema);