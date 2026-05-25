// Cover all branches of statusSentence — the user-facing plain-language
// description used on the site detail sheet.

import { statusSentence } from "../statusSentence";
import { NOW, makeSite, makeVisit } from "./fixtures";

describe("statusSentence", () => {
  it("reports blocked + reason when any visit is blocked", () => {
    const site = makeSite({
      visits: [
        makeVisit({ status: "blocked", blockedReason: "site closed for audit" }),
      ],
    });
    expect(statusSentence(site, NOW)).toMatch(/blocked.*site closed for audit/i);
  });

  it("reports blocked without reason if none provided", () => {
    const site = makeSite({
      visits: [makeVisit({ status: "blocked", blockedReason: undefined })],
    });
    expect(statusSentence(site, NOW)).toMatch(/at least one blocked visit/i);
  });

  it("singular: '1 overdue visit needs attention'", () => {
    const site = makeSite({
      visits: [
        makeVisit({
          status: "scheduled",
          scheduledEnd: "2020-01-01T00:00:00Z",
        }),
      ],
    });
    expect(statusSentence(site, NOW)).toBe("1 overdue visit needs attention.");
  });

  it("plural: 'N overdue visits need attention'", () => {
    const site = makeSite({
      visits: [
        makeVisit({ id: "v1", status: "scheduled", scheduledEnd: "2020-01-01T00:00:00Z" }),
        makeVisit({ id: "v2", status: "scheduled", scheduledEnd: "2020-01-02T00:00:00Z" }),
      ],
    });
    expect(statusSentence(site, NOW)).toBe("2 overdue visits need attention.");
  });

  it("reports in-progress visits", () => {
    const site = makeSite({
      visits: [makeVisit({ status: "on_site" })],
    });
    expect(statusSentence(site, NOW)).toMatch(/in progress/i);
  });

  it("reports today-scheduled visits", () => {
    const site = makeSite({
      visits: [
        makeVisit({
          status: "scheduled",
          scheduledStart: "2026-05-24T16:00:00.000Z",
          scheduledEnd: "2026-05-24T17:00:00.000Z",
        }),
      ],
    });
    expect(statusSentence(site, NOW)).toMatch(/scheduled today/i);
  });

  it("returns 'No visits scheduled' when empty", () => {
    const site = makeSite({ visits: [] });
    expect(statusSentence(site, NOW)).toBe("No visits scheduled.");
  });

  it("reports all closed out when every visit completed/cancelled", () => {
    const site = makeSite({
      visits: [
        makeVisit({ status: "completed", scheduledStart: "2026-05-20T10:00:00Z", scheduledEnd: "2026-05-20T11:00:00Z" }),
        makeVisit({ id: "v2", status: "cancelled", scheduledStart: "2026-05-21T10:00:00Z", scheduledEnd: "2026-05-21T11:00:00Z" }),
      ],
    });
    expect(statusSentence(site, NOW)).toBe("All visits closed out.");
  });

  it("falls through to upcoming default", () => {
    const site = makeSite({
      visits: [
        makeVisit({
          status: "scheduled",
          scheduledStart: "2026-05-28T10:00:00Z",
          scheduledEnd: "2026-05-28T11:00:00Z",
        }),
      ],
    });
    expect(statusSentence(site, NOW)).toBe("Upcoming visits scheduled.");
  });
});
