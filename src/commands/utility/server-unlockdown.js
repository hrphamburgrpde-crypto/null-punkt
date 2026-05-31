const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    GuildScheduledEventStatus
} = require('discord.js');

const LockdownSystem = require('../../models/LockdownSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-unlockdown')
        .setDescription('Beendet den Server Lockdown'),

    async execute(interaction) {
        if (
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
            interaction.guild.ownerId !== interaction.user.id
        ) {
            return interaction.reply({
                content: '❌ Dafür brauchst du Administrator Rechte.',
                flags: 64
            });
        }

        await interaction.deferReply({ flags: 64 });

        const data = await LockdownSystem.findOne({
            guildId: interaction.guild.id,
            active: true
        });

        if (!data) {
            return interaction.editReply({
                content: '❌ Es läuft aktuell kein Lockdown.'
            });
        }

        await endLockdown(interaction.guild, data, interaction.user);

        return interaction.editReply({
            content: '✅ Lockdown wurde beendet.'
        });
    }
};

async function endLockdown(guild, data, user = null) {
    for (const saved of data.channels) {
        const channel = guild.channels.cache.get(saved.channelId);
        if (!channel) continue;

        if (saved.existed) {
            await channel.permissionOverwrites.edit(guild.id, {
                SendMessages: null,
                CreatePublicThreads: null,
                CreatePrivateThreads: null,
                SendMessagesInThreads: null,
                AddReactions: null
            }).catch(() => {});
        } else {
            await channel.permissionOverwrites.delete(guild.id).catch(() => {});
        }
    }

    for (const savedMsg of data.messages) {
        const channel = guild.channels.cache.get(savedMsg.channelId);
        if (!channel) continue;

        const msg = await channel.messages.fetch(savedMsg.messageId).catch(() => null);
        if (msg) await msg.delete().catch(() => {});
    }

    const unlockEmbed = new EmbedBuilder()
        .setColor('#00ff88')
        .setTitle('🔓 Lockdown beendet')
        .setDescription('Der Server Lockdown wurde beendet. Die Kanäle sind wieder freigegeben.')
        .addFields({
            name: '👮 Beendet von',
            value: user ? `${user}` : '`Automatisch`'
        })
        .setTimestamp();

    for (const saved of data.channels) {
        const channel = guild.channels.cache.get(saved.channelId);
        if (!channel || !channel.isTextBased()) continue;

        const msg = await channel.send({
            embeds: [unlockEmbed]
        }).catch(() => null);

        if (msg) {
            setTimeout(() => {
                msg.delete().catch(() => {});
            }, 10 * 1000);
        }
    }

    if (data.eventId) {
        const event = await guild.scheduledEvents.fetch(data.eventId).catch(() => null);

        if (event) {
            await event.edit({
                status: GuildScheduledEventStatus.Completed
            }).catch(async () => {
                await event.delete('Lockdown beendet').catch(() => {});
            });
        }
    }

    data.active = false;
    await data.save();
}

module.exports.endLockdown = endLockdown;