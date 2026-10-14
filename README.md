# 🎬 MoviePortal - Movie Booking System

MoviePortal is a full-stack movie booking web application developed using Node.js, Express.js, MongoDB, EJS, JavaScript, CSS and Bootstrap.

The application allows users to view movies, select seats, choose show timings and book seats. It also handles a 15-minute transaction window and generates a random booking code and PDF receipt after successful booking.

---

## 📌 Project Overview

The main purpose of this project is to provide a simple and attractive movie booking system where users can:

- View available movies
- View movie details
- Select a show time
- Select available seats
- See already booked seats
- Book a selected seat
- Get a random booking code
- Generate a PDF receipt
- Pay at the counter using the generated code/receipt

The system also prevents two users from permanently booking the same seat.

---

## ✨ Features

### 🎥 Movie Listing
- Displays available movies
- Movie posters
- Movie name
- Genre
- Duration
- Language
- Rating
- Release year

### 💺 Seat Selection
- Interactive seat layout
- Available seats
- Selected seats
- Already booked seats
- Prevents selection of booked seats

### ⏱️ 15-Minute Transaction Window
- A 15-minute countdown timer is displayed.
- If the transaction time expires, the transaction is cancelled.
- The user can select another seat again.

### 🔐 Duplicate Booking Protection
The system checks the database before completing a booking.

If another user has already booked the same seat, the user receives:

> Seat is already booked. Please select another seat.

### 💳 Pay at Counter
A single **Pay at Counter** button is provided.

After successful booking:
- A random booking code is generated.
- The selected seat is permanently booked.
- A receipt can be generated as a PDF.

### 📄 PDF Receipt
The PDF receipt contains:

- Movie name
- Show time
- Seat number
- Random booking code

The receipt displays:

> Show this receipt at the counter to pay and get the ticket.

---

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| HTML | Page structure |
| EJS | Dynamic webpage rendering |
| CSS | Website styling |
| JavaScript | Seat selection and timer |
| Bootstrap | Responsive design |
| Node.js | Backend runtime |
| Express.js | Server and API |
| MongoDB | Database |
| Mongoose | Database interaction |
| PDFKit | PDF receipt generation |

---

## 📂 Project Structure

```text
MoviePortal
│
├── server.js
├── package.json
│
├── models
│   ├── Movie.js
│   └── Booking.js
│
├── views
│   ├── index.ejs
│   └── seats.ejs
│
└── public
    ├── css
    │   └── style.css
    │
    └── js
        └── seats.js
