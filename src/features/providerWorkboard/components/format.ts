// Shared date/time formatting for the UI. Pure functions.
// Keeps timestamps compact and consistent across rows and sheets.

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function timeHHMM(d: Date): string {
  let h = d.getHours();
  const m = pad(d.getMinutes());
  const am = h < 12;
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${am ? "AM" : "PM"}`;
}

// "May 27 · 6:00 AM" — compact, no seconds, no year unless not current year.
export function formatVisitTime(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const time = timeHHMM(d);
  const showYear = d.getFullYear() !== now.getFullYear();
  return showYear
    ? `${month} ${day}, ${d.getFullYear()} · ${time}`
    : `${month} ${day} · ${time}`;
}

// "Today, 6:00 AM" when same day; "May 27 · 6:00 AM" otherwise.
export function formatNextTime(iso: string, now: Date): string {
  const d = new Date(iso);
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return `Today, ${timeHHMM(d)}`;
  return formatVisitTime(iso, now);
}

// Time-only window: "6:00 AM – 7:00 AM"
export function formatTimeWindow(startIso: string, endIso: string): string {
  return `${timeHHMM(new Date(startIso))} – ${timeHHMM(new Date(endIso))}`;
}
