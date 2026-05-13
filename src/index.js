require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection
} = require('discord.js');

const mongoose = require('mongoose');

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

client.commands = new Collection();

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB verbunden');
    })
    .catch(err => {
        console.log('❌ MongoDB Fehler:', err);
    });

const commandsPath = path.join(__dirname, 'src', 'commands');

function loadCommands(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);

        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            try {
                const command = require(filePath);

                if (command.data && command.execute) {
                    client.commands.set(command.data.name, command);

                    console.log(`✅ Command geladen: ${command.data.name}`);
                }
            } catch (err) {
                console.log(`❌ Fehler bei Command ${file}:`, err);
            }
        }
    }
}

if (fs.existsSync(commandsPath)) {
    loadCommands(commandsPath);
}

const eventsPath = path.join(__dirname, 'src', 'events');

function loadEvents(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);

        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            loadEvents(filePath);
        } else if (file.endsWith('.js')) {
            try {
                const event = require(filePath);

                if (event.name && event.execute) {
                    if (event.once) {
                        client.once(event.name, (...args) => event.execute(...args));
                    } else {
                        client.on(event.name, (...args) => event.execute(...args));
                    }

                    console.log(`✅ Event geladen: ${event.name}`);
                }
            } catch (err) {
                console.log(`❌ Fehler bei Event ${file}:`, err);
            }
        }
    }
}

if (fs.existsSync(eventsPath)) {
    loadEvents(eventsPath);
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (err) {
        console.log(err);

        if (!interaction.replied) {
            interaction.reply({
                content: '❌ Fehler beim Ausführen des Commands.',
                ephemeral: true
            }).catch(() => {});
        }
    }
});

client.once('ready', () => {
    console.log(`✅ Eingeloggt als ${client.user.tag}`);
});

client.login(process.env.TOKEN);