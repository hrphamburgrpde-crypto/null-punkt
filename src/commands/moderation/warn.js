const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');

const Warn = require('../../models/Warn');

module.exports = {

    data: new SlashCommandBuilder()

        .setName('warn')

        .setDescription('Warnt einen User')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Der User')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('grund')
                .setDescription('Der Grund')
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName('dauer')
                .setDescription(
                    'Dauer in Tagen'
                )
                .setRequired(true)
                .setMinValue(1)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {

        try {

            const user =
                interaction.options.getUser(
                    'user'
                );

            const reason =
                interaction.options.getString(
                    'grund'
                );

            const duration =
                interaction.options.getInteger(
                    'dauer'
                );

            //
            // WARN COUNT
            //

            const warnCount =
                await Warn.countDocuments({

                    guildId:
                        interaction.guild.id,

                    userId: user.id
                });

            const currentWarn =
                warnCount + 1;

            //
            // EXPIRE
            //

            const expires =
                new Date(

                    Date.now() +

                    duration *
                    24 *
                    60 *
                    60 *
                    1000
                );

            //
            // SAVE
            //

            const warn =
                await Warn.create({

                    guildId:
                        interaction.guild.id,

                    userId: user.id,

                    moderatorId:
                        interaction.user.id,

                    reason,

                    duration,

                    expiresAt: expires
                });

            //
            // BUTTON
            //

            const button =
                new ButtonBuilder()

                    .setCustomId(
                        `warn_appeal_${warn._id}`
                    )

                    .setLabel(
                        'Einspruch'
                    )

                    .setStyle(
                        ButtonStyle.Danger
                    );

            const row =
                new ActionRowBuilder()
                    .addComponents(button);

            //
            // DM EMBED
            //

            const embed =
                new EmbedBuilder()

                    .setColor('#ff9900')

                    .setTitle(
                        `⚠️ Warnung #${currentWarn}`
                    )

                    .setDescription(
                        'Du wurdest verwarnt.'
                    )

                    .addFields(

                        {
                            name: '📌 Server',

                            value:
                                `\`${interaction.guild.name}\``,

                            inline: true
                        },

                        {
                            name: '👮 Moderator',

                            value:
                                `\`${interaction.user.tag}\``,

                            inline: true
                        },

                        {
                            name: '📄 Grund',

                            value:
                                `\`${reason}\``,

                            inline: false
                        },

                        {
                            name: '⏱️ Dauer',

                            value:
                                `\`${duration} Tage\``,

                            inline: true
                        },

                        {
                            name: '🆔 Warn Nummer',

                            value:
                                `\`#${currentWarn}\``,

                            inline: true
                        },

                        {
                            name: '🕒 Ablauf',

                            value:
                                `<t:${Math.floor(expires.getTime() / 1000)}:F>`
                        }
                    )

                    .setThumbnail(
                        user.displayAvatarURL()
                    )

                    .setTimestamp();

            try {

                await user.send({

                    embeds: [embed],

                    components: [row]
                });

            } catch {}

            //
            // SUCCESS
            //

            const success =
                new EmbedBuilder()

                    .setColor('#ffaa00')

                    .setTitle(
                        '✅ User verwarnt'
                    )

                    .setDescription(
                        `${user} wurde erfolgreich verwarnt.`
                    )

                    .addFields(
                        {
                            name: '📄 Grund',

                            value:
                                `\`${reason}\``
                        },
                        {
                            name: '🆔 Warn Nummer',

                            value:
                                `\`#${currentWarn}\``
                        }
                    )

                    .setTimestamp();

            await interaction.reply({

                embeds: [success]
            });

        } catch (err) {

            console.error(err);

            interaction.reply({

                content:
                    '❌ Fehler beim warn Command.',

                flags: 64
            });
        }
    }
};