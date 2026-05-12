const fs = require('fs');
const path = require('path');

module.exports = (guild) => {

    const filePath =
        path.join(__dirname, '../data/logs.json');

    if (!fs.existsSync(filePath)) return null;

    const data =
        JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const channelId = data[guild.id];

    if (!channelId) return null;

    return guild.channels.cache.get(channelId);
};