const { Events, EmbedBuilder } = require('discord.js');
const LogChannel = require('../../models/LogChannel');

module.exports = {
    name: Events.GuildMemberUpdate,

    async execute(oldMember, newMember) {
        const data = await LogChannel.findOne({
            guildId: newMember.guild.id
        });

        if (!data) return;

        const logChannel = newMember.guild.channels.cache.get(data.channelId);
        if (!logChannel) return;

        if (oldMember.nickname !== newMember.nickname) {
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('📝 Nickname geändert')
                .setThumbnail(newMember.user.displayAvatarURL())
                .addFields(
                    {
                        name: '👤 User',
                        value: `${newMember.user}`,
                        inline: true
                    },
                    {
                        name: '📄 Alt',
                        value: `\`${oldMember.nickname || oldMember.user.username}\``,
                        inline: true
                    },
                    {
                        name: '📄 Neu',
                        value: `\`${newMember.nickname || newMember.user.username}\``,
                        inline: true
                    }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }

        const addedRoles = newMember.roles.cache.filter(
            role => !oldMember.roles.cache.has(role.id)
        );

        for (const role of addedRoles.values()) {
            if (role.name === '@everyone') continue;

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('➕ Rolle hinzugefügt')
                .setThumbnail(newMember.user.displayAvatarURL())
                .addFields(
                    {
                        name: '👤 User',
                        value: `${newMember.user}`,
                        inline: true
                    },
                    {
                        name: '🎭 Rolle',
                        value: `${role}`,
                        inline: true
                    }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }

        const removedRoles = oldMember.roles.cache.filter(
            role => !newMember.roles.cache.has(role.id)
        );

        for (const role of removedRoles.values()) {
            if (role.name === '@everyone') continue;

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('➖ Rolle entfernt')
                .setThumbnail(newMember.user.displayAvatarURL())
                .addFields(
                    {
                        name: '👤 User',
                        value: `${newMember.user}`,
                        inline: true
                    },
                    {
                        name: '🎭 Rolle',
                        value: `${role.name}`,
                        inline: true
                    }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }

        if (!oldMember.communicationDisabledUntil && newMember.communicationDisabledUntil) {
            const embed = new EmbedBuilder()
                .setColor('Orange')
                .setTitle('🔇 Timeout gesetzt')
                .setThumbnail(newMember.user.displayAvatarURL())
                .addFields(
                    {
                        name: '👤 User',
                        value: `${newMember.user}`,
                        inline: true
                    },
                    {
                        name: '⏱️ Bis',
                        value: `<t:${Math.floor(new Date(newMember.communicationDisabledUntil).getTime() / 1000)}:F>`,
                        inline: true
                    }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }

        if (oldMember.communicationDisabledUntil && !newMember.communicationDisabledUntil) {
            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('🔊 Timeout entfernt')
                .setThumbnail(newMember.user.displayAvatarURL())
                .addFields({
                    name: '👤 User',
                    value: `${newMember.user}`
                })
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }
    }
};