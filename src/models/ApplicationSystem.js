const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,

    panelChannelId: String,

    logChannelId: String,

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
    mongoose.models.ApplicationSystem ||
    mongoose.model('ApplicationSystem', schema);