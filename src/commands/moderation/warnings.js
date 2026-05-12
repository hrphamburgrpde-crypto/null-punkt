const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const Warn = require('../../models/Warn');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Zeigt alle Warnungen')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Der User')
                .setRequired(true)
        ),

    async execute(interaction) {

        try {

            const user =
                interaction.options.getUser('user');

            const warns = await Warn.find({

                guildId: interaction.guild.id,
                userId: user.id

            });

            if (!warns.length) {

                return interaction.reply({

                    content:
                        '❌ Keine Warnungen gefunden.',

                    flags: MessageFlags.Ephemeral
                });
            }

            const embed = new EmbedBuilder()

                .setColor('Orange')

                .setTitle(
                    `⚠️ Warnungen von ${user.tag}`
                )

                .setThumbnail(
                    user.displayAvatarURL()
                )

                .setTimestamp();

            warns.forEach((warn, index) => {

                embed.addFields({

                    name: `⚠️ Warn #${index + 1}`,

                    value:
                        `👮 Moderator: <@${warn.moderatorId}>\n` +
                        `📄 Grund: \`${warn.reason}\`\n` +
                        `⏱️ Dauer: \`${warn.duration}\`\n` +
                        `🕒 Datum: <t:${Math.floor(new Date(warn.createdAt).getTime() / 1000)}:F>`
                });
            });

            await interaction.reply({

                embeds: [embed],

                flags: MessageFlags.Ephemeral
            });

        } catch (err) {

            console.error(err);

            interaction.reply({

                content:
                    '❌ Fehler beim warnings Command.',

                flags: MessageFlags.Ephemeral
            });
        }
    }
};