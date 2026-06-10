const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

const TeamCareer = mongoose.model(
    "TeamCareer",
    new mongoose.Schema({
        guildId: String,
        name: String,
        roleId: String,
        order: Number
    })
);

router.get("/:guildId", async (req, res) => {

    const careers = await TeamCareer
        .find({
            guildId: req.params.guildId
        })
        .sort({
            order: 1
        });

    res.json(careers);
});

module.exports = router;