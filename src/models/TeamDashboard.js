const mongoose = require("mongoose");

module.exports = mongoose.model(
    "TeamDashboard",
    new mongoose.Schema({
        guildId: {
            type: String,
            required: true,
            unique: true
        },

        dashboardRole: String,
        managerRole: String,

        uprankChannel: String,
        downrankChannel: String,
        warnChannel: String,
        kickChannel: String
    })
);