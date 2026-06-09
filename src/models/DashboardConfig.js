const mongoose = require('mongoose');

module.exports = mongoose.model('DashboardConfig', new mongoose.Schema({

    guildId: {
        type: String,
        required: true,
        unique: true
    },

    enabled: {
        type: Boolean,
        default: true
    },

    dashboardName: {
        type: String,
        default: 'Null Punkt Team Dashboard'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

}));