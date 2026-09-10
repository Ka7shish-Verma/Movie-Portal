const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const PDFDocument = require("pdfkit");

const Movie = require("./models/Movie");
const Booking = require("./models/Booking");

const app = express();

const PORT = 5000;

const TRANSACTION_TIME = 15 * 60 * 1000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));


// ================= MONGODB =================

mongoose
    .connect("mongodb://127.0.0.1:27017/movie_portal")
    .then(async () => {

        console.log("MongoDB Connected Successfully");

        await insertMovies();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    })
    .catch((error) => {
        console.log("MongoDB Connection Error:", error);
    });


// ================= SAMPLE MOVIES =================

async function insertMovies() {

    const count = await Movie.countDocuments();

    if (count > 0) {
        return;
    }

    await Movie.insertMany([
        {
            title: "Avengers: Endgame",
            genre: "Action",
            duration: "3h 2m",
            language: "English",
            rating: 8.4,
            year: 2019,
            poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
            description: "Earth's mightiest heroes come together for one final battle."
        },
        {
            title: "Inception",
            genre: "Sci-Fi",
            duration: "2h 28m",
            language: "English",
            rating: 8.8,
            year: 2010,
            poster: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
            description: "A skilled thief enters the dreams of others to steal secrets."
        },
        {
            title: "Interstellar",
            genre: "Sci-Fi",
            duration: "2h 49m",
            language: "English",
            rating: 8.7,
            year: 2014,
            poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            description: "A team of explorers travels through a wormhole in space."
        },
        {
            title: "Jawan",
            genre: "Action",
            duration: "2h 49m",
            language: "Hindi",
            rating: 7.1,
            year: 2023,
            poster: "https://image.tmdb.org/t/p/w500/jFt1gS4CVFQ8K6J5mH1l0nT0rK.jpg",
            description: "A man driven by a personal vendetta fights injustice."
        }
    ]);

    console.log("Sample Movies Added");
}


// ================= HOME PAGE =================

app.get("/", async (req, res) => {

    try {

        const movies = await Movie.find();

        res.render("index", {
            movies
        });

    } catch (error) {

        res.status(500).send("Unable to load movies");

    }

});


// ================= SEAT PAGE =================

app.get("/seats/:movieId", async (req, res) => {

    try {

        const movie = await Movie.findById(req.params.movieId);

        if (!movie) {
            return res.status(404).send("Movie not found");
        }

        const bookings = await Booking.find({
            movieId: movie._id,
            status: "BOOKED"
        });

        const bookedSeats = bookings.map(
            booking => booking.seatNumber
        );

        res.render("seats", {
            movie,
            bookedSeats
        });

    } catch (error) {

        console.log(error);

        res.status(500).send("Error loading seats");

    }

});


// ================= CHECK SEAT =================

app.get("/api/seat-status/:movieId/:seatNumber", async (req, res) => {

    try {

        const { movieId, seatNumber } = req.params;

        const booking = await Booking.findOne({
            movieId,
            seatNumber,
            status: "BOOKED"
        });

        res.json({
            booked: !!booking
        });

    } catch (error) {

        res.status(500).json({
            error: "Unable to check seat"
        });

    }

});


// ================= PAYMENT =================

app.post("/api/pay", async (req, res) => {

    try {

        const {
            movieId,
            movieTitle,
            showTime,
            seatNumber
        } = req.body;


        if (!movieId || !seatNumber || !showTime) {

            return res.status(400).json({
                success: false,
                message: "Please select a seat and show time."
            });

        }


        // Remove expired temporary transactions

        await Booking.deleteMany({
            status: "HELD",
            expiresAt: {
                $lt: new Date()
            }
        });


        // Check whether the seat is already permanently booked

        const existingBooking = await Booking.findOne({
            movieId,
            showTime,
            seatNumber,
            status: "BOOKED"
        });


        if (existingBooking) {

            return res.status(409).json({
                success: false,
                booked: true,
                message:
                    "Seat is already booked. Please select another seat."
            });

        }


        // Generate random code

        const randomCode =
            "MV" +
            Math.floor(
                100000 +
                Math.random() * 900000
            );


        /*
           Atomically create a temporary booking.

           If another user creates the same seat at
           the same time, MongoDB will detect the conflict.
        */

        const alreadyHeld = await Booking.findOne({
            movieId,
            showTime,
            seatNumber,
            status: "HELD",
            expiresAt: {
                $gt: new Date()
            }
        });


        if (alreadyHeld) {

            return res.status(409).json({
                success: false,
                booked: true,
                message:
                    "Seat is already booked. Please select another seat."
            });

        }


        const booking = await Booking.create({

            movieId,
            movieTitle,
            showTime,
            seatNumber,

            code: randomCode,

            status: "HELD",

            expiresAt:
                new Date(
                    Date.now() + TRANSACTION_TIME
                )

        });


        // Successful transaction

        booking.status = "BOOKED";
        booking.expiresAt = null;

        await booking.save();


        res.json({

            success: true,

            message:
                "Transaction completed successfully.",

            code: randomCode,

            movieTitle,

            showTime,

            seatNumber

        });


    } catch (error) {

        console.log(error);

        /*
          If two users try to book the same seat
          simultaneously, reject the second request.
        */

        if (error.code === 11000) {

            return res.status(409).json({

                success: false,

                booked: true,

                message:
                    "Seat is already booked. Please select another seat."

            });

        }


        res.status(500).json({

            success: false,

            message:
                "Transaction failed. Please try again."

        });

    }

});


// ================= CANCEL TRANSACTION =================

app.post("/api/cancel", async (req, res) => {

    try {

        const {
            movieId,
            showTime,
            seatNumber
        } = req.body;


        await Booking.deleteMany({

            movieId,

            showTime,

            seatNumber,

            status: "HELD"

        });


        res.json({

            success: true,

            message:
                "Transaction cancelled. Seat is available again."

        });


    } catch (error) {

        res.status(500).json({

            success: false,

            message:
                "Unable to cancel transaction."

        });

    }

});


// ================= PDF RECEIPT =================

app.get("/receipt/:code", async (req, res) => {

    try {

        const booking = await Booking.findOne({

            code: req.params.code,

            status: "BOOKED"

        });


        if (!booking) {

            return res.status(404).send(
                "Receipt not found"
            );

        }


        const doc = new PDFDocument({

            size: "A4",

            margin: 50

        });


        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=MovieTicket-${booking.code}.pdf`
        );


        doc.pipe(res);


        doc
            .fontSize(26)
            .text("CINEVERSE", {
                align: "center"
            });


        doc
            .moveDown()
            .fontSize(18)
            .text("Movie Counter Receipt", {
                align: "center"
            });


        doc.moveDown(2);


        doc
            .fontSize(14)
            .text(
                `Movie: ${booking.movieTitle}`
            );


        doc
            .moveDown()
            .text(
                `Show Time: ${booking.showTime}`
            );


        doc
            .moveDown()
            .text(
                `Seat Number: ${booking.seatNumber}`
            );


        doc
            .moveDown()
            .text(
                `Booking Code: ${booking.code}`
            );


        doc
            .moveDown(2)
            .fontSize(16)
            .text(
                "Show this receipt at the counter to pay and get the ticket.",
                {
                    align: "center"
                }
            );


        doc
            .moveDown(3)
            .fontSize(12)
            .text(
                "Thank you for choosing CineVerse!",
                {
                    align: "center"
                }
            );


        doc.end();


    } catch (error) {

        console.log(error);

        res.status(500).send(
            "Unable to generate receipt"
        );

    }

});