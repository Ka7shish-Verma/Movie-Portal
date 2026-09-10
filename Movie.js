const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    genre: String,
    duration: String,
    language: String,
    rating: Number,
    year: Number,
    poster: String,
    description: String
});

module.exports = mongoose.model("Movie", movieSchema);