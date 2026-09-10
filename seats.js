const seatContainer =
    document.getElementById("seatContainer");

const selectedSeatElement =
    document.getElementById("selectedSeat");

const payButton =
    document.getElementById("payButton");

const timerElement =
    document.getElementById("timer");

const messageElement =
    document.getElementById("message");

const showTime =
    document.getElementById("showTime");


let selectedSeat = null;

let timeLeft = 15 * 60;

let timer;


// ================= CREATE SEATS =================

const rows = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F"
];

const seatsPerRow = 10;


rows.forEach(row => {

    const rowDiv =
        document.createElement("div");

    rowDiv.className = "seat-row";


    const rowLabel =
        document.createElement("span");

    rowLabel.className =
        "row-label";

    rowLabel.innerText = row;


    rowDiv.appendChild(rowLabel);


    for (
        let number = 1;
        number <= seatsPerRow;
        number++
    ) {

        const seatNumber =
            row + number;


        const seat =
            document.createElement("button");


        seat.className =
            "seat";


        seat.innerText =
            number;


        seat.dataset.seat =
            seatNumber;


        if (
            bookedSeats.includes(seatNumber)
        ) {

            seat.classList.add("booked");

            seat.disabled = true;

        }


        seat.addEventListener(
            "click",
            () => selectSeat(
                seat,
                seatNumber
            )
        );


        rowDiv.appendChild(seat);

    }


    seatContainer.appendChild(rowDiv);

});


// ================= SELECT SEAT =================

function selectSeat(
    seat,
    seatNumber
) {

    if (
        seat.classList.contains("booked")
    ) {
        return;
    }


    document
        .querySelectorAll(".seat.selected")
        .forEach(s =>
            s.classList.remove("selected")
        );


    selectedSeat = seatNumber;


    seat.classList.add("selected");


    selectedSeatElement.innerText =
        seatNumber;


    payButton.disabled = false;

}


// ================= TIMER =================

function startTimer() {

    timer =
        setInterval(() => {

            timeLeft--;


            const minutes =
                Math.floor(
                    timeLeft / 60
                );

            const seconds =
                timeLeft % 60;


            timerElement.innerText =
                `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


            if (timeLeft <= 0) {

                clearInterval(timer);

                transactionTimeout();

            }

        }, 1000);

}


startTimer();


// ================= TIMEOUT =================

async function transactionTimeout() {

    payButton.disabled = true;


    messageElement.innerHTML = `
        <div class="alert alert-warning">
            ⏰ Transaction time expired.
            Please select your seat again.
        </div>
    `;


    if (selectedSeat) {

        await fetch("/api/cancel", {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                movieId,

                showTime:
                    showTime.value,

                seatNumber:
                    selectedSeat

            })

        });

    }


    setTimeout(() => {

        window.location.reload();

    }, 3000);

}


// ================= PAYMENT =================

payButton.addEventListener(
    "click",
    async () => {

        if (!selectedSeat) {

            alert(
                "Please select a seat first."
            );

            return;

        }


        payButton.disabled = true;

        payButton.innerText =
            "Processing...";


        try {

            const response =
                await fetch(
                    "/api/pay",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            movieId,

                            movieTitle,

                            showTime:
                                showTime.value,

                            seatNumber:
                                selectedSeat

                        })

                    }
                );


            const data =
                await response.json();


            // ================= SUCCESS =================

            if (response.ok && data.success) {

                clearInterval(timer);


                messageElement.innerHTML = `

                    <div class="success-box">

                        <h4>
                            🎉 Transaction Complete
                        </h4>

                        <p>
                            Your seat
                            <strong>
                                ${data.seatNumber}
                            </strong>
                            is successfully booked.
                        </p>

                        <p>
                            Booking Code:
                        </p>

                        <div class="booking-code">
                            ${data.code}
                        </div>

                        <p class="mt-3">
                            Show this receipt at the
                            counter to pay and get the ticket.
                        </p>

                        <a
                            href="/receipt/${data.code}"
                            class="btn btn-success">

                            📄 Download PDF Receipt

                        </a>

                        <a
                            href="/"
                            class="btn btn-outline-light mt-2">

                            Back to Movies

                        </a>

                    </div>

                `;


                document
                    .querySelectorAll(".seat")
                    .forEach(seat => {

                        seat.disabled = true;

                    });


                return;

            }


            // ================= SEAT ALREADY BOOKED =================

            if (
                response.status === 409
            ) {

                messageElement.innerHTML = `

                    <div class="alert alert-danger">

                        ❌ ${data.message}

                    </div>

                `;


                payButton.innerText =
                    "Pay at Counter";


                setTimeout(() => {

                    window.location.href =
                        `/seats/${movieId}`;

                }, 3000);


                return;

            }


            throw new Error(
                data.message ||
                "Transaction failed"
            );


        } catch (error) {

            console.log(error);


            messageElement.innerHTML = `

                <div class="alert alert-danger">

                    ❌ Transaction failed.
                    Please try again.

                </div>

            `;


            payButton.disabled = false;

            payButton.innerText =
                "💳 Pay at Counter";

        }

    }
);