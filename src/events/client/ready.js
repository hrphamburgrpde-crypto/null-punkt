const { Events } = require('discord.js');

module.exports = {

    name: Events.ClientReady,
    once: true,

    execute(client) {

        console.log(`✅ Eingeloggt als ${client.user.tag}`);
        console.log(`${client.user.tag} ist online.`);
    }
};