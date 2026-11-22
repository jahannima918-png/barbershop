const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const serviceInput = document.getElementById("service");
const form = document.getElementById("bookingForm");
const message = document.getElementById("message");

const STORAGE_KEY = "barbershop_bookings";

const services = {
    "کوتاهی مو": 30,
    "اصلاح ریش": 30,
    "مو و ریش": 60,
    "فید": 30
};

function getBookings() {
    return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
    );
}

function saveBookings(bookings) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(bookings)
    );
}

function pad(number) {
    return String(number).padStart(2, "0");
}

function getDateKey(date) {
    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join("-");
}

// جلوگیری از انتخاب تاریخ گذشته
const today = new Date();

dateInput.min = getDateKey(today);

// ساخت ساعت‌های خالی
function updateTimes() {

    timeInput.innerHTML =
        '<option value="">انتخاب ساعت</option>';

    const selectedDate = dateInput.value;

    if (!selectedDate) return;

    const date = new Date(selectedDate + "T12:00:00");

    // جمعه تعطیل است
    if (date.getDay() === 5) {
        message.textContent = "جمعه‌ها آرایشگاه تعطیل است.";
        return;
    }

    const duration = services[serviceInput.value] || 30;

    const bookings = getBookings();

    for (let minutes = 600; minutes + duration <= 1320; minutes += 30) {

        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;

        const time =
            pad(hour) + ":" + pad(minute);

        const now = new Date();

        const isPast =
            selectedDate === getDateKey(now) &&
            minutes <= now.getHours() * 60 + now.getMinutes();

        const isBooked = bookings.some(booking => {

            if (booking.date !== selectedDate) return false;

            const bookedStart =
                Number(booking.start);

            const bookedEnd =
                bookedStart + Number(booking.duration);

            return minutes < bookedEnd &&
                   minutes + duration > bookedStart;
        });

        if (!isPast && !isBooked) {

            const option = document.createElement("option");

            option.value = time;
            option.textContent = time;

            timeInput.appendChild(option);
        }
    }
}

dateInput.addEventListener("change", updateTimes);
serviceInput.addEventListener("change", updateTimes);

// ثبت نوبت
form.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const service = serviceInput.value;
    const date = dateInput.value;
    const time = timeInput.value;

    if (!name || !phone || !service || !date || !time) {
        message.textContent = "لطفاً تمام اطلاعات را وارد کنید.";
        return;
    }

    if (!/^09\d{9}$/.test(phone)) {
        message.textContent = "شماره موبایل معتبر نیست.";
        return;
    }

    const selectedDate = new Date(date + "T12:00:00");

    if (selectedDate.getDay() === 5 || date < getDateKey(new Date())) {
        message.textContent = "تاریخ انتخابی معتبر نیست.";
        return;
    }

    const duration = services[service];

    const [hour, minute] = time.split(":").map(Number);

    const start = hour * 60 + minute;

    const bookings = getBookings();

    const conflict = bookings.some(booking => {

        if (booking.date !== date) return false;

        const oldStart = Number(booking.start);
        const oldEnd = oldStart + Number(booking.duration);

        return start < oldEnd &&
               start + duration > oldStart;
    });

    if (conflict) {
        message.textContent = "این ساعت قبلاً رزرو شده است.";
        updateTimes();
        return;
    }

    const booking = {
        id: Date.now(),
        name,
        phone,
        service,
        date,
        time,
        start,
        duration
    };

    bookings.push(booking);

    saveBookings(bookings);

    message.textContent =
        "نوبت شما با موفقیت ثبت شد.";

    form.reset();

    timeInput.innerHTML =
        '<option value="">انتخاب ساعت</option>';
});
