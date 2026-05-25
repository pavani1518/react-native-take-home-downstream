// Cover the analytics abstraction: track() pushes events, getEventLog() reads,
// __resetAnalyticsForTests() clears, payload preserved verbatim.

import {
  __resetAnalyticsForTests,
  getEventLog,
  track,
} from "../analytics";

beforeEach(() => __resetAnalyticsForTests());

describe("analytics.track", () => {
  it("pushes event with name, payload, and ISO timestamp", () => {
    track("workboard_viewed", { user: "tester" });
    const log = getEventLog();
    expect(log.length).toBe(1);
    expect(log[0]?.name).toBe("workboard_viewed");
    expect(log[0]?.payload).toEqual({ user: "tester" });
    expect(log[0]?.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("defaults payload to empty object when omitted", () => {
    track("refresh_triggered");
    expect(getEventLog()[0]?.payload).toEqual({});
  });

  it("accumulates events in order", () => {
    track("site_opened", { site_id: "s1" });
    track("visit_opened", { visit_id: "v1", status: "scheduled" });
    track("visit_action_started", { visit_id: "v1", action: "mark_en_route" });
    const names = getEventLog().map((e) => e.name);
    expect(names).toEqual([
      "site_opened",
      "visit_opened",
      "visit_action_started",
    ]);
  });

  it("preserves all payload value types", () => {
    track("asset_scan_completed", {
      visit_id: "v1",
      result: "match",
      attempts: 3,
      mismatch: false,
    });
    expect(getEventLog()[0]?.payload).toEqual({
      visit_id: "v1",
      result: "match",
      attempts: 3,
      mismatch: false,
    });
  });
});

describe("__resetAnalyticsForTests", () => {
  it("clears the event log", () => {
    track("workboard_viewed");
    expect(getEventLog().length).toBe(1);
    __resetAnalyticsForTests();
    expect(getEventLog().length).toBe(0);
  });
});
