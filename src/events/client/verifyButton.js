const {
    Events,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');

const VerifySystem =
    require('../../models/VerifySystem');

const captchaCache =
    new Map();

module.exports = {

    name: Events.InteractionCreate,

    async execute(interaction) {

        try {

            //
            // ================= BUTTON =================
            //

            if (interaction.isButton()) {

                if (
                    interaction.customId !==
                    'verify_button'
                ) return;

                //
                // DATA
                //

                const data =
                    await VerifySystem.findOne({

                        guildId:
                            interaction.guild.id
                    });

                if (!data) {

                    return interaction.reply({

                        content:
                            '❌ Verify System nicht gefunden.',

                        flags: 64
                    });
                }

                //
                // MEMBER
                //

                const member =
                    interaction.member;

                //
                // BEREITS VERIFIZIERT?
                //

                if (data.verifyRole) {

                    const role =
                        interaction.guild.roles.cache.get(
                            data.verifyRole
                        );

                    if (
                        role &&
                        member.roles.cache.has(
                            role.id
                        )
                    ) {

                        return interaction.reply({

                            embeds: [

                                new EmbedBuilder()

                                    .setColor(
                                        '#ffaa00'
                                    )

                                    .setTitle(
                                        '⚠️ Bereits verifiziert'
                                    )

                                    .setDescription(
                                        'Du bist bereits verifiziert.'
                                    )

                                    .setTimestamp()
                            ],

                            flags: 64
                        });
                    }
                }

                //
                // CAPTCHA AUS
                //

                if (
                    !data.captchaEnabled
                ) {

                    await verifyMember(

                        interaction,
                        data
                    );

                    return;
                }

                //
                // CAPTCHA
                //

                const code =
                    generateCaptcha();

                captchaCache.set(

                    interaction.user.id,

                    {

                        code,

                        guildId:
                            interaction.guild.id,

                        expires:
                            Date.now() +
                            5 *
                            60 *
                            1000
                    }
                );

                //
                // MODAL
                //

                const modal =
                    new ModalBuilder()

                        .setCustomId(
                            'verify_captcha_modal'
                        )

                        .setTitle(
                            'Captcha Verifizierung'
                        );

                const input =
                    new TextInputBuilder()

                        .setCustomId(
                            'captcha_code'
                        )

                        .setLabel(
                            `Code: ${code}`
                        )

                        .setStyle(
                            TextInputStyle.Short
                        )

                        .setRequired(true)

                        .setPlaceholder(
                            'Captcha eingeben'
                        );

                const row =
                    new ActionRowBuilder()
                        .addComponents(input);

                modal.addComponents(row);

                return interaction.showModal(
                    modal
                );
            }

            //
            // ================= MODAL =================
            //

            if (
                interaction.isModalSubmit()
            ) {

                if (
                    interaction.customId !==
                    'verify_captcha_modal'
                ) return;

                //
                // CACHE
                //

                const cache =
                    captchaCache.get(
                        interaction.user.id
                    );

                if (!cache) {

                    return interaction.reply({

                        content:
                            '❌ Captcha abgelaufen.',

                        flags: 64
                    });
                }

                //
                // EXPIRE
                //

                if (
                    cache.expires <
                    Date.now()
                ) {

                    captchaCache.delete(
                        interaction.user.id
                    );

                    return interaction.reply({

                        content:
                            '❌ Captcha abgelaufen.',

                        flags: 64
                    });
                }

                //
                // INPUT
                //

                const input =
                    interaction.fields.getTextInputValue(
                        'captcha_code'
                    );

                //
                // FALSCH
                //

                if (
                    input !== cache.code
                ) {

                    return interaction.reply({

                        content:
                            '❌ Falscher Captcha Code.',

                        flags: 64
                    });
                }

                //
                // DATA
                //

                const data =
                    await VerifySystem.findOne({

                        guildId:
                            cache.guildId
                    });

                if (!data) {

                    return interaction.reply({

                        content:
                            '❌ Verify System nicht gefunden.',

                        flags: 64
                    });
                }

                //
                // DELETE CAPTCHA
                //

                captchaCache.delete(
                    interaction.user.id
                );

                //
                // VERIFY
                //

                await verifyMember(

                    interaction,
                    data
                );
            }

        } catch (err) {

            console.error(err);

            if (
                !interaction.replied &&
                !interaction.deferred
            ) {

                interaction.reply({

                    content:
                        '❌ Fehler bei der Verifizierung.',

                    flags: 64
                });
            }
        }
    }
};

//
// ================= VERIFY FUNCTION =================
//

async function verifyMember(

    interaction,
    data

) {

    const member =
        interaction.member;

    //
    // VERIFY ROLE
    //

    if (data.verifyRole) {

        const role =
            interaction.guild.roles.cache.get(
                data.verifyRole
            );

        if (role) {

            await member.roles.add(
                role
            );
        }
    }

    //
    // REMOVE ROLE
    //

    if (data.removeRole) {

        const role =
            interaction.guild.roles.cache.get(
                data.removeRole
            );

        if (
            role &&
            member.roles.cache.has(
                role.id
            )
        ) {

            await member.roles.remove(
                role
            );
        }
    }

    //
    // SUCCESS
    //

    const embed =
        new EmbedBuilder()

            .setColor('#00ff88')

            .setTitle(
                '✅ Verifiziert'
            )

            .setDescription(
                'Du wurdest erfolgreich verifiziert.'
            )

            .setTimestamp();

    await interaction.reply({

        embeds: [embed],

        flags: 64
    });
}

//
// ================= CAPTCHA =================
//

function generateCaptcha() {

    const chars =
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    let code = '';

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        code += chars.charAt(

            Math.floor(
                Math.random() *
                chars.length
            )
        );
    }

    return code;
}