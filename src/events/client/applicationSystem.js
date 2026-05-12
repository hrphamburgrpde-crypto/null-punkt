const {
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits
} = require('discord.js');

const ApplicationSystem = require('../../models/ApplicationSystem');
const Application = require('../../models/Application');

const applicationCache = new Map();

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        try {
            if (interaction.isButton()) {
                if (interaction.customId === 'application_open') {
                    return openApplicationPage(interaction, 0);
                }

                if (interaction.customId.startsWith('application_accept_')) {
                    return openDecisionModal(interaction, 'accept');
                }

                if (interaction.customId.startsWith('application_deny_')) {
                    return openDecisionModal(interaction, 'deny');
                }

                if (interaction.customId.startsWith('application_next_')) {
                    const nextPage = Number(interaction.customId.replace('application_next_', ''));
                    return openApplicationPage(interaction, nextPage);
                }
            }

            if (interaction.isModalSubmit()) {
                if (interaction.customId.startsWith('application_page_')) {
                    return handleApplicationPage(interaction);
                }

                if (interaction.customId.startsWith('application_decision_accept_')) {
                    return handleApplicationDecision(interaction, 'accept');
                }

                if (interaction.customId.startsWith('application_decision_deny_')) {
                    return handleApplicationDecision(interaction, 'deny');
                }
            }

        } catch (err) {
            console.error('Application System Error:', err);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Fehler im Bewerbungssystem.',
                    flags: 64
                }).catch(() => {});
            }
        }
    }
};

async function openApplicationPage(interaction, page) {
    const data = await ApplicationSystem.findOne({
        guildId: interaction.guild.id
    });

    if (!data || !data.questions || !data.questions.length) {
        return interaction.reply({
            content: '❌ Bewerbungssystem wurde nicht richtig eingerichtet.',
            flags: 64
        });
    }

    if (page === 0) {
        const activeApplication = await Application.findOne({
            guildId: interaction.guild.id,
            panelChannelId: data.panelChannelId,
            userId: interaction.user.id,
            status: 'open'
        });

        if (activeApplication) {
            return interaction.reply({
                content: '❌ Du hast bereits eine offene Bewerbung. Warte bitte, bis sie angenommen oder abgelehnt wurde.',
                flags: 64
            });
        }
    }

    const questions = data.questions.slice(0, 15);
    const start = page * 5;
    const pageQuestions = questions.slice(start, start + 5);
    const totalPages = Math.ceil(questions.length / 5);

    const modal = new ModalBuilder()
        .setCustomId(`application_page_${page}`)
        .setTitle(`Bewerbung Seite ${page + 1}/${totalPages}`);

    pageQuestions.forEach((question, index) => {
        const realIndex = start + index;

        const input = new TextInputBuilder()
            .setCustomId(`answer_${realIndex}`)
            .setLabel(question.slice(0, 45))
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(input)
        );
    });

    return interaction.showModal(modal);
}

async function handleApplicationPage(interaction) {
    const page = Number(interaction.customId.replace('application_page_', ''));

    const data = await ApplicationSystem.findOne({
        guildId: interaction.guild.id
    });

    if (!data || !data.questions || !data.questions.length) {
        return interaction.reply({
            content: '❌ Bewerbungssystem wurde nicht richtig eingerichtet.',
            flags: 64
        });
    }

    const questions = data.questions.slice(0, 15);
    const totalPages = Math.ceil(questions.length / 5);

    const cacheKey = `${interaction.guild.id}_${interaction.user.id}`;

    const oldData = applicationCache.get(cacheKey) || {
        answers: {}
    };

    const start = page * 5;
    const pageQuestions = questions.slice(start, start + 5);

    pageQuestions.forEach((question, index) => {
        const realIndex = start + index;
        const answer = interaction.fields.getTextInputValue(`answer_${realIndex}`);

        oldData.answers[realIndex] = answer;
    });

    applicationCache.set(cacheKey, oldData);

    const nextPage = page + 1;

    if (nextPage < totalPages) {
        const button = new ButtonBuilder()
            .setCustomId(`application_next_${nextPage}`)
            .setLabel(`Weiter zu Seite ${nextPage + 1}`)
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Primary);

        return interaction.reply({
            content: `✅ Seite ${page + 1}/${totalPages} gespeichert. Klicke auf Weiter.`,
            components: [
                new ActionRowBuilder().addComponents(button)
            ],
            flags: 64
        });
    }

    return finishApplication(interaction, data, questions, oldData.answers);
}

async function finishApplication(interaction, data, questions, answers) {
    const channel = interaction.guild.channels.cache.get(data.logChannelId);

    if (!channel) {
        return interaction.reply({
            content: '❌ Bewerbungs-Kanal wurde nicht gefunden.',
            flags: 64
        });
    }

    const activeApplication = await Application.findOne({
        guildId: interaction.guild.id,
        panelChannelId: data.panelChannelId,
        userId: interaction.user.id,
        status: 'open'
    });

    if (activeApplication) {
        applicationCache.delete(`${interaction.guild.id}_${interaction.user.id}`);

        return interaction.reply({
            content: '❌ Du hast bereits eine offene Bewerbung. Warte bitte, bis sie angenommen oder abgelehnt wurde.',
            flags: 64
        });
    }

    await Application.create({
        guildId: interaction.guild.id,
        panelChannelId: data.panelChannelId,
        userId: interaction.user.id,
        status: 'open'
    });

    const fields = [];

    questions.forEach((question, index) => {
        fields.push({
            name: `❓ ${question}`,
            value: `\`${answers[index] || 'Keine Antwort'}\``,
            inline: false
        });
    });

    const embed = new EmbedBuilder()
        .setColor('#ffaa00')
        .setTitle('📋 Neue Bewerbung')
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
            {
                name: '👤 User',
                value: `${interaction.user}`,
                inline: true
            },
            {
                name: '🆔 User ID',
                value: `\`${interaction.user.id}\``,
                inline: true
            },
            ...fields
        )
        .setTimestamp();

    const accept = new ButtonBuilder()
        .setCustomId(`application_accept_${interaction.user.id}`)
        .setLabel('Annehmen')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success);

    const deny = new ButtonBuilder()
        .setCustomId(`application_deny_${interaction.user.id}`)
        .setLabel('Ablehnen')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger);

    await channel.send({
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(accept, deny)
        ]
    });

    applicationCache.delete(`${interaction.guild.id}_${interaction.user.id}`);

    await interaction.reply({
        content: '✅ Deine Bewerbung wurde vollständig abgeschickt.',
        flags: 64
    });
}

function openDecisionModal(interaction, type) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: '❌ Dafür brauchst du Administrator Rechte.',
            flags: 64
        });
    }

    const userId = interaction.customId.split('_')[2];

    const modal = new ModalBuilder()
        .setCustomId(`application_decision_${type}_${userId}`)
        .setTitle(type === 'accept' ? 'Bewerbung annehmen' : 'Bewerbung ablehnen');

    const reasonInput = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Grund')
        .setPlaceholder('Schreibe einen Grund...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(reasonInput)
    );

    return interaction.showModal(modal);
}

async function handleApplicationDecision(interaction, type) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: '❌ Dafür brauchst du Administrator Rechte.',
            flags: 64
        });
    }

    const userId = interaction.customId.split('_')[3];
    const reason = interaction.fields.getTextInputValue('reason');

    const data = await ApplicationSystem.findOne({
        guildId: interaction.guild.id
    });

    if (!data) {
        return interaction.reply({
            content: '❌ Bewerbungssystem wurde nicht eingerichtet.',
            flags: 64
        });
    }

    const user = await interaction.client.users.fetch(userId).catch(() => null);
    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    if (!user) {
        return interaction.reply({
            content: '❌ User wurde nicht gefunden.',
            flags: 64
        });
    }

    if (type === 'accept') {
        await Application.findOneAndUpdate(
            {
                guildId: interaction.guild.id,
                userId,
                status: 'open'
            },
            {
                status: 'accepted'
            },
            {
                sort: { createdAt: -1 }
            }
        );

        if (member && data.acceptRoles && data.acceptRoles.length) {
            for (const roleId of data.acceptRoles) {
                const role = interaction.guild.roles.cache.get(roleId);

                if (role) {
                    await member.roles.add(role).catch(() => {});
                }
            }
        }

        await user.send({
            embeds: [
                new EmbedBuilder()
                    .setColor('#00ff88')
                    .setTitle('✅ Bewerbung angenommen')
                    .setDescription(`Deine Bewerbung auf **${interaction.guild.name}** wurde angenommen.`)
                    .addFields({
                        name: '📄 Grund',
                        value: `\`${reason}\``
                    })
                    .setTimestamp()
            ]
        }).catch(() => {});

        const embed = EmbedBuilder.from(interaction.message.embeds[0])
            .setColor('#00ff88')
            .addFields({
                name: '✅ Angenommen',
                value: `Von ${interaction.user}\nGrund: \`${reason}\``
            })
            .setFooter({
                text: `✅ Angenommen von ${interaction.user.tag}`
            });

        return interaction.update({
            embeds: [embed],
            components: []
        });
    }

    await Application.findOneAndUpdate(
        {
            guildId: interaction.guild.id,
            userId,
            status: 'open'
        },
        {
            status: 'denied'
        },
        {
            sort: { createdAt: -1 }
        }
    );

    await user.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Bewerbung abgelehnt')
                .setDescription(`Deine Bewerbung auf **${interaction.guild.name}** wurde abgelehnt.`)
                .addFields({
                    name: '📄 Grund',
                    value: `\`${reason}\``
                })
                .setTimestamp()
        ]
    }).catch(() => {});

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor('#ff0000')
        .addFields({
            name: '❌ Abgelehnt',
            value: `Von ${interaction.user}\nGrund: \`${reason}\``
        })
        .setFooter({
            text: `❌ Abgelehnt von ${interaction.user.tag}`
        });

    return interaction.update({
        embeds: [embed],
        components: []
    });
}