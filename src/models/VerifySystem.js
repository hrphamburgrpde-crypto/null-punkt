const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    channelId: String,
    addRoleId: String,
    removeRoleId: {
        type: String,
        default: null
    },
    captchaEnabled: {
        type: Boolean,
        default: false
    }
});

module.exports =
    mongoose.models.VerifySystem ||
    mongoose.model('VerifySystem', schema);