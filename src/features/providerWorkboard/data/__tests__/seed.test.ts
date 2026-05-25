// Cover the deterministic seed: shape + spec floor + edge-case presence.

import { buildSeed, SEED_NOW_ISO } from "../seed";

describe("buildSeed", () => {
  it("meets the spec floor: ≥20 sites and ≥60 visits", () => {
    const s = buildSeed();
    expect(s.sites.length).toBeGreaterThanOrEqual(20);
    const totalVisits = s.sites.reduce((n, x) => n + x.visits.length, 0);
    expect(totalVisits).toBeGreaterThanOrEqual(60);
  });

  it("is deterministic — same inputs give same outputs across calls", () => {
    const a = buildSeed();
    const b = buildSeed();
    expect(a.sites.length).toBe(b.sites.length);
    expect(a.sites[0]?.id).toBe(b.sites[0]?.id);
    expect(a.sites[0]?.visits.length).toBe(b.sites[0]?.visits.length);
  });

  it("includes mixed VisitStatus values (all 7)", () => {
    const s = buildSeed();
    const statuses = new Set(s.sites.flatMap((x) => x.visits.map((v) => v.status)));
    for (const want of [
      "scheduled",
      "confirmed",
      "en_route",
      "on_site",
      "blocked",
      "completed",
      "cancelled",
    ] as const) {
      expect(statuses).toContain(want);
    }
  });

  it("includes mixed WorkStatus values incl. 'completed'", () => {
    const s = buildSeed();
    const wsValues = new Set(s.sites.map((x) => x.workStatus));
    expect(wsValues).toContain("blocked");
    expect(wsValues).toContain("needs_attention");
    expect(wsValues).toContain("in_progress");
    expect(wsValues).toContain("completed");
    expect(wsValues).toContain("scheduled");
  });

  it("includes all 3 priorities", () => {
    const s = buildSeed();
    const priorities = new Set(s.sites.map((x) => x.priority));
    expect(priorities).toContain("normal");
    expect(priorities).toContain("high");
    expect(priorities).toContain("urgent");
  });

  it("includes at least one scan mismatch (for the Scan mismatch filter)", () => {
    const s = buildSeed();
    expect(s.scans.some((x) => x.result === "mismatch")).toBe(true);
  });

  it("includes at least one failed upload (for the retry queue)", () => {
    const s = buildSeed();
    expect(s.evidence.some((x) => x.uploadStatus === "failed")).toBe(true);
  });

  it("evidence/scans/motion records reference valid visit ids", () => {
    const s = buildSeed();
    const visitIds = new Set(s.sites.flatMap((x) => x.visits.map((v) => v.id)));
    for (const e of s.evidence) expect(visitIds.has(e.visitId)).toBe(true);
    for (const sc of s.scans) expect(visitIds.has(sc.visitId)).toBe(true);
    for (const m of s.motion) expect(visitIds.has(m.visitId)).toBe(true);
  });

  it("exposes a fixed reference NOW so downstream code can stabilize tests", () => {
    expect(SEED_NOW_ISO).toBe("2026-05-24T15:00:00.000Z");
  });

  it("varies hardware requirements across visits", () => {
    const s = buildSeed();
    const visits = s.sites.flatMap((x) => x.visits);
    expect(visits.some((v) => v.evidenceRequired)).toBe(true);
    expect(visits.some((v) => !v.evidenceRequired)).toBe(true);
    expect(visits.some((v) => v.motionCheckRequired)).toBe(true);
    expect(visits.some((v) => v.locationRequired)).toBe(true);
  });

  it("each site has at least one visit and valid address", () => {
    const s = buildSeed();
    for (const site of s.sites) {
      expect(site.visits.length).toBeGreaterThan(0);
      expect(site.address.line1).toBeTruthy();
      expect(site.address.city).toBeTruthy();
      expect(site.address.region).toBeTruthy();
      expect(site.address.postalCode).toBeTruthy();
      expect(site.contactName).toBeTruthy();
      expect(site.contactPhone).toBeTruthy();
    }
  });
});
