require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const express = require("express");
const cors = require("cors");
const BotBan = require('./models/BotBan')

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

const app = express();

app.use(cors());
app.use(express.json());

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
module.exports = client;


app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "Null Punkt API"
    });
});

app.listen(3000, () => {
    console.log("✅ API läuft auf Port 3000");
});

app.get("/api/roles/:guildId", async (req, res) => {

    try {

        const guild = client.guilds.cache.get(
            req.params.guildId
        );

console.log("Guild gesucht:", req.params.guildId);

console.log(
    "Verfügbare Guilds:",
    client.guilds.cache.map(g => ({
        id: g.id,
        name: g.name
    }))
);


        if (!guild) {
            return res.status(404).json({
                success: false,
                message: "Guild nicht gefunden"
            });
        }

        const roles = guild.roles.cache
            .filter(role => !role.managed)
            .map(role => ({
                id: role.id,
                name: role.name
            }))
            .sort((a, b) =>
                a.name.localeCompare(b.name)
            );

        res.json({
            success: true,
            roles
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });

    }

});

app.get("/api/guilds", (req, res) => {

    const guilds = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name
    }));

    res.json(guilds);

});


const TeamCareer = require("./models/TeamCareer");

app.post("/api/career/add", async (req, res) => {

    try {

        const {
            guildId,
            roleId,
            roleName
        } = req.body;

        const count =
            await TeamCareer.countDocuments({
                guildId
            });

        const career =
            await TeamCareer.create({
                guildId,
                roleId,
                roleName,
                position: count + 1
            });

        res.json({
            success: true,
            career
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });

    }

});

app.get("/api/career/:guildId", async (req, res) => {

    const careers =
        await TeamCareer.find({
            guildId: req.params.guildId
        }).sort({
            position: 1
        });

    res.json({
        success: true,
        careers
    });

});

app.delete("/api/career/:id", async (req, res) => {

    try {

        const TeamCareer =
            require("./models/TeamCareer");

        await TeamCareer.findByIdAndDelete(
            req.params.id
        );

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });

    }

});

app.post("/api/career/up/:id", async (req, res) => {

    try {

        const current =
            await TeamCareer.findById(
                req.params.id
            );

        if (!current) {
            return res.json({
                success: false
            });
        }

        const above =
            await TeamCareer.findOne({
                guildId: current.guildId,
                position:
                    current.position - 1
            });

        if (!above) {
            return res.json({
                success: false
            });
        }

        const oldPosition =
            current.position;

        current.position =
            above.position;

        above.position =
            oldPosition;

        await current.save();
        await above.save();

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });

    }

});

app.post("/api/career/down/:id", async (req, res) => {

    try {

        const current =
            await TeamCareer.findById(
                req.params.id
            );

        if (!current) {
            return res.json({
                success: false
            });
        }

        const below =
            await TeamCareer.findOne({
                guildId: current.guildId,
                position:
                    current.position + 1
            });

        if (!below) {
            return res.json({
                success: false
            });
        }

        const oldPosition =
            current.position;

        current.position =
            below.position;

        below.position =
            oldPosition;

        await current.save();
        await below.save();

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });

    }

});


app.get("/api/team/:guildId", async (req, res) => {

    try {

        const guild =
            client.guilds.cache.get(
                req.params.guildId
            );

        if (!guild) {
            return res.status(404).json({
                success: false
            });
        }

        await guild.members.fetch();

        const members =
            guild.members.cache
                .filter(member =>
                    !member.user.bot
                )
                .map(member => ({

                    id: member.id,

                    username:
                        member.user.username,

                    avatar:
                        member.user.displayAvatarURL(),

                    roles:
                        member.roles.cache
                            .filter(r =>
                                r.name !== "@everyone"
                            )
                            .map(r => ({
                                id: r.id,
                                name: r.name
                            }))

                }));

        res.json({
            success: true,
            members
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });

    }

});

app.post("/api/team/uprank", async (req, res) => {

    try {

        const {
            guildId,
            userId,
            newRoleId
        } = req.body;

        const guild =
            client.guilds.cache.get(
                guildId
            );

        if (!guild) {
            return res.status(404).json({
                success: false,
                message: "Guild nicht gefunden"
            });
        }

        const member =
            await guild.members.fetch(
                userId
            );

        await member.roles.add(
            newRoleId
        );

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });

    }

});

client.login(process.env.TOKEN);
