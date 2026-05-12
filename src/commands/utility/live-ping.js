const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const activePanels = new Map();

let toggle = false;

module.exports = {

    data: new SlashCommandBuilder()
        .setName('live-ping')
        .setDescription('Animated Hosting Control Panel'),

    async execute(interaction, client) {

        const guildId = interaction.guild.id;

        if (activePanels.has(guildId)) {
            return interaction.reply({
                content: '❌ Panel läuft bereits.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({
            content: '📡 Live Panel gestartet...',
            flags: MessageFlags.Ephemeral
        });

        let msg = await interaction.channel.send({
            embeds: [createEmbed(client)]
        });

        const interval = setInterval(async () => {

            try {

                await msg.edit({
                    embeds: [createEmbed(client)]
                });

            } catch (err) {

                console.error('❌ Live Panel Error:', err);

                clearInterval(interval);
                activePanels.delete(guildId);
            }

        }, 5000);

        activePanels.set(guildId, { interval });
    }
};

//
// ================= EMBED =================
//

function createEmbed(client) {

    const ping = Math.round(client.ws.ping);

    const uptimeSec = Math.floor(process.uptime());
    const uptime =
        `${Math.floor(uptimeSec / 60)}m ${uptimeSec % 60}s`;

    const memory =
        (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

    const heap =
        (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    const score = calculateScore(ping, memory);

    const status = getAnimatedStatus(score);

    const statusDisplay = `${status.text} (${score}%)`;

    const bar = createBar(score);

    return new EmbedBuilder()
        .setColor(status.color)
        .setTitle('🖥️ LIVE HOSTING CONTROL PANEL')
        .setDescription('```yaml\nSYSTEM MONITORING ACTIVE\n```')

        .addFields(
            {
                name: '⚡ STATUS',
                value:
                    `\`${statusDisplay}\`\n` +
                    `\`${status.pulse}\`\n` +
                    `${bar}`,
                inline: false
            },
            {
                name: '📡 Ping',
                value: `\`${ping}ms\``,
                inline: true
            },
            {
                name: '🧠 RAM',
                value: `\`${memory} MB\``,
                inline: true
            },
            {
                name: '⚙️ Heap',
                value: `\`${heap} MB\``,
                inline: true
            },
            {
                name: '⏱️ Uptime',
                value: `\`${uptime}\``,
                inline: false
            }
        )
        .setFooter({
            text: `${client.user.username} • Animated Live System`
        })
        .setTimestamp();
}

//
// ================= ANIMATED STATUS =================
//

function getAnimatedStatus(score) {

    toggle = !toggle;

    if (score >= 80) {
        return {
            text: toggle ? '🟢 ONLINE' : '🟢 STABLE',
            pulse: toggle ? '▰▰▰▰▰▰▰▰▰▰' : '▰▱▰▱▰▱▰▱▰▱',
            color: 0x00ff00
        };
    }

    if (score >= 50) {
        return {
            text: toggle ? '🟡 DEGRADED' : '🟡 WARNING',
            pulse: toggle ? '▰▰▰▰▰▰▱▱▱▱' : '▰▰▱▱▰▰▱▱▰▱',
            color: 0xffff00
        };
    }

    return {
        text: toggle ? '🔴 CRITICAL' : '🔴 OFFLINE',
        pulse: toggle ? '▰▰▱▱▱▱▱▱▱▱' : '▰▱▱▱▱▱▱▱▱▱',
        color: 0xff0000
    };
}

//
// ================= SCORE =================
//

function calculateScore(ping, mem) {

    let score = 100;

    if (ping > 100) score -= (ping - 100) * 0.25;
    if (ping > 200) score -= 20;

    if (mem > 300) score -= (mem - 300) * 0.08;

    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return Math.round(score);
}

//
// ================= BATTERY BAR =================
//

function createBar(score) {

    const total = 10;
    const filled = Math.round((score / 100) * total);

    const bar =
        '█'.repeat(filled) +
        '░'.repeat(total - filled);

    return `\`${bar}\``;
}