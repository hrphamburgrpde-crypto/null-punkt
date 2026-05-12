const fs = require('fs');
const path = require('path');

module.exports = (client) => {

    const foldersPath = path.join(__dirname, '../commands');

    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {

        const commandsPath = path.join(foldersPath, folder);

        const commandFiles = fs
            .readdirSync(commandsPath)
            .filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {

            const filePath = path.join(commandsPath, file);

            const command = require(filePath);

            if (!command.data || !command.execute) {
                console.log(`[FEHLER] ${file} ist kaputt.`);
                continue;
            }

            client.commands.set(command.data.name, command);
        }
    }
};