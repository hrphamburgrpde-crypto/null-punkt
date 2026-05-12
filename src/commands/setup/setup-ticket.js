const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    StringSelectMenuBuilder,
    ActionRowBuilder
} = require('discord.js');

const TicketSystem = require('../../models/TicketSystem');

const command = new SlashCommandBuilder()
    .setName('setup-ticket')
    .setDescription('Erstellt ein Ticket System')
    .addChannelOption(option =>
        option
            .setName('kanal')
            .setDescription('Kanal für das Ticket Panel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
    )
    .addChannelOption(option =>
        option
            .setName('ticket_kategorie')
            .setDescription('Kategorie, wo Tickets erstellt werden')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
    );

for (let i = 1; i <= 7; i++) {
    command
        .addStringOption(option =>
            option
                .setName(`kategorie${i}`)
                .setDescription(`Ticket Kategorie ${i}`)
                .setRequired(i === 1)
        )
        .addRoleOption(option =>
            option
                .setName(`admin_rolle${i}`)
                .setDescription(`Support/Admin Rolle für Kategorie ${i}`)
                .setRequired(i === 1)
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

        const panelChannel = interaction.options.getChannel('kanal');
        const ticketCategory = interaction.options.getChannel('ticket_kategorie');

        const categories = [];

        for (let i = 1; i <= 7; i++) {
            const name = interaction.options.getString(`kategorie${i}`);
            const role = interaction.options.getRole(`admin_rolle${i}`);

            if (name && role) {
                categories.push({
                    id: `category_${i}`,
                    name,
                    roleId: role.id
                });
            }
        }

        if (!categories.length) {
            return interaction.editReply({
                content: '❌ Du musst mindestens eine Kategorie und eine Admin Rolle angeben.'
            });
        }

        await TicketSystem.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                channelId: panelChannel.id,
                ticketCategoryId: ticketCategory.id,
                categories
            },
            {
                upsert: true,
                returnDocument: 'after'
            }
        );

        const menu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('Wähle eine Ticket Kategorie aus')
            .addOptions(
                categories.map(cat => ({
                    label: cat.name,
                    value: cat.id,
                    emoji: '🎫'
                }))
            );

        const embed = new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle('🎫 Ticket System')
            .setDescription(
                [
                    'Willkommen beim Support-System.',
                    '',
                    'Wähle unten im Menü eine passende Kategorie aus, um ein Ticket zu öffnen.',
                    '',
                    `📂 Kategorien: \`${categories.length}\``,
                    '👥 Ein Support-Teammitglied wird sich danach um dein Anliegen kümmern.',
                    '',
                    '⚠️ Bitte öffne nur ein Ticket, wenn du wirklich Hilfe brauchst.',
                    '⏳ Du kannst nicht mehrere Tickets gleichzeitig offen haben.'
                ].join('\n')
            )
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({
                text: `${interaction.guild.name} • Ticket Support`
            })
            .setTimestamp();

        await panelChannel.send({
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(menu)
            ]
        });

        await interaction.editReply({
            content: `✅ Ticket Panel wurde in ${panelChannel} erstellt.`
        });
    }
};