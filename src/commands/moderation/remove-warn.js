const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const Warn = require('../../models/Warn');

module.exports = {

    data: new SlashCommandBuilder()

        .setName('remove-warn')

        .setDescription(
            'Löscht eine bestimmte Warn'
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Der User')
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName('warn')
                .setDescription(
                    'Die Warn Nummer'
                )
                .setRequired(true)
                .setMinValue(1)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {

        try {

            //
            // RECHTE
            //

            const member =
                interaction.member;

            if (
                !member.permissions.has(
                    PermissionFlagsBits.Administrator
                ) &&
                !member.permissions.has(
                    PermissionFlagsBits.KickMembers
                ) &&
                !member.permissions.has(
                    PermissionFlagsBits.BanMembers
                ) &&
                !member.permissions.has(
                    PermissionFlagsBits.ModerateMembers
                )
            ) {

                return interaction.reply({

                    content:
                        '❌ Keine Rechte.',

                    flags: 64
                });
            }

            //
            // USER
            //

            const user =
                interaction.options.getUser(
                    'user'
                );

            const warnNumber =
                interaction.options.getInteger(
                    'warn'
                );

            //
            // WARNS HOLEN
            //

            const warns =
                await Warn.find({

                    guildId:
                        interaction.guild.id,

                    userId: user.id

                }).sort({

                    createdAt: 1
                });

            //
            // EXISTIERT?
            //

            if (
                warnNumber > warns.length
            ) {

                return interaction.reply({

                    content:
                        '❌ Diese Warn existiert nicht.',

                    flags: 64
                });
            }

            //
            // WARN
            //

            const warn =
                warns[warnNumber - 1];

            //
            // DELETE
            //

            await Warn.findByIdAndDelete(
                warn._id
            );

            //
            // EMBED
            //

            const embed =
                new EmbedBuilder()

                    .setColor('#00ff88')

                    .setTitle(
                        '✅ Warn gelöscht'
                    )

                    .setDescription(
                        `Warn #${warnNumber} von ${user} wurde gelöscht.`
                    )

                    .addFields(
                        {
                            name: '📄 Grund',

                            value:
                                `\`${warn.reason}\``
                        },
                        {
                            name: '👮 Moderator',

                            value:
                                `${interaction.user}`
                        }
                    )

                    .setTimestamp();

            //
            // DM
            //

            try {

                const dm =
                    new EmbedBuilder()

                        .setColor(
                            '#00ff88'
                        )

                        .setTitle(
                            '✅ Warn entfernt'
                        )

                        .setDescription(
                            `Eine Warn auf dem Server \`${interaction.guild.name}\` wurde entfernt.`
                        )

                        .addFields(
                            {
                                name: '📄 Grund',

                                value:
                                    `\`${warn.reason}\``
                            }
                        )

                        .setTimestamp();

                await user.send({

                    embeds: [dm]
                });

            } catch {}

            //
            // REPLY
            //

            await interaction.reply({

                embeds: [embed]
            });

        } catch (err) {

            console.error(err);

            interaction.reply({

                content:
                    '❌ Fehler beim remove-warn Command.',

                flags: 64
            });
        }
    }
};