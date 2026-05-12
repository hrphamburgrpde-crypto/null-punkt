require('dotenv').config();

//
// ================= MONGODB =================
//

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)

.then(() => {
    console.log('✅ MongoDB verbunden');
})

.catch(err => {
    console.error('❌ MongoDB Fehler:', err);
});

//
// ================= DISCORD =================
//

const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const client = new Client({

    intents: [

        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages

    ],

    partials: [
        Partials.Channel
    ]
});

//
// ================= COLLECTIONS =================
//

client.commands = new Collection();

//
// ================= COMMAND HANDLER =================
//

const commandFolders =
    fs.readdirSync('./src/commands');

for (const folder of commandFolders) {

    const commandFiles = fs
        .readdirSync(`./src/commands/${folder}`)
        .filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {

        const command =
            require(`./commands/${folder}/${file}`);

        client.commands.set(
            command.data.name,
            command
        );
    }
}

//
// ================= EVENT HANDLER =================
//

const eventFolders =
    fs.readdirSync('./src/events');

for (const folder of eventFolders) {

    const eventFiles = fs
        .readdirSync(`./src/events/${folder}`)
        .filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {

        const event =
            require(`./events/${folder}/${file}`);

        if (event.once) {

            client.once(
                event.name,
                (...args) =>
                    event.execute(...args, client)
            );

        } else {

            client.on(
                event.name,
                (...args) =>
                    event.execute(...args, client)
            );
        }
    }
}

//
// ================= READY =================
//

client.once('clientReady', () => {

    console.log(
        `✅ Eingeloggt als ${client.user.tag}`
    );

    console.log(
        `${client.user.tag} ist online.`
    );
});

//
// ================= LOGIN =================
//

client.login(process.env.TOKEN);