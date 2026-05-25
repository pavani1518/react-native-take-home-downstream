// Cover summarizeSites — the §2 summary header derivation.

import { summarizeSites } from "../summary";
import {
  NOW,
  makeEvidence,
  makeSite,
  makeVisit,
} from "./fixtures";

describe("summarizeSites", () => {
  it("counts sites, due today, blocked, urgent, missing evidence, and uploads", () => {
    const sites = [
      makeSite({
        id: "s1",
        priority: "urgent",
        visits: [
          makeVisit({
            id: "v1",
            status: "scheduled",
            scheduledStart: "2026-05-24T15:00:00.000Z",
            scheduledEnd: "2026-05-24T16:00:00.000Z",
            evidenceRequired: true,
            serviceType: "inspection",
          }),
        ],
      }),
      makeSite({
        id: "s2",
        priority: "normal",
        visits: [
          makeVisit({
            id: "v2",
            status: "blocked",
            // Push out of today's window so visitsDueToday stays at 1.
            scheduledStart: "2026-05-26T10:00:00.000Z",
            scheduledEnd: "2026-05-26T11:00:00.000Z",
            // Evidence not required so visitsMissingEvidence stays at 1.
            evidenceRequired: false,
          }),
        ],
      }),
    ];
    const evidence = [
      makeEvidence({ visitId: "v1", uploadStatus: "queued" }),
    ];
    const r = summarizeSites(sites, evidence, NOW);
    expect(r.totalSites).toBe(2);
    expect(r.urgentSites).toBe(1);
    expect(r.blockedVisits).toBe(1);
    expect(r.visitsDueToday).toBe(1);
    expect(r.visitsMissingEvidence).toBe(1); // inspection needs 2 photos, only 1 captured
    expect(r.failedOrQueuedUploads).toBe(1);
  });

  it("excludes uploads belonging to visits not in the filtered set", () => {
    const sites = [makeSite({ visits: [makeVisit({ id: "in-set" })] })];
    const evidence = [
      makeEvidence({ visitId: "out-of-set", uploadStatus: "failed" }),
    ];
    expect(summarizeSites(sites, evidence, NOW).failedOrQueuedUploads).toBe(0);
  });

  it("returns zeros for empty input", () => {
    const r = summarizeSites([], [], NOW);
    expect(r).toEqual({
      totalSites: 0,
      visitsDueToday: 0,
      blockedVisits: 0,
      urgentSites: 0,
      visitsMissingEvidence: 0,
      failedOrQueuedUploads: 0,
    });
  });
});
