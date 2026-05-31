const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    panelChannelId: String,
    dutyRoleId: String,
    offDutyRoleId: {
        type: String,
        default: null
    },
    logChannelId: String,
    antiOfflineFarming: {
        type: Boolean,
        default: false
    },
    managementRoleIds: {
        type: Array,
        default: []
    }
});

module.exports =
    mongoose.models.ShiftSystem ||
    mongoose.model('ShiftSystem', schema);