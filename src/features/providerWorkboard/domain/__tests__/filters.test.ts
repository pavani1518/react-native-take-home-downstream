// §14: Search and filter behavior; date-scope behavior.

import { filterSites } from "../filters";
import { matchesDateScope } from "../dateScope";
import type { WorkboardFilters } from "../../types";
import { NOW, makeSite, makeVisit } from "./fixtures";

const baseFilters: WorkboardFilters = {
  query: "",
  statuses: [],
  dateScope: "all",
  evidence: null,
};

describe("filterSites — text search", () => {
  const sites = [
    makeSite({ id: "s1", siteName: "Hub A", customerName: "Acme" }),
    makeSite({ id: "s2", siteName: "Depot North", customerName: "Bluebird" }),
    makeSite({
      id: "s3",
      siteName: "Lab Wing 4",
      customerName: "Lighthouse",
      visits: [makeVisit({ id: "vx", equipmentLabel: "MRI Scanner #MR-1" })],
    }),
  ];

  it("matches by site name", () => {
    const r = filterSites(sites, { ...baseFilters, query: "hub" }, [], [], NOW);
    expect(r.map((s) => s.id)).toEqual(["s1"]);
  });

  it("matches by customer name", () => {
    const r = filterSites(
      sites,
      { ...baseFilters, query: "bluebird" },
      [],
      [],
      NOW
    );
    expect(r.map((s) => s.id)).toEqual(["s2"]);
  });

  it("matches by equipment label across nested visits", () => {
    const r = filterSites(sites, { ...baseFilters, query: "mri" }, [], [], NOW);
    expect(r.map((s) => s.id)).toEqual(["s3"]);
  });

  it("matches by address", () => {
    const r = filterSites(sites, { ...baseFilters, query: "austin" }, [], [], NOW);
    expect(r.length).toBe(3); // all fixtures use Austin
  });

  it("empty query returns all", () => {
    const r = filterSites(sites, baseFilters, [], [], NOW);
    expect(r.length).toBe(3);
  });
});

describe("filterSites — status filter", () => {
  const sites = [
    makeSite({ id: "s1", workStatus: "blocked" }),
    makeSite({ id: "s2", workStatus: "completed" }),
    makeSite({ id: "s3", workStatus: "scheduled" }),
  ];

  it("filters to one status", () => {
    const r = filterSites(
      sites,
      { ...baseFilters, statuses: ["blocked"] },
      [],
      [],
      NOW
    );
    expect(r.map((s) => s.id)).toEqual(["s1"]);
  });

  it("filters to multiple statuses", () => {
    const r = filterSites(
      sites,
      { ...baseFilters, statuses: ["blocked", "completed"] },
      [],
      [],
      NOW
    );
    expect(r.length).toBe(2);
  });
});

describe("matchesDateScope", () => {
  it("today matches a visit scheduled today", () => {
    const visit = makeVisit({ scheduledStart: "2026-05-24T16:00:00.000Z" });
    expect(matchesDateScope(visit, "today", NOW)).toBe(true);
  });

  it("today excludes a visit scheduled tomorrow", () => {
    const visit = makeVisit({ scheduledStart: "2026-05-25T16:00:00.000Z" });
    expect(matchesDateScope(visit, "today", NOW)).toBe(false);
  });

  it("next_7_days includes day 0 and day 6", () => {
    expect(
      matchesDateScope(
        makeVisit({ scheduledStart: "2026-05-24T08:00:00.000Z" }),
        "next_7_days",
        NOW
      )
    ).toBe(true);
    expect(
      matchesDateScope(
        makeVisit({ scheduledStart: "2026-05-30T23:00:00.000Z" }),
        "next_7_days",
        NOW
      )
    ).toBe(true);
  });

  it("next_7_days excludes day 7+ and the past", () => {
    expect(
      matchesDateScope(
        makeVisit({ scheduledStart: "2026-06-01T01:00:00.000Z" }),
        "next_7_days",
        NOW
      )
    ).toBe(false);
    expect(
      matchesDateScope(
        makeVisit({ scheduledStart: "2026-05-23T23:00:00.000Z" }),
        "next_7_days",
        NOW
      )
    ).toBe(false);
  });

  it("all accepts everything", () => {
    expect(
      matchesDateScope(
        makeVisit({ scheduledStart: "2020-01-01T00:00:00.000Z" }),
        "all",
        NOW
      )
    ).toBe(true);
    expect(
      matchesDateScope(
        makeVisit({ scheduledStart: "2030-01-01T00:00:00.000Z" }),
        "all",
        NOW
      )
    ).toBe(true);
  });
});
