require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {
    REST,
    Routes
} = require('discord.js');

const commands = [];

const commandsPath = path.join(__dirname, 'src', 'commands');

function loadCommands(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            const command = require(filePath);

            if (command.data) {
                commands.push(command.data.toJSON());
                console.log(`✅ Command gefunden: ${command.data.name}`);
            }
        }
    }
}

loadCommands(commandsPath);

const rest = new REST({
    version: '10'
}).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🌍 Registriere globale Commands...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            {
                body: commands
            }
        );

        console.log('✅ Globale Commands registriert.');
        console.log('⏳ Es kann ein paar Minuten dauern, bis sie auf allen Servern sichtbar sind.');

    } catch (error) {
        console.error('❌ Fehler beim Registrieren:', error);
    }
})();