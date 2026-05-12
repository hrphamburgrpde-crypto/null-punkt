const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');

const FormulaSystem = require('../../models/FormulaSystem');

const command = new SlashCommandBuilder()
    .setName('create-formula')
    .setDescription('Erstellt ein eigenes Formular')
    .addChannelOption(option =>
        option.setName('panel_kanal')
            .setDescription('Kanal für das Formular Panel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
    )
    .addChannelOption(option =>
        option.setName('antwort_kanal')
            .setDescription('Kanal für die Antworten')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('ueberschrift')
            .setDescription('Überschrift vom Embed')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('button_text')
            .setDescription('Text vom Button')
            .setRequired(true)
    )
    .addRoleOption(option =>
        option.setName('rolle1')
            .setDescription('Rolle bei Annahme 1')
            .setRequired(false)
    )
    .addRoleOption(option =>
        option.setName('rolle2')
            .setDescription('Rolle bei Annahme 2')
            .setRequired(false)
    );

for (let i = 1; i <= 15; i++) {
    command.addStringOption(option =>
        option.setName(`frage${i}`)
            .setDescription(`Frage ${i}`)
            .setRequired(false)
    );
}

command.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

module.exports = {
    data: command,

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const panelChannel = interaction.options.getChannel('panel_kanal');
        const logChannel = interaction.options.getChannel('antwort_kanal');
        const title = interaction.options.getString('ueberschrift');
        const buttonText = interaction.options.getString('button_text');

        const questions = [];

        for (let i = 1; i <= 15; i++) {
            const question = interaction.options.getString(`frage${i}`);
            if (question) questions.push(question);
        }

        if (!questions.length) {
            return interaction.editReply({
                content: '❌ Du musst mindestens eine Frage angeben.'
            });
        }

        const acceptRoles = [];

        const role1 = interaction.options.getRole('rolle1');
        const role2 = interaction.options.getRole('rolle2');

        if (role1) acceptRoles.push(role1.id);
        if (role2) acceptRoles.push(role2.id);

        await FormulaSystem.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                panelChannelId: panelChannel.id,
                logChannelId: logChannel.id,
                title,
                buttonText,
                questions,
                acceptRoles
            },
            {
                upsert: true,
                returnDocument: 'after'
            }
        );

        const pages = Math.ceil(questions.length / 5);

        const embed = new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle(title)
            .setDescription(
                [
                    'Klicke unten auf den Button, um das Formular auszufüllen.',
                    '',
                    `📝 Fragen: \`${questions.length}\``,
                    `📄 Seiten: \`${pages}\``,
                    '',
                    '⚠️ Du kannst nur eine aktive Antwort gleichzeitig haben.',
                    '📨 Du bekommst eine DM bei Annahme oder Ablehnung.'
                ].join('\n')
            )
            .setThumbnail(interaction.guild.iconURL())
            .setTimestamp();

        const button = new ButtonBuilder()
            .setCustomId('formula_open')
            .setLabel(buttonText.slice(0, 80))
            .setEmoji('📝')
            .setStyle(ButtonStyle.Primary);

        await panelChannel.send({
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(button)
            ]
        });

        return interaction.editReply({
            content: `✅ Formular wurde in ${panelChannel} erstellt.`
        });
    }
};