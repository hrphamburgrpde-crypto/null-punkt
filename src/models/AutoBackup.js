const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    enabled: {
        type: Boolean,
        default: true
    },
    intervalMs: Number,
    logChannelId: {
        type: String,
        default: null
    },
    lastBackupAt: {
        type: Date,
        default: null
    }
});

module.exports =
    mongoose.models.AutoBackup ||
    mongoose.model('AutoBackup', schema);