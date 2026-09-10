const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
        required: true
    },

    movieTitle: String,

    showTime: {
        type: String,
        required: true
    },

    seatNumber: {
        type: String,
        required: true
    },

    code: {
        type: String,
        unique: true
    },

    status: {
        type: String,
        enum: ["HELD", "BOOKED"],
        default: "HELD"
    },

    expiresAt: {
        type: Date
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Booking", bookingSchema);