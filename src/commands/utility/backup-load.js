const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require('discord.js');

const Backup = require('../../models/Backup');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup-load')
        .setDescription('Lädt ein Server Backup und ersetzt Kanäle/Rollen')
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

        const guild = interaction.guild;
        const botMember = guild.members.me;
        const commandChannelId = interaction.channel.id;

        await interaction.editReply({
            content: '⚠️ Backup wird geladen. Alte Kanäle und normale Rollen werden ersetzt...'
        });

        for (const channel of guild.channels.cache.values()) {
            if (channel.id === commandChannelId) continue;
            await channel.delete('Backup Load - alte Kanäle löschen').catch(() => {});
        }

        const rolesToDelete = guild.roles.cache
            .filter(role =>
                role.id !== guild.id &&
                !role.managed &&
                role.editable &&
                role.position < botMember.roles.highest.position
            )
            .sort((a, b) => b.position - a.position);

        for (const role of rolesToDelete.values()) {
            await role.delete('Backup Load - alte normale Rollen löschen').catch(() => {});
        }

        const data = backup.data;
        const roleMap = new Map();
        const channelMap = new Map();
        const createdTextChannels = [];

        const roles = [...data.roles].reverse();

        for (const roleData of roles) {
            const role = await guild.roles.create({
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
            const channel = await createBackupChannel(guild, channelData, null, roleMap);

            if (channel) channelMap.set(channelData.id, channel.id);
        }

        for (const channelData of others) {
            const parentId = channelData.parentId
                ? channelMap.get(channelData.parentId)
                : null;

            const channel = await createBackupChannel(guild, channelData, parentId, roleMap);

            if (channel) {
                channelMap.set(channelData.id, channel.id);

                if (channel.type === ChannelType.GuildText) {
                    createdTextChannels.push(channel);
                }
            }
        }

        const infoEmbed = new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle('📦 Backup System')
            .setDescription('Dieser Kanal wurde durch das Backup System wiederhergestellt.')
            .addFields(
                {
                    name: '🆔 Backup ID',
                    value: `\`${backupId}\``,
                    inline: true
                },
                {
                    name: '👤 Geladen von',
                    value: `${interaction.user}`,
                    inline: true
                }
            )
            .setTimestamp();

        for (const channel of createdTextChannels) {
            await channel.send({
                embeds: [infoEmbed]
            }).catch(() => {});
        }

        await interaction.user.send({
            content: `✅ Backup \`${backupId}\` wurde auf **${guild.name}** geladen.`
        }).catch(() => {});

        await interaction.editReply({
            content: `✅ Backup \`${backupId}\` wurde geladen. Dieser alte Kanal wird gleich gelöscht.`
        }).catch(() => {});

        setTimeout(async () => {
            const oldChannel = guild.channels.cache.get(commandChannelId);
            if (oldChannel) {
                await oldChannel.delete('Backup Load - letzter alter Kanal').catch(() => {});
            }
        }, 5000);
    }
};

async function createBackupChannel(guild, channelData, parentId, roleMap) {
    const overwrites = channelData.permissionOverwrites.map(perm => {
        const mappedId = roleMap.get(perm.id) || perm.id;

        return {
            id: mappedId,
            allow: BigInt(perm.allow),
            deny: BigInt(perm.deny),
            type: perm.type
        };
    });

    return guild.channels.create({
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