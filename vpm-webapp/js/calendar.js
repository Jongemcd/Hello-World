// Renders a month calendar grid, color-coding each day from a dayStatusMap
// keyed by "YYYY-MM-DD" -> "green" | "yellow" | "blue" | "red".
const VPMCalendar = (function () {
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function pad(n) { return String(n).padStart(2, "0"); }

  function render(container, { year, month, dayStatusMap, onNav, onDayClick }) {
    const first = new Date(year, month, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = new Date().toISOString().slice(0, 10);

    let html = `<div class="cal-header">
        <button data-dir="-1" aria-label="Previous month">&#8249;</button>
        <span>${MONTH_NAMES[month].toUpperCase()} ${year}</span>
        <button data-dir="1" aria-label="Next month">&#8250;</button>
      </div>
      <div class="cal-grid">`;

    DOW.forEach(d => { html += `<div class="dow">${d}</div>`; });

    // Leading blanks, then trailing days of previous month for a filled grid look.
    const leadDays = startDow;
    for (let i = 0; i < leadDays; i++) {
      html += `<div class="day empty"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${pad(month + 1)}-${pad(d)}`;
      const status = (dayStatusMap && dayStatusMap[key]) || "default";
      const isToday = key === todayKey ? " today" : "";
      html += `<div class="day ${status}${isToday}" data-date="${key}">${d}</div>`;
    }

    container.innerHTML = html;

    container.querySelectorAll("button[data-dir]").forEach(btn => {
      btn.addEventListener("click", () => onNav && onNav(parseInt(btn.dataset.dir, 10)));
    });

    if (onDayClick) {
      container.querySelectorAll(".day[data-date]").forEach(el => {
        el.addEventListener("click", () => onDayClick(el.dataset.date));
      });
    }
  }

  // Small stateful wrapper so callers don't have to track year/month themselves.
  function mount(container, opts) {
    const state = { year: opts.year, month: opts.month };
    function draw() {
      render(container, {
        year: state.year,
        month: state.month,
        dayStatusMap: opts.dayStatusMap,
        onDayClick: opts.onDayClick,
        onNav: (dir) => {
          state.month += dir;
          if (state.month < 0) { state.month = 11; state.year -= 1; }
          if (state.month > 11) { state.month = 0; state.year += 1; }
          draw();
        }
      });
    }
    draw();
  }

  return { mount };
})();
