const {
    Events,
    EmbedBuilder,
    AuditLogEvent,
    PermissionsBitField
} = require('discord.js');

const SecuritySystem = require('../../models/SecuritySystem');

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        console.log('✅ Security System gestartet');

        client.on(Events.ChannelCreate, async channel => {
            if (!channel.guild) return;

            const executor = await getExecutor(channel.guild, AuditLogEvent.ChannelCreate);
            await handleSecurity(channel.guild, executor, 'Kanal erstellt', channel.name, async () => {
                await channel.delete('Admin Lock - unerlaubter Kanal erstellt').catch(() => {});
            });
        });

        client.on(Events.ChannelDelete, async channel => {
            if (!channel.guild) return;

            const executor = await getExecutor(channel.guild, AuditLogEvent.ChannelDelete);
            await handleSecurity(channel.guild, executor, 'Kanal gelöscht', channel.name);
        });

        client.on(Events.RoleCreate, async role => {
            const executor = await getExecutor(role.guild, AuditLogEvent.RoleCreate);
            await handleSecurity(role.guild, executor, 'Rolle erstellt', role.name, async () => {
                await role.delete('Admin Lock - unerlaubte Rolle erstellt').catch(() => {});
            });
        });

        client.on(Events.RoleDelete, async role => {
            const executor = await getExecutor(role.guild, AuditLogEvent.RoleDelete);
            await handleSecurity(role.guild, executor, 'Rolle gelöscht', role.name);
        });

        client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
            const oldAdmin = oldMember.permissions.has(PermissionsBitField.Flags.Administrator);
            const newAdmin = newMember.permissions.has(PermissionsBitField.Flags.Administrator);

            if (!oldAdmin && newAdmin) {
                const executor = await getExecutor(newMember.guild, AuditLogEvent.MemberRoleUpdate);

                await handleSecurity(
                    newMember.guild,
                    executor,
                    'Administrator Rechte vergeben',
                    newMember.user.tag,
                    async () => {
                        const addedRoles = newMember.roles.cache.filter(role =>
                            !oldMember.roles.cache.has(role.id) &&
                            role.permissions.has(PermissionsBitField.Flags.Administrator)
                        );

                        for (const role of addedRoles.values()) {
                            await newMember.roles.remove(role, 'Admin Lock - Admin Rolle entfernt').catch(() => {});
                        }
                    }
                );
            }
        });
    }
};

async function getExecutor(guild, type) {
    const logs = await guild.fetchAuditLogs({
        type,
        limit: 1
    }).catch(() => null);

    const entry = logs?.entries?.first();
    if (!entry) return null;

    if (Date.now() - entry.createdTimestamp > 10 * 1000) return null;

    return entry.executor || null;
}

async function handleSecurity(guild, executor, action, target, blockAction = null) {
    const data = await SecuritySystem.findOne({
        guildId: guild.id
    });

    if (!data) return;

    const isTrusted =
        executor &&
        (
            executor.id === guild.ownerId ||
            executor.id === guild.client.user.id ||
            data.trustedUserIds.includes(executor.id)
        );

    if (data.adminLockEnabled && !isTrusted && blockAction) {
        await blockAction();
    }

    if (!data.securityAlertsEnabled) return;

    const embed = new EmbedBuilder()
        .setColor(data.adminLockEnabled && !isTrusted ? '#ff0000' : '#ffaa00')
        .setTitle('🚨 Security Alert')
        .addFields(
            {
                name: '⚠️ Aktion',
                value: `\`${action}\``,
                inline: true
            },
            {
                name: '🎯 Ziel',
                value: `\`${target || 'Unbekannt'}\``,
                inline: true
            },
            {
                name: '👤 Ausgeführt von',
                value: executor ? `${executor} \`${executor.id}\`` : '`Unbekannt`',
                inline: false
            },
            {
                name: '🔒 Admin Lock',
                value: data.adminLockEnabled
                    ? (!isTrusted ? '`Blockiert / Rückgängig gemacht`' : '`Vertrauensperson erlaubt`')
                    : '`Nicht aktiv`',
                inline: false
            }
        )
        .setTimestamp();

    const logChannel = data.alertLogChannelId
        ? guild.channels.cache.get(data.alertLogChannelId)
        : null;

    if (logChannel) {
        await logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    if (data.ownerDmAlerts) {
        const owner = await guild.fetchOwner().catch(() => null);
        if (owner) {
            await owner.send({ embeds: [embed] }).catch(() => {});
        }
    }
}