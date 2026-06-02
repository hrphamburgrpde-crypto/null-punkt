require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    Events
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildPresences
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember
    ]
});

client.commands = new Collection();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB verbunden'))
    .catch(err => console.log('❌ MongoDB Fehler:', err));

function loadCommands(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`❌ Commands Ordner nicht gefunden: ${dir}`);
        return;
    }

    for (const file of fs.readdirSync(dir)) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            loadCommands(filePath);
            continue;
        }

        if (!file.endsWith('.js')) continue;

        try {
            const command = require(filePath);

            if (!command.data || !command.execute) {
                console.log(`⚠️ Command übersprungen: ${file}`);
                continue;
            }

            client.commands.set(command.data.name, command);
            console.log(`✅ Command geladen: ${command.data.name}`);
        } catch (err) {
            console.log(`❌ Fehler bei Command ${file}:`, err);
        }
    }
}

function loadEvents(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`❌ Events Ordner nicht gefunden: ${dir}`);
        return;
    }

    for (const file of fs.readdirSync(dir)) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            loadEvents(filePath);
            continue;
        }

        if (!file.endsWith('.js')) continue;

        try {
            const loaded = require(filePath);
            const events = Array.isArray(loaded) ? loaded : [loaded];

            for (const event of events) {
                if (!event.name || !event.execute) {
                    console.log(`⚠️ Event übersprungen: ${file}`);
                    continue;
                }

                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }

                console.log(`✅ Event geladen: ${event.name}`);
            }
        } catch (err) {
            console.log(`❌ Fehler bei Event ${file}:`, err);
        }
    }
}

loadCommands(path.join(__dirname, 'commands'));
loadEvents(path.join(__dirname, 'events'));

client.once(Events.ClientReady, () => {
    console.log(`✅ Eingeloggt als ${client.user.tag}`);
    console.log(`${client.user.tag} ist online.`);
});

process.on('unhandledRejection', err => {
    console.log('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', err => {
    console.log('❌ Uncaught Exception:', err);
});

client.login(process.env.TOKEN);