const express = require("express");
const router = express.Router();

const TeamDashboard = require("../../src/models/TeamDashboard");
const client = require("../../index");

router.get("/", async (req, res) => {
try {

    const config = await TeamDashboard.findOne({
        guildId: req.params.guildId
    });

    if (!config) {
        return res.status(404).json({
            success: false
        });
    }

    const guild = client.guilds.cache.get(
        req.params.guildId
    );

    if (!guild) {
        return res.status(404).json({
            success: false,
            message: "Guild nicht gefunden"
        });
    }

    await guild.members.fetch();

    const teamMembers = guild.members.cache
        .filter(member =>
            member.roles.cache.has(config.supportRole) ||
            member.roles.cache.has(config.moderatorRole) ||
            member.roles.cache.has(config.adminRole)
        )
        .map(member => ({
            id: member.id,
            username: member.user.username,
            avatar: member.user.displayAvatarURL(),
            roles: member.roles.cache.map(r => r.name)
        }));

    res.json({
        success: true,
        members: teamMembers
    });

} catch (err) {
    console.error(err);

    res.status(500).json({
        success: false
    });
}

});

module.exports = router;