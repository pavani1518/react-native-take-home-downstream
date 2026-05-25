// Cover the parts of filters.ts that filters.test.ts didn't reach:
// visitStatusCounts, nextVisit, siteMissingEvidenceCount, isSiteLate,
// matchesEvidence + matchesStatus branches.

import {
  filterSites,
  isSiteLate,
  nextVisit,
  siteMissingEvidenceCount,
  visitStatusCounts,
} from "../filters";
import type { WorkboardFilters } from "../../types";
import { NOW, makeEvidence, makeScan, makeSite, makeVisit } from "./fixtures";

const baseFilters: WorkboardFilters = {
  query: "",
  statuses: [],
  dateScope: "all",
  evidence: null,
};

describe("visitStatusCounts", () => {
  it("counts each status", () => {
    const visits = [
      makeVisit({ id: "1", status: "scheduled" }),
      makeVisit({ id: "2", status: "scheduled" }),
      makeVisit({ id: "3", status: "blocked" }),
      makeVisit({ id: "4", status: "completed" }),
    ];
    const c = visitStatusCounts(visits);
    expect(c.scheduled).toBe(2);
    expect(c.blocked).toBe(1);
    expect(c.completed).toBe(1);
    expect(c.cancelled).toBe(0);
  });

  it("empty input returns all zeros", () => {
    const c = visitStatusCounts([]);
    expect(Object.values(c).every((n) => n === 0)).toBe(true);
  });
});

describe("nextVisit", () => {
  it("returns the soonest future scheduled visit", () => {
    const visits = [
      makeVisit({ id: "a", scheduledStart: "2026-05-26T10:00:00Z", status: "scheduled" }),
      makeVisit({ id: "b", scheduledStart: "2026-05-25T10:00:00Z", status: "scheduled" }),
    ];
    expect(nextVisit(visits, NOW)?.id).toBe("b");
  });

  it("skips completed and cancelled visits", () => {
    const visits = [
      makeVisit({ id: "done", scheduledStart: "2026-05-25T10:00:00Z", status: "completed" }),
      makeVisit({ id: "next", scheduledStart: "2026-05-26T10:00:00Z", status: "scheduled" }),
    ];
    expect(nextVisit(visits, NOW)?.id).toBe("next");
  });

  it("returns null when no future visit", () => {
    const visits = [
      makeVisit({ scheduledStart: "2020-01-01T10:00:00Z", status: "scheduled" }),
    ];
    expect(nextVisit(visits, NOW)).toBeNull();
  });
});

describe("siteMissingEvidenceCount", () => {
  it("sums missing evidence across visits", () => {
    const site = makeSite({
      visits: [
        makeVisit({ id: "v1", evidenceRequired: true, serviceType: "inspection" }), // needs 2
        makeVisit({ id: "v2", evidenceRequired: true, serviceType: "delivery" }), // needs 1
        makeVisit({ id: "v3", evidenceRequired: false }), // 0
      ],
    });
    expect(siteMissingEvidenceCount(site, [])).toBe(3);
  });

  it("returns 0 when all captured", () => {
    const site = makeSite({
      visits: [
        makeVisit({ id: "v1", evidenceRequired: true, serviceType: "delivery" }),
      ],
    });
    const evidence = [
      makeEvidence({ id: "e1", visitId: "v1", type: "completion_photo" }),
    ];
    expect(siteMissingEvidenceCount(site, evidence)).toBe(0);
  });
});

describe("isSiteLate", () => {
  it("late when any active visit's scheduledEnd is past", () => {
    const site = makeSite({
      visits: [
        makeVisit({
          status: "scheduled",
          scheduledEnd: "2020-01-01T00:00:00Z",
        }),
      ],
    });
    expect(isSiteLate(site, NOW)).toBe(true);
  });

  it("not late when only completed/cancelled visits are overdue", () => {
    const site = makeSite({
      visits: [
        makeVisit({ status: "completed", scheduledEnd: "2020-01-01T00:00:00Z" }),
        makeVisit({ id: "v2", status: "cancelled", scheduledEnd: "2020-01-01T00:00:00Z" }),
      ],
    });
    expect(isSiteLate(site, NOW)).toBe(false);
  });
});

describe("filterSites — evidence filter branches", () => {
  const sites = [
    makeSite({
      id: "s-missing",
      visits: [makeVisit({ id: "v1", evidenceRequired: true, serviceType: "inspection" })],
    }),
    makeSite({
      id: "s-mismatch",
      visits: [makeVisit({ id: "v2", evidenceRequired: false })],
    }),
    makeSite({
      id: "s-ready",
      visits: [
        makeVisit({
          id: "v3",
          status: "on_site",
          evidenceRequired: false,
          motionCheckRequired: false,
        }),
      ],
    }),
  ];

  it("missing_proof returns sites with required-but-uncaptured evidence", () => {
    const r = filterSites(
      sites,
      { ...baseFilters, evidence: "missing_proof" },
      [],
      [],
      NOW
    );
    expect(r.map((s) => s.id)).toEqual(["s-missing"]);
  });

  it("scan_mismatch returns sites with at least one mismatch scan", () => {
    const scans = [makeScan({ visitId: "v2", result: "mismatch", scannedAssetCode: "WRONG" })];
    const r = filterSites(
      sites,
      { ...baseFilters, evidence: "scan_mismatch" },
      [],
      scans,
      NOW
    );
    expect(r.map((s) => s.id)).toEqual(["s-mismatch"]);
  });

  it("ready_to_complete excludes visits with motion required", () => {
    const r = filterSites(
      sites,
      { ...baseFilters, evidence: "ready_to_complete" },
      [],
      [makeScan({ visitId: "v3" })],
      NOW
    );
    // s-ready has no motion req + scan present + no required evidence → ready
    expect(r.map((s) => s.id)).toContain("s-ready");
  });
});
