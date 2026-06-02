const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,

    securityAlertsEnabled: {
        type: Boolean,
        default: false
    },
    alertLogChannelId: {
        type: String,
        default: null
    },
    ownerDmAlerts: {
        type: Boolean,
        default: true
    },

    adminLockEnabled: {
        type: Boolean,
        default: false
    },
    trustedUserIds: {
        type: Array,
        default: []
    }
});

module.exports =
    mongoose.models.SecuritySystem ||
    mongoose.model('SecuritySystem', schema);