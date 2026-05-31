const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    backupId: String,
    createdBy: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    data: Object
});

module.exports =
    mongoose.models.Backup ||
    mongoose.model('Backup', schema);