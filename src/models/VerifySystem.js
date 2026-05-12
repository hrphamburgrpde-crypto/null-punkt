const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    channelId: String,
    verifyRole: String,
    removeRole: String,
    captchaEnabled: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('VerifySystem', schema);