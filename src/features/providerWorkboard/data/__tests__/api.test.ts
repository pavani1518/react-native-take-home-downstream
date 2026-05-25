// Cover the mocked async API: fetchers return seeded shapes, mutations
// persist into the in-memory store, failure rates are tunable for tests.

import {
  __resetStoreForTests,
  fetchEvidence,
  fetchMotion,
  fetchScans,
  fetchSites,
  FAILURE_RATES,
  mutateVisit,
  recordMotion,
  recordScan,
  saveEvidenceLocal,
  uploadEvidence,
} from "../api";

beforeEach(() => {
  __resetStoreForTests();
  // Force deterministic success in fetch + mutate paths during tests.
  FAILURE_RATES.fetchSites = 0;
  FAILURE_RATES.mutateVisit = 0;
  FAILURE_RATES.uploadEvidence = 0;
});

describe("fetchers", () => {
  it("fetchSites returns the seeded sites", async () => {
    const sites = await fetchSites();
    expect(sites.length).toBeGreaterThanOrEqual(20);
    expect(sites[0]).toHaveProperty("siteName");
  });

  it("fetchEvidence/Scans/Motion return arrays", async () => {
    expect(Array.isArray(await fetchEvidence())).toBe(true);
    expect(Array.isArray(await fetchScans())).toBe(true);
    expect(Array.isArray(await fetchMotion())).toBe(true);
  });

  it("fetchSites throws when fetch failure rate = 1", async () => {
    FAILURE_RATES.fetchSites = 1;
    await expect(fetchSites()).rejects.toThrow(/Failed to fetch/);
  });
});

describe("mutateVisit", () => {
  it("transitions visit status on mark_en_route and persists", async () => {
    const before = await fetchSites();
    const visitId = before[0]?.visits[0]?.id;
    if (!visitId) throw new Error("seed missing visit");

    const updated = await mutateVisit({ visitId, action: "mark_en_route" });
    expect(updated.status).toBe("en_route");

    const after = await fetchSites();
    const seen = after[0]?.visits.find((v) => v.id === visitId);
    expect(seen?.status).toBe("en_route");
  });

  it("attaches blockedReason on report_blocked", async () => {
    const sites = await fetchSites();
    const visitId = sites[0]?.visits[0]?.id;
    if (!visitId) throw new Error("seed missing visit");

    const updated = await mutateVisit({
      visitId,
      action: "report_blocked",
      blockedReason: "test reason",
    });
    expect(updated.status).toBe("blocked");
    expect(updated.blockedReason).toBe("test reason");
  });

  it("throws when failure rate = 1", async () => {
    FAILURE_RATES.mutateVisit = 1;
    const sites = await fetchSites();
    const visitId = sites[0]?.visits[0]?.id ?? "x";
    await expect(
      mutateVisit({ visitId, action: "mark_en_route" })
    ).rejects.toThrow(/Mutation failed/);
  });

  it("throws when visit not found", async () => {
    await expect(
      mutateVisit({ visitId: "does-not-exist", action: "mark_en_route" })
    ).rejects.toThrow(/Visit not found/);
  });
});

describe("saveEvidenceLocal + uploadEvidence", () => {
  it("saveEvidenceLocal pushes a queued record", async () => {
    const e = await saveEvidenceLocal({
      visitId: "visit-0",
      type: "arrival_photo",
      localUri: "mock://uri",
      latitude: 30,
      longitude: -97,
    });
    expect(e.uploadStatus).toBe("queued");
    expect(e.latitude).toBe(30);
  });

  it("uploadEvidence transitions queued → uploaded on success", async () => {
    const e = await saveEvidenceLocal({
      visitId: "visit-0",
      type: "arrival_photo",
      localUri: "mock://uri",
    });
    const result = await uploadEvidence(e.id);
    expect(result).toBe("uploaded");
  });

  it("uploadEvidence marks failed and throws when forced to fail", async () => {
    FAILURE_RATES.uploadEvidence = 1;
    const e = await saveEvidenceLocal({
      visitId: "visit-0",
      type: "arrival_photo",
      localUri: "mock://uri",
    });
    await expect(uploadEvidence(e.id)).rejects.toThrow(/Upload failed/);
  });

  it("uploadEvidence throws when evidence id not found", async () => {
    await expect(uploadEvidence("missing-id")).rejects.toThrow(/Evidence not found/);
  });
});

describe("recordScan + recordMotion", () => {
  it("recordScan persists a scan result", async () => {
    const r = await recordScan({
      visitId: "visit-0",
      expectedAssetCode: "ASSET-X",
      scannedAssetCode: "ASSET-X",
      result: "match",
    });
    expect(r.result).toBe("match");
  });

  it("recordScan replaces existing scan for the same visit", async () => {
    await recordScan({
      visitId: "visit-0",
      expectedAssetCode: "X",
      scannedAssetCode: "X",
      result: "match",
    });
    await recordScan({
      visitId: "visit-0",
      expectedAssetCode: "X",
      scannedAssetCode: "Y",
      result: "mismatch",
    });
    const all = await fetchScans();
    const forVisit = all.filter((s) => s.visitId === "visit-0");
    expect(forVisit.length).toBe(1);
    expect(forVisit[0]?.result).toBe("mismatch");
  });

  it("recordMotion persists a motion sample", async () => {
    const r = await recordMotion({
      visitId: "visit-0",
      startedAt: "2026-05-24T10:00:00.000Z",
      completedAt: "2026-05-24T10:00:04.000Z",
      maxAccelerationG: 0.8,
      result: "stable",
    });
    expect(r.result).toBe("stable");
    expect(r.maxAccelerationG).toBe(0.8);
  });
});
