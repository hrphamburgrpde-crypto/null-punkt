const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

const TeamDashboard = mongoose.model(
    "TeamDashboard",
    new mongoose.Schema({
        guildId: String,

        dashboardRole: String,
        managerRole: String,

        supportRole: String,
        moderatorRole: String,
        adminRole: String,

        uprankChannel: String,
        downrankChannel: String,
        warnChannel: String,
        kickChannel: String
    })
);

router.get("/:guildId", async (req, res) => {
    try {

        const data = await TeamDashboard.findOne({
            guildId: req.params.guildId
        });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Dashboard nicht eingerichtet"
            });
        }

        return res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Interner Serverfehler"
        });
    }
});

module.exports = router;