// Cover the pure date-formatting helpers used by SiteRow + sheets.
// Use times close to noon UTC so behavior is stable across timezones.

import { formatNextTime, formatTimeWindow, formatVisitTime } from "../format";

describe("formatVisitTime", () => {
  it("returns 'Mon Day · HH:MM AM/PM' for a date in the same year", () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    const r = formatVisitTime("2026-05-24T12:00:00.000Z", now);
    expect(r).toMatch(/May 24 · \d{1,2}:\d{2} (AM|PM)/);
  });

  it("includes year when target is in a different year", () => {
    const now = new Date("2027-01-01T12:00:00.000Z");
    const r = formatVisitTime("2026-05-24T12:00:00.000Z", now);
    expect(r).toMatch(/May 24, 2026 · \d{1,2}:\d{2} (AM|PM)/);
  });

  it("defaults now to current time when omitted", () => {
    expect(() => formatVisitTime("2026-05-24T12:00:00.000Z")).not.toThrow();
  });
});

describe("formatNextTime", () => {
  it("uses 'Today,' prefix when target is the same calendar day as now", () => {
    // Build now and target from the same local timestamp so same-day check
    // holds in any timezone.
    const now = new Date(2026, 4, 24, 10, 0, 0); // May 24 2026 10:00 local
    const target = new Date(2026, 4, 24, 14, 30, 0).toISOString();
    const r = formatNextTime(target, now);
    expect(r).toMatch(/^Today, \d{1,2}:\d{2} (AM|PM)$/);
  });

  it("falls back to formatVisitTime for other days", () => {
    const now = new Date(2026, 4, 24, 10, 0, 0);
    const target = new Date(2026, 4, 27, 6, 0, 0).toISOString();
    const r = formatNextTime(target, now);
    expect(r).toMatch(/May 27 · \d{1,2}:\d{2} (AM|PM)/);
  });
});

describe("formatTimeWindow", () => {
  it("returns 'start – end'", () => {
    const r = formatTimeWindow(
      "2026-05-24T12:00:00.000Z",
      "2026-05-24T13:00:00.000Z"
    );
    expect(r).toMatch(/^\d{1,2}:\d{2} (AM|PM) – \d{1,2}:\d{2} (AM|PM)$/);
  });

  it("renders midnight as 12:00 AM not 0:00", () => {
    // Use local midnight so we're not timezone-dependent.
    const start = new Date(2026, 4, 24, 0, 0, 0).toISOString();
    const end = new Date(2026, 4, 24, 1, 0, 0).toISOString();
    const r = formatTimeWindow(start, end);
    expect(r).toMatch(/^12:00 AM – 1:00 AM$/);
  });
});
