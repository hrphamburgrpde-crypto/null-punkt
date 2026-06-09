const mongoose = require("mongoose");

module.exports = mongoose.model(
    "TeamWarn",
    new mongoose.Schema({
        guildId: String,
        userId: String,

        moderatorId: String,

        reason: String,

        createdAt: {
            type: Date,
            default: Date.now
        }
    })
);