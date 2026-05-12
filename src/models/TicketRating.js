const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    ticketId: String,
    userId: String,
    rating: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports =
    mongoose.models.TicketRating ||
    mongoose.model('TicketRating', schema);