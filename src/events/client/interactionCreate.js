const {
    Events,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const BotBan = require('../../models/BotBan');
const Warn = require('../../models/Warn');
const WarnAppealChannel = require('../../models/WarnAppealChannel');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction, client) {
        //
        // ================= COMMANDS =================
        //

        if (interaction.isChatInputCommand()) {
            const botBan = await BotBan.findOne({
                userId: interaction.user.id
            });

            if (botBan && interaction.user.id !== process.env.OWNER_ID) {
                return interaction.reply({
                    content: '🚫 Du bist für diesen Bot gesperrt und kannst keine Commands benutzen.',
                    flags: 64
                });
            }

            const command = client.commands.get(interaction.commandName);

            if (!command) {
                return interaction.reply({
                    content: '❌ Dieser Command wurde nicht gefunden.',
                    flags: 64
                });
            }

            try {
                await command.execute(interaction, client);
            } catch (err) {
                console.error(err);

                if (!interaction.replied && !interaction.deferred) {
                    return interaction.reply({
                        content: '❌ Fehler beim Command.',
                        flags: 64
                    });
                }

                return interaction.followUp({
                    content: '❌ Fehler beim Command.',
                    flags: 64
                }).catch(() => {});
            }
        }

        //
        // ================= BUTTONS =================
        //

        if (interaction.isButton()) {
            //
            // WARN APPEAL BUTTON
            //

            if (interaction.customId.startsWith('warn_appeal_')) {
                try {
                    const warnId = interaction.customId.replace('warn_appeal_', '');
                    const warn = await Warn.findById(warnId);

                    if (!warn) {
                        return interaction.reply({
                            content: '❌ Warn nicht gefunden.',
                            flags: 64
                        });
                    }

                    if (warn.appealed) {
                        return interaction.reply({
                            content: '❌ Bereits Einspruch erstellt.',
                            flags: 64
                        });
                    }

                    const modal = new ModalBuilder()
                        .setCustomId(`appeal_modal_${warnId}`)
                        .setTitle('Warn Einspruch');

                    const input = new TextInputBuilder()
                        .setCustomId('appeal_text')
                        .setLabel('Warum soll die Warn entfernt werden?')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                        .setPlaceholder('Schreibe deinen Einspruch...');

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(input)
                    );

                    return interaction.showModal(modal);
                } catch (err) {
                    console.error(err);
                }
            }

            //
            // ACCEPT WARN
            //

            if (interaction.customId.startsWith('accept_warn_')) {
                try {
                    const warnId = interaction.customId.replace('accept_warn_', '');
                    const warn = await Warn.findById(warnId);

                    if (!warn) {
                        return interaction.reply({
                            content: '❌ Warn nicht gefunden.',
                            flags: 64
                        });
                    }

                    const user = await client.users.fetch(warn.userId).catch(() => null);

                    await Warn.findByIdAndDelete(warnId);

                    if (user) {
                        const dmEmbed = new EmbedBuilder()
                            .setColor('#00ff88')
                            .setTitle('✅ Einspruch angenommen')
                            .setDescription('Dein Einspruch wurde akzeptiert und deine Warn entfernt.')
                            .addFields({
                                name: '📄 Grund',
                                value: `\`${warn.reason}\``
                            })
                            .setTimestamp();

                        await user.send({
                            embeds: [dmEmbed]
                        }).catch(() => {});
                    }

                    const accepted = EmbedBuilder.from(interaction.message.embeds[0])
                        .setColor('#00ff88')
                        .setFooter({
                            text: `✅ Angenommen von ${interaction.user.tag}`
                        });

                    return interaction.update({
                        embeds: [accepted],
                        components: []
                    });
                } catch (err) {
                    console.error(err);
                }
            }

            //
            // DECLINE WARN
            //

            if (interaction.customId.startsWith('decline_warn_')) {
                try {
                    const warnId = interaction.customId.replace('decline_warn_', '');
                    const warn = await Warn.findById(warnId);

                    if (!warn) {
                        return interaction.reply({
                            content: '❌ Warn nicht gefunden.',
                            flags: 64
                        });
                    }

                    const user = await client.users.fetch(warn.userId).catch(() => null);

                    if (user) {
                        const dmEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('❌ Einspruch abgelehnt')
                            .setDescription('Dein Einspruch wurde abgelehnt.')
                            .addFields({
                                name: '📄 Grund',
                                value: `\`${warn.reason}\``
                            })
                            .setTimestamp();

                        await user.send({
                            embeds: [dmEmbed]
                        }).catch(() => {});
                    }

                    const declined = EmbedBuilder.from(interaction.message.embeds[0])
                        .setColor('#ff0000')
                        .setFooter({
                            text: `❌ Abgelehnt von ${interaction.user.tag}`
                        });

                    return interaction.update({
                        embeds: [declined],
                        components: []
                    });
                } catch (err) {
                    console.error(err);
                }
            }
        }

        //
        // ================= MODALS =================
        //

        if (interaction.isModalSubmit()) {
            //
            // WARN APPEAL MODAL
            //

            if (interaction.customId.startsWith('appeal_modal_')) {
                try {
                    const warnId = interaction.customId.replace('appeal_modal_', '');
                    const warn = await Warn.findById(warnId);

                    if (!warn) {
                        return interaction.reply({
                            content: '❌ Warn nicht gefunden.',
                            flags: 64
                        });
                    }

                    if (warn.appealed) {
                        return interaction.reply({
                            content: '❌ Bereits Einspruch erstellt.',
                            flags: 64
                        });
                    }

                    warn.appealed = true;
                    await warn.save();

                    const data = await WarnAppealChannel.findOne({
                        guildId: warn.guildId
                    });

                    if (!data) {
                        return interaction.reply({
                            content: '❌ Kein Einspruch Kanal gesetzt.',
                            flags: 64
                        });
                    }

                    const guild = client.guilds.cache.get(warn.guildId);

                    if (!guild) {
                        return interaction.reply({
                            content: '❌ Server wurde nicht gefunden.',
                            flags: 64
                        });
                    }

                    const channel = guild.channels.cache.get(data.channelId);

                    if (!channel) {
                        return interaction.reply({
                            content: '❌ Einspruch Kanal wurde nicht gefunden.',
                            flags: 64
                        });
                    }

                    const text = interaction.fields.getTextInputValue('appeal_text');

                    const accept = new ButtonBuilder()
                        .setCustomId(`accept_warn_${warnId}`)
                        .setLabel('Annehmen')
                        .setStyle(ButtonStyle.Success);

                    const decline = new ButtonBuilder()
                        .setCustomId(`decline_warn_${warnId}`)
                        .setLabel('Ablehnen')
                        .setStyle(ButtonStyle.Danger);

                    const row = new ActionRowBuilder().addComponents(
                        accept,
                        decline
                    );

                    const warnCount = await Warn.countDocuments({
                        guildId: warn.guildId,
                        userId: warn.userId
                    });

                    const embed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle(`📨 Warn Einspruch #${warnCount}`)
                        .addFields(
                            {
                                name: '👤 User',
                                value: `<@${warn.userId}>`
                            },
                            {
                                name: '📄 Warn Grund',
                                value: `\`${warn.reason}\``
                            },
                            {
                                name: '📝 Einspruch',
                                value: `\`${text}\``
                            }
                        )
                        .setTimestamp();

                    await channel.send({
                        embeds: [embed],
                        components: [row]
                    });

                    try {
                        await interaction.message.edit({
                            components: []
                        });
                    } catch {}

                    return interaction.reply({
                        content: '✅ Einspruch gesendet.',
                        flags: 64
                    });
                } catch (err) {
                    console.error(err);

                    if (!interaction.replied && !interaction.deferred) {
                        return interaction.reply({
                            content: '❌ Fehler beim Einspruch.',
                            flags: 64
                        });
                    }
                }
            }
        }
    }
};