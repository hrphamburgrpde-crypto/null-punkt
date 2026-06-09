const express = require("express");
const router = express.Router();

const TeamDashboard = require("../models/TeamDashboard");

router.get("/:guildId", async (req, res) => {

    const config = await TeamDashboard.findOne({
        guildId: req.params.guildId
    });

    if (!config) {
        return res.status(404).json({
            error: "Dashboard nicht eingerichtet"
        });
    }

    res.json(config);

});

module.exports = router;