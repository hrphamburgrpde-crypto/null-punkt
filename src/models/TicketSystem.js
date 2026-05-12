const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    guildId: String,
    channelId: String,
    ticketCategoryId: String,
    categories: {
        type: Array,
        default: []
    }
});

module.exports =
    mongoose.models.TicketSystem ||
    mongoose.model('TicketSystem', schema);