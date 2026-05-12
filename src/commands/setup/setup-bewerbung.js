const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');

const ApplicationSystem = require('../../models/ApplicationSystem');

const command = new SlashCommandBuilder()
    .setName('setup-bewerbung')
    .setDescription('Erstellt ein Bewerbungssystem')
    .addChannelOption(option =>
        option
            .setName('panel_kanal')
            .setDescription('Kanal für das Bewerbungs-Panel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
    )
    .addChannelOption(option =>
        option
            .setName('bewerbungs_kanal')
            .setDescription('Kanal, wo Bewerbungen reingesendet werden')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
    );

for (let i = 1; i <= 15; i++) {
    command.addStringOption(option =>
        option
            .setName(`frage${i}`)
            .setDescription(`Frage ${i}`)
            .setRequired(i <= 2)
    );
}

for (let i = 1; i <= 3; i++) {
    command.addRoleOption(option =>
        option
            .setName(`rolle${i}`)
            .setDescription(`Rolle bei Annahme ${i}`)
            .setRequired(false)
    );
}

command.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

module.exports = {
    data: command,

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.editReply({
                content: '❌ Dafür brauchst du Administrator Rechte.'
            });
        }

        const panelChannel = interaction.options.getChannel('panel_kanal');
        const logChannel = interaction.options.getChannel('bewerbungs_kanal');

        const questions = [];

        for (let i = 1; i <= 15; i++) {
            const question = interaction.options.getString(`frage${i}`);

            if (question) {
                questions.push(question);
            }
        }

        const acceptRoles = [];

        for (let i = 1; i <= 3; i++) {
            const role = interaction.options.getRole(`rolle${i}`);

            if (role) {
                acceptRoles.push(role.id);
            }
        }

        await ApplicationSystem.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                panelChannelId: panelChannel.id,
                logChannelId: logChannel.id,
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
    .setTitle('📋 Bewerbungssystem')
    .setDescription(
        [
            'Willkommen beim Bewerbungssystem.',
            '',
            'Klicke auf den Button, um deine Bewerbung zu starten.',
            '',
            `📝 Fragen: \`${questions.length}\``,
            `📄 Seiten: \`${pages}\``,
            '',
            '⚠️ Du kannst nur eine offene Bewerbung gleichzeitig haben.',
            'Nach Annahme oder Ablehnung kannst du dich erneut bewerben.'
        ].join('\n')
    )
    .addFields(
        {
            name: '📨 Bewerbungs-Kanal',
            value: `${logChannel}`,
            inline: true
        },
        {
            name: '🎭 Rollen bei Annahme',
            value: acceptRoles.length
                ? acceptRoles.map(id => `<@&${id}>`).join('\n')
                : '`Keine`',
            inline: true
        }
    )

    .setThumbnail(interaction.guild.iconURL())
    .setTimestamp();
        const button = new ButtonBuilder()
            .setCustomId('application_open')
            .setLabel('Bewerben')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Primary);

        await panelChannel.send({
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(button)
            ]
        });

        await interaction.editReply({
            content: `✅ Bewerbungssystem wurde in ${panelChannel} erstellt.`
        });
    }
};