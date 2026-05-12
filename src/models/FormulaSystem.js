const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    panelChannelId: String,
    logChannelId: String,
    title: String,
    buttonText: String,
    questions: {
        type: Array,
        default: []
    },
    acceptRoles: {
        type: Array,
        default: []
    }
});

module.exports =
    mongoose.models.FormulaSystem ||
    mongoose.model('FormulaSystem', schema);