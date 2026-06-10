const mongoose = require("mongoose");

module.exports = mongoose.model(
  "TeamCareer",
  new mongoose.Schema({
    guildId: String,

    roleId: String,
    roleName: String,

    position: Number
  })
);