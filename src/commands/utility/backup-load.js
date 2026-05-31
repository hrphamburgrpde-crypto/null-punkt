const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');

const Backup = require('../../models/Backup');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup-load')
        .setDescription('Lädt ein Server Backup')
        .addStringOption(option =>
            option
                .setName('backup_id')
                .setDescription('Die Backup ID')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Dafür brauchst du Administrator Rechte.',
                flags: 64
            });
        }

        await interaction.deferReply({ flags: 64 });

        const backupId = interaction.options.getString('backup_id');

        const backup = await Backup.findOne({
            guildId: interaction.guild.id,
            backupId
        });

        if (!backup) {
            return interaction.editReply({
                content: '❌ Backup wurde nicht gefunden.'
            });
        }

        const data = backup.data;

        const roleMap = new Map();
        const channelMap = new Map();

        for (const roleData of data.roles.reverse()) {
            const role = await interaction.guild.roles.create({
                name: roleData.name,
                color: roleData.color,
                hoist: roleData.hoist,
                permissions: BigInt(roleData.permissions),
                mentionable: roleData.mentionable,
                reason: `Backup Load ${backupId}`
            }).catch(() => null);

            if (role) roleMap.set(roleData.id, role.id);
        }

        const categories = data.channels.filter(c => c.type === ChannelType.GuildCategory);
        const others = data.channels.filter(c => c.type !== ChannelType.GuildCategory);

        for (const channelData of categories) {
            const channel = await createBackupChannel(interaction, channelData, null, roleMap);

            if (channel) channelMap.set(channelData.id, channel.id);
        }

        for (const channelData of others) {
            const parentId = channelData.parentId
                ? channelMap.get(channelData.parentId)
                : null;

            const channel = await createBackupChannel(interaction, channelData, parentId, roleMap);

            if (channel) channelMap.set(channelData.id, channel.id);
        }

        return interaction.editReply({
            content: `✅ Backup \`${backupId}\` wurde geladen.`
        });
    }
};

async function createBackupChannel(interaction, channelData, parentId, roleMap) {
    const overwrites = channelData.permissionOverwrites.map(perm => {
        const id = roleMap.get(perm.id) || perm.id;

        return {
            id,
            allow: BigInt(perm.allow),
            deny: BigInt(perm.deny),
            type: perm.type
        };
    });

    return interaction.guild.channels.create({
        name: channelData.name,
        type: channelData.type,
        parent: parentId,
        topic: channelData.topic || undefined,
        nsfw: channelData.nsfw || false,
        rateLimitPerUser: channelData.rateLimitPerUser || 0,
        permissionOverwrites: overwrites,
        reason: 'Backup Load'
    }).catch(() => null);
}