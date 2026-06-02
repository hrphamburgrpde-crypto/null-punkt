const {
    SlashCommandBuilder,
    ChannelType
} = require('discord.js');

const BotBan = require('../../models/BotBan');
const BotBanPanel = require('../../models/BotBanPanel');
const {
    createBotBanEmbed,
    updateBotBanPanels
} = require('../../utils/botBanList');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-sperre')
        .setDescription('Bot Owner: Sperrt einen User vom Bot')
        .addStringOption(option =>
            option
                .setName('userid')
                .setDescription('User ID')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option
                .setName('listen_kanal')
                .setDescription('Kanal für die Sperrliste')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),

    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: '❌ Nur der Bot Owner darf diesen Command benutzen.',
                flags: 64
            });
        }

        const userId = interaction.options.getString('userid');
        const channel = interaction.options.getChannel('listen_kanal');

        const user = await interaction.client.users.fetch(userId).catch(() => null);

        if (!user) {
            return interaction.reply({
                content: '❌ User wurde nicht gefunden. Prüfe die UserID.',
                flags: 64
            });
        }

        if (user.id === process.env.OWNER_ID) {
            return interaction.reply({
                content: '❌ Du kannst dich nicht selbst sperren.',
                flags: 64
            });
        }

        await BotBan.findOneAndUpdate(
            { userId: user.id },
            {
                userId: user.id,
                username: user.tag,
                bannedBy: interaction.user.id,
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );

        const existingPanel = await BotBanPanel.findOne({
            guildId: interaction.guild.id
        });

        if (!existingPanel) {
            const embed = await createBotBanEmbed(interaction.client);

            const msg = await channel.send({
                embeds: [embed]
            });

            await BotBanPanel.create({
                guildId: interaction.guild.id,
                channelId: channel.id,
                messageId: msg.id
            });
        } else {
            existingPanel.channelId = channel.id;
            await existingPanel.save();
        }

        await updateBotBanPanels(interaction.client);

        await user.send({
            content:
                `🚫 Du wurdest vom Bot **Null Punkt** gesperrt.\n` +
                `Du kannst ab jetzt keine Commands mehr benutzen.`
        }).catch(() => {});

        return interaction.reply({
            content: `✅ ${user.tag} wurde vom Bot gesperrt.`,
            flags: 64
        });
    }
};