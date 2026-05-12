require('dotenv').config();

const { REST, Routes } = require('discord.js');

const fs = require('fs');
const path = require('path');

const commands = [];

const foldersPath = path.join(__dirname, 'src/commands');

const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {

    const commandsPath = path.join(foldersPath, folder);

    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {

        const filePath = path.join(commandsPath, file);

        const command = require(filePath);

        if (!command.data) {
            console.log(`${file} hat kein data Objekt.`);
            continue;
        }

        commands.push(command.data.toJSON());
    }
}

const rest = new REST({ version: '10' })
    .setToken(process.env.TOKEN);

(async () => {

    try {

        console.log('Registriere Commands...');

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log('Commands registriert.');

    } catch (error) {

        console.error(error);
    }
})();