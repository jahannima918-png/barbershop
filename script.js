const form = document.getElementById("bookingForm");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");
const message = document.getElementById("message");

const calendar = document.getElementById("persianCalendar");

const months = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند"
];

const weekdays = [
  "شنبه", "یکشنبه", "دوشنبه",
  "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"
];

const services = {
  hair: 30,
  beard: 30,
  both: 60
};

const today = new Date();

let selectedYear = today.getFullYear();
let selectedMonth = today.getMonth();

const selectedDate = new Date(
  selectedYear,
  selectedMonth,
  today.getDate()
);

let selectedPersianDate = null;

// تبدیل تاریخ میلادی به شمسی
function toJalali(gy, gm, gd) {
  const gdm = [
    0,31,59,90,120,151,181,
    212,243,273,304,334
  ];

  let gy2 = gm > 2 ? gy + 1 : gy;

  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd + gdm[gm - 1];

  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;

  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm, jd;

  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + days % 31;
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + (days - 186) % 30;
  }

  return [jy, jm, jd];
}

// تبدیل تاریخ شمسی به میلادی
function toGregorian(jy, jm, jd) {
  jy += 1595;

  let days =
    -355668 +
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4);

  days += jm < 7
    ? (jm - 1) * 31
    : 186 + (jm - 7) * 30;

  days += jd - 1;

  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;

  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;

    if (days >= 365) days++;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let gd = days + 1;
  const leap =
    gy % 4 === 0 &&
    (gy % 100 !== 0 || gy % 400 === 0);

  const monthDays = [
    0,31,leap ? 29 : 28,31,30,31,
    30,31,31,30,31,30,31
  ];

  let gm = 1;

  while (gm <= 12 && gd > monthDays[gm]) {
    gd -= monthDays[gm];
    gm++;
  }

  return new Date(gy, gm - 1, gd);
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function renderCalendar() {
  const firstDay = new Date(
    selectedYear, selectedMonth, 1
  );

  const lastDay = new Date(
    selectedYear, selectedMonth + 1, 0
  );

  const firstWeekday = (firstDay.getDay() + 1) % 7;

  const currentJalali = toJalali(
    selectedYear,
    selectedMonth + 1,
    1
  );

  const jy = currentJalali[0];
  const jm = currentJalali[1];

  const jalaliMonthLength = jm <= 6 ? 31 : jm <= 11 ? 30 : 29;

  let html = `
    <div class="calendar-header">
      <button type="button" id="prevMonth">ماه قبل</button>
      <strong>${months[jm - 1]} ${jy}</strong>
      <button type="button" id="nextMonth">ماه بعد</button>
    </div>
    <div class="calendar-grid">
  `;

  weekdays.forEach(day => {
    html += `<div class="day-name">${day}</div>`;
  });

  for (let i = 0; i < firstWeekday; i++) {
    html += `<div></div>`;
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(selectedYear, selectedMonth, day);
    const weekday = date.getDay();

    const isFriday = weekday === 5;
    const isPast = dateKey(date) < dateKey(today);

    const jDate = toJalali(
      selectedYear,
      selectedMonth + 1,
      day
    );

    const disabled = isFriday || isPast;

    const isSelected =
      selectedPersianDate === dateKey(date);

    html += `
      <div class="day ${disabled ? "disabled" : ""} ${isFriday ? "friday" : ""} ${isSelected ? "selected" : ""}"
        data-date="${dateKey(date)}">
        ${jDate[2]}
      </div>
    `;
  }

  html += `</div>`;

  calendar.innerHTML = html;

  document.getElementById("prevMonth").onclick = () => {
    selectedMonth--;

    if (selectedMonth < 0) {
      selectedMonth = 11;
      selectedYear--;
    }

    renderCalendar();
  };

  document.getElementById("nextMonth").onclick = () => {
    selectedMonth++;

    if (selectedMonth > 11) {
      selectedMonth = 0;
      selectedYear++;
    }

    renderCalendar();
  };

  calendar.querySelectorAll(".day:not(.disabled)").forEach(el => {
    el.onclick = () => {
      selectedPersianDate = el.dataset.date;
      dateInput.value = selectedPersianDate;

      const [gy, gm, gd] = selectedPersianDate
        .split("-").map(Number);

      const jalali = toJalali(gy, gm, gd);

      document.querySelectorAll(".day").forEach(d =>
        d.classList.remove("selected")
      );

      el.classList.add("selected");

      loadTimes(new Date(gy, gm - 1, gd));
    };
  });
}

function loadTimes(date) {
  timeSelect.innerHTML = '<option value="">انتخاب ساعت</option>';

  for (let hour = 10; hour < 22; hour++) {
    for (let minute of [0, 30]) {
      const start = new Date(date);
      start.setHours(hour, minute, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);

      const label =
        String(hour).padStart(2, "0") + ":" +
        String(minute).padStart(2, "0");

      const option = document.createElement("option");
      option.value = label;
      option.textContent = label;

      timeSelect.appendChild(option);
    }
  }
}

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const service = document.getElementById("service").value;
  const date = dateInput.value;
  const time = timeSelect.value;

  if (!date || !time || !service) {
    message.textContent = "لطفاً تاریخ، ساعت و خدمت را انتخاب کنید.";
    return;
  }

  if (!/^09\d{9}$/.test(phone)) {
    message.textContent = "شماره موبایل معتبر وارد کنید.";
    return;
  }

  const bookings = JSON.parse(
    localStorage.getItem("barberBookings") || "[]"
  );

  const duration = services[service];

  const [gy, gm, gd] = date.split("-").map(Number);

  const start = new Date(gy, gm - 1, gd);
  const [hour, minute] = time.split(":").map(Number);

  start.setHours(hour, minute, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + duration);

  const conflict = bookings.some(booking => {
    if (booking.date !== date) return false;

    const [bh, bm] = booking.time.split(":").map(Number);
    const bookingStart = new Date(start);
    bookingStart.setHours(bh, bm, 0, 0);

    const bookingEnd = new Date(bookingStart);
    bookingEnd.setMinutes(
      bookingEnd.getMinutes() + booking.duration
    );

    return start < bookingEnd && end > bookingStart;
  });

  if (conflict) {
    message.textContent = "این ساعت قبلاً رزرو شده است.";
    return;
  }

  bookings.push({
    name,
    phone,
    service,
    date,
    time,
    duration
  });

  localStorage.setItem(
    "barberBookings",
    JSON.stringify(bookings)
  );

  message.textContent = "درخواست نوبت با موفقیت ثبت شد ✨";

  form.reset();
  dateInput.value = "";
  selectedPersianDate = null;
  timeSelect.innerHTML = '<option value="">ابتدا تاریخ را انتخاب کنید</option>';

  renderCalendar();
});

renderCalendar();
