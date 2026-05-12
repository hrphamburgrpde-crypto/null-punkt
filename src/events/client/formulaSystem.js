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

const FormulaSystem = require('../../models/FormulaSystem');

const formulaCache = new Map();

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        try {
            if (interaction.isButton()) {
                if (interaction.customId === 'formula_open') {
                    return openFormulaPage(interaction, 0);
                }

                if (interaction.customId.startsWith('formula_next_')) {
                    const nextPage = Number(interaction.customId.replace('formula_next_', ''));
                    return openFormulaPage(interaction, nextPage);
                }

                if (interaction.customId.startsWith('formula_accept_')) {
                    return openFormulaDecisionModal(interaction, 'accept');
                }

                if (interaction.customId.startsWith('formula_deny_')) {
                    return openFormulaDecisionModal(interaction, 'deny');
                }
            }

            if (interaction.isModalSubmit()) {
                if (interaction.customId.startsWith('formula_page_')) {
                    return handleFormulaPage(interaction);
                }

                if (interaction.customId.startsWith('formula_decision_accept_')) {
                    return handleFormulaDecision(interaction, 'accept');
                }

                if (interaction.customId.startsWith('formula_decision_deny_')) {
                    return handleFormulaDecision(interaction, 'deny');
                }
            }

        } catch (err) {
            console.error('Formula System Error:', err);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Fehler im Formular System.',
                    flags: 64
                }).catch(() => {});
            }
        }
    }
};

async function openFormulaPage(interaction, page) {
    const data = await FormulaSystem.findOne({
        guildId: interaction.guild.id
    });

    if (!data || !data.questions || !data.questions.length) {
        return interaction.reply({
            content: '❌ Formular wurde nicht richtig eingerichtet.',
            flags: 64
        });
    }

    const questions = data.questions.slice(0, 15);
    const start = page * 5;
    const pageQuestions = questions.slice(start, start + 5);
    const totalPages = Math.ceil(questions.length / 5);

    const modal = new ModalBuilder()
        .setCustomId(`formula_page_${page}`)
        .setTitle(`Formular Seite ${page + 1}/${totalPages}`);

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

async function handleFormulaPage(interaction) {
    const page = Number(interaction.customId.replace('formula_page_', ''));

    const data = await FormulaSystem.findOne({
        guildId: interaction.guild.id
    });

    if (!data || !data.questions || !data.questions.length) {
        return interaction.reply({
            content: '❌ Formular wurde nicht richtig eingerichtet.',
            flags: 64
        });
    }

    const questions = data.questions.slice(0, 15);
    const totalPages = Math.ceil(questions.length / 5);

    const cacheKey = `${interaction.guild.id}_${interaction.user.id}`;

    const oldData = formulaCache.get(cacheKey) || {
        answers: {}
    };

    const start = page * 5;
    const pageQuestions = questions.slice(start, start + 5);

    pageQuestions.forEach((question, index) => {
        const realIndex = start + index;
        const answer = interaction.fields.getTextInputValue(`answer_${realIndex}`);

        oldData.answers[realIndex] = answer;
    });

    formulaCache.set(cacheKey, oldData);

    const nextPage = page + 1;

    if (nextPage < totalPages) {
        const button = new ButtonBuilder()
            .setCustomId(`formula_next_${nextPage}`)
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

    return finishFormula(interaction, data, questions, oldData.answers);
}

async function finishFormula(interaction, data, questions, answers) {
    const channel = interaction.guild.channels.cache.get(data.logChannelId);

    if (!channel) {
        return interaction.reply({
            content: '❌ Antwort-Kanal wurde nicht gefunden.',
            flags: 64
        });
    }

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
        .setTitle(`📝 Neue Formular Antwort: ${data.title}`)
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
            {
                name: '📌 Status',
                value: '`Offen`',
                inline: true
            },
            ...fields
        )
        .setTimestamp();

    const accept = new ButtonBuilder()
        .setCustomId(`formula_accept_${interaction.user.id}`)
        .setLabel('Annehmen')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success);

    const deny = new ButtonBuilder()
        .setCustomId(`formula_deny_${interaction.user.id}`)
        .setLabel('Ablehnen')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger);

    await channel.send({
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(accept, deny)
        ]
    });

    formulaCache.delete(`${interaction.guild.id}_${interaction.user.id}`);

    return interaction.reply({
        content: '✅ Dein Formular wurde abgeschickt.',
        flags: 64
    });
}

function openFormulaDecisionModal(interaction, type) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: '❌ Dafür brauchst du Administrator Rechte.',
            flags: 64
        });
    }

    const userId = interaction.customId.split('_')[2];

    const modal = new ModalBuilder()
        .setCustomId(`formula_decision_${type}_${userId}`)
        .setTitle(type === 'accept' ? 'Formular annehmen' : 'Formular ablehnen');

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

async function handleFormulaDecision(interaction, type) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: '❌ Dafür brauchst du Administrator Rechte.',
            flags: 64
        });
    }

    const userId = interaction.customId.split('_')[3];
    const reason = interaction.fields.getTextInputValue('reason');

    const data = await FormulaSystem.findOne({
        guildId: interaction.guild.id
    });

    const user = await interaction.client.users.fetch(userId).catch(() => null);

    if (!user) {
        return interaction.reply({
            content: '❌ User wurde nicht gefunden.',
            flags: 64
        });
    }

    if (type === 'accept') {
        await user.send({
            embeds: [
                new EmbedBuilder()
                    .setColor('#00ff88')
                    .setTitle('✅ Formular angenommen')
                    .setDescription(`Dein Formular auf **${interaction.guild.name}** wurde angenommen.`)
                    .addFields(
                        {
                            name: '📝 Formular',
                            value: `\`${data?.title || 'Unbekannt'}\``
                        },
                        {
                            name: '📄 Grund',
                            value: `\`${reason}\``
                        }
                    )
                    .setTimestamp()
            ]
        }).catch(() => {});

        const embed = EmbedBuilder.from(interaction.message.embeds[0])
            .setColor('#00ff88')
            .spliceFields(2, 1, {
                name: '📌 Status',
                value: `✅ Angenommen von ${interaction.user}\nGrund: \`${reason}\``,
                inline: false
            })
            .setFooter({
                text: `Angenommen von ${interaction.user.tag}`
            });

        return interaction.update({
            embeds: [embed],
            components: []
        });
    }

    await user.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Formular abgelehnt')
                .setDescription(`Dein Formular auf **${interaction.guild.name}** wurde abgelehnt.`)
                .addFields(
                    {
                        name: '📝 Formular',
                        value: `\`${data?.title || 'Unbekannt'}\``
                    },
                    {
                        name: '📄 Grund',
                        value: `\`${reason}\``
                    }
                )
                .setTimestamp()
        ]
    }).catch(() => {});

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor('#ff0000')
        .spliceFields(2, 1, {
            name: '📌 Status',
            value: `❌ Abgelehnt von ${interaction.user}\nGrund: \`${reason}\``,
            inline: false
        })
        .setFooter({
            text: `Abgelehnt von ${interaction.user.tag}`
        });

    return interaction.update({
        embeds: [embed],
        components: []
    });
}