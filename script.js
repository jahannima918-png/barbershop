const form = document.getElementById("bookingForm");
const calendar = document.getElementById("persianCalendar");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");
const message = document.getElementById("message");

const months = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند"
];

const weekdays = [
  "ش", "ی", "د", "س", "چ", "پ", "ج"
];

const today = new Date();
const todayParts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
  year: "numeric",
  month: "numeric",
  day: "numeric"
}).formatToParts(today);

const currentYear = Number(todayParts.find(x => x.type === "year").value);
const currentMonth = Number(todayParts.find(x => x.type === "month").value);
const currentDay = Number(todayParts.find(x => x.type === "day").value);

let viewYear = currentYear;
let viewMonth = currentMonth;
let selectedDate = null;

function getPersianParts(date) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(date);

  return {
    year: Number(parts.find(x => x.type === "year").value),
    month: Number(parts.find(x => x.type === "month").value),
    day: Number(parts.find(x => x.type === "day").value)
  };
}

function getPersianDate(year, month, day) {
  // تبدیل تاریخ شمسی به میلادی با استفاده از تقویم فارسی مرورگر
  const target = `${year}/${month}/${day}`;

  let low = Date.UTC(year + 621, 2, 19);
  let high = Date.UTC(year + 622, 2, 22);

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const date = new Date(mid);
    const p = getPersianParts(date);

    const current = p.year * 10000 + p.month * 100 + p.day;
    const wanted = year * 10000 + month * 100 + day;

    if (current === wanted) {
      return new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
      );
    }

    if (current < wanted) low = mid + 1;
    else high = mid - 1;
  }

  return null;
}

function getMonthLength(year, month) {
  if (month <= 6) return 31;
  if (month <= 11) return 30;

  const last = getPersianDate(year, 12, 30);
  return last ? 30 : 29;
}

function renderCalendar() {
  calendar.innerHTML = "";

  const header = document.createElement("div");
  header.className = "calendar-header";

  const title = document.createElement("strong");
  title.textContent = `${months[viewMonth - 1]} ${viewYear}`;

  const prev = document.createElement("button");
  prev.textContent = "‹";
  prev.onclick = () => changeMonth(-1);

  const next = document.createElement("button");
  next.textContent = "›";
  next.onclick = () => changeMonth(1);

  header.append(prev, title, next);
  calendar.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  weekdays.forEach(day => {
    const cell = document.createElement("div");
    cell.className = "day-name";
    cell.textContent = day;
    grid.appendChild(cell);
  });

  const firstDate = getPersianDate(viewYear, viewMonth, 1);
  const offset = firstDate ? (firstDate.getDay() + 1) % 7 : 0;
  const length = getMonthLength(viewYear, viewMonth);

  for (let i = 0; i < offset; i++) {
    grid.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= length; day++) {
    const cell = document.createElement("div");
    cell.className = "day";
    cell.textContent = day;

    const date = getPersianDate(viewYear, viewMonth, day);

    if (!date) {
      cell.classList.add("disabled");
      grid.appendChild(cell);
      continue;
    }

    const p = getPersianParts(date);
    const isPast =
      p.year < currentYear ||
      (p.year === currentYear && p.month < currentMonth) ||
      (p.year === currentYear && p.month === currentMonth && p.day < currentDay);

    const isFriday = date.getDay() === 5;

    if (isPast || isFriday) {
      cell.classList.add("disabled");
      if (isFriday) cell.classList.add("friday");
    } else {
      cell.onclick = () => selectDate(date, cell);
    }

    if (
      selectedDate &&
      selectedDate.toDateString() === date.toDateString()
    ) {
      cell.classList.add("selected");
    }

    grid.appendChild(cell);
  }

  calendar.appendChild(grid);
}

function changeMonth(amount) {
  viewMonth += amount;

  if (viewMonth > 12) {
    viewMonth = 1;
    viewYear++;
  }

  if (viewMonth < 1) {
    viewMonth = 12;
    viewYear--;
  }

  if (
    viewYear < currentYear ||
    (viewYear === currentYear && viewMonth < currentMonth)
  ) {
    viewYear = currentYear;
    viewMonth = currentMonth;
  }

  renderCalendar();
}

function selectDate(date, cell) {
  selectedDate = date;

  const p = getPersianParts(date);

  dateInput.value =
    `${p.year}/${String(p.month).padStart(2, "0")}/${String(p.day).padStart(2, "0")}`;

  renderCalendar();
  loadTimes();
}

function loadTimes() {
  timeSelect.innerHTML = '<option value="">انتخاب ساعت</option>';

  if (!selectedDate) return;

  const service = document.getElementById("service").value;
  const duration = service === "both" ? 60 : 30;

  if (!service) {
    timeSelect.innerHTML = '<option value="">ابتدا خدمت را انتخاب کنید</option>';
    return;
  }

  const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");

  for (let hour = 10; hour < 22; hour++) {
    for (let minute of [0, 30]) {
      const start = hour * 60 + minute;

      if (start + duration > 22 * 60) continue;

      const dateKey = selectedDate.toISOString().slice(0, 10);

      const busy = bookings.some(b => {
        if (b.date !== dateKey) return false;

        const [h, m] = b.time.split(":").map(Number);
        const oldStart = h * 60 + m;
        const oldEnd = oldStart + b.duration;

        return start < oldEnd && start + duration > oldStart;
      });

      if (busy) continue;

      const option = document.createElement("option");
      option.value =
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

      option.textContent =
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

      timeSelect.appendChild(option);
    }
  }
}

document.getElementById("service").addEventListener("change", loadTimes);

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const service = document.getElementById("service").value;
  const time = timeSelect.value;

  if (!selectedDate || !time || !service || !name || !phone) {
    message.textContent = "لطفاً همه اطلاعات را کامل کنید.";
    return;
  }

  if (!/^09\d{9}$/.test(phone)) {
    message.textContent = "شماره موبایل معتبر وارد کنید.";
    return;
  }

  const duration = service === "both" ? 60 : 30;
  const dateKey = selectedDate.toISOString().slice(0, 10);

  const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");

  const [hour, minute] = time.split(":").map(Number);
  const start = hour * 60 + minute;

  const conflict = bookings.some(b => {
    if (b.date !== dateKey) return false;

    const [h, m] = b.time.split(":").map(Number);
    const oldStart = h * 60 + m;

    return start < oldStart + b.duration &&
           start + duration > oldStart;
  });

  if (conflict) {
    message.textContent = "این ساعت قبلاً رزرو شده است.";
    loadTimes();
    return;
  }

  const booking = {
    name,
    phone,
    service,
    date: dateKey,
    persianDate: dateInput.value,
    time,
    duration
  };

  bookings.push(booking);
  localStorage.setItem("bookings", JSON.stringify(bookings));

  message.textContent = "درخواست نوبت با موفقیت ثبت شد ✨";

  form.reset();
  selectedDate = null;
  dateInput.value = "";
  timeSelect.innerHTML = '<option value="">ابتدا تاریخ را انتخاب کنید</option>';
  renderCalendar();
});

renderCalendar();
