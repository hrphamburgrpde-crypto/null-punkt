const Backup = require('../models/Backup');

function createBackupId() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function createGuildBackup(guild, createdBy = 'AUTO') {
    const roles = guild.roles.cache
        .filter(role => !role.managed && role.id !== guild.id)
        .sort((a, b) => b.position - a.position)
        .map(role => ({
            id: role.id,
            name: role.name,
            color: role.hexColor,
            hoist: role.hoist,
            permissions: role.permissions.bitfield.toString(),
            mentionable: role.mentionable,
            position: role.position
        }));

    const channels = guild.channels.cache
        .sort((a, b) => a.rawPosition - b.rawPosition)
        .map(channel => ({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            parentId: channel.parentId,
            position: channel.rawPosition,
            topic: channel.topic || null,
            nsfw: channel.nsfw || false,
            rateLimitPerUser: channel.rateLimitPerUser || 0,
            permissionOverwrites: channel.permissionOverwrites.cache.map(perm => ({
                id: perm.id,
                type: perm.type,
                allow: perm.allow.bitfield.toString(),
                deny: perm.deny.bitfield.toString()
            }))
        }));

    const backupId = createBackupId();

    const backup = await Backup.create({
        guildId: guild.id,
        backupId,
        createdBy,
        data: {
            name: guild.name,
            roles,
            channels
        }
    });

    return backup;
}

module.exports = {
    createGuildBackup
};