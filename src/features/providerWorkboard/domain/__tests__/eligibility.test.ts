// §14: Visit action eligibility; status transition behavior;
// edge case involving blocked/cancelled/overdue/completed; completion readiness.

import { getEligibleActions } from "../eligibility";
import { isTransitionAllowed, nextStatus } from "../transitions";
import { canComplete } from "../completion";
import {
  makeEvidence,
  makeMotion,
  makeScan,
  makeVisit,
} from "./fixtures";

describe("isTransitionAllowed", () => {
  it("forbids mark_en_route after completion", () => {
    expect(isTransitionAllowed("completed", "mark_en_route")).toBe(false);
  });

  it("forbids complete_visit for cancelled", () => {
    expect(isTransitionAllowed("cancelled", "complete_visit")).toBe(false);
  });

  it("allows complete_visit from on_site", () => {
    expect(isTransitionAllowed("on_site", "complete_visit")).toBe(true);
  });

  it("allows report_blocked while in progress", () => {
    expect(isTransitionAllowed("en_route", "report_blocked")).toBe(true);
  });
});

describe("nextStatus", () => {
  it("transitions scheduled → en_route", () => {
    expect(nextStatus("scheduled", "mark_en_route")).toBe("en_route");
  });

  it("rejects invalid transition by returning current", () => {
    expect(nextStatus("completed", "mark_en_route")).toBe("completed");
  });

  it("transitions on_site → completed", () => {
    expect(nextStatus("on_site", "complete_visit")).toBe("completed");
  });

  it("transitions to blocked from any in-flight status", () => {
    expect(nextStatus("scheduled", "report_blocked")).toBe("blocked");
    expect(nextStatus("on_site", "report_blocked")).toBe("blocked");
  });
});

describe("getEligibleActions — edge cases", () => {
  it("cancelled visit: no constructive action available", () => {
    const v = makeVisit({ status: "cancelled" });
    const actions = getEligibleActions(v, [], undefined, undefined);
    for (const a of actions) {
      if (a.id === "retry_failed_upload") continue;
      expect(a.enabled).toBe(false);
    }
  });

  it("completed visit: cannot mark en route or complete again", () => {
    const v = makeVisit({ status: "completed" });
    const actions = getEligibleActions(v, [], undefined, undefined);
    const enRoute = actions.find((a) => a.id === "mark_en_route");
    const complete = actions.find((a) => a.id === "complete_visit");
    expect(enRoute?.enabled).toBe(false);
    expect(complete?.enabled).toBe(false);
  });

  it("blocked visit: cannot mark en route, but can retry upload if failed exists", () => {
    const v = makeVisit({ status: "blocked" });
    const actions = getEligibleActions(
      v,
      [makeEvidence({ uploadStatus: "failed" })],
      undefined,
      undefined
    );
    expect(actions.find((a) => a.id === "mark_en_route")?.enabled).toBe(false);
    expect(actions.find((a) => a.id === "retry_failed_upload")?.enabled).toBe(true);
  });

  it("retry disabled when no failed uploads exist", () => {
    const v = makeVisit({ status: "on_site" });
    const actions = getEligibleActions(v, [], undefined, undefined);
    expect(actions.find((a) => a.id === "retry_failed_upload")?.enabled).toBe(
      false
    );
  });

  it("complete disabled when evidence missing", () => {
    const v = makeVisit({
      status: "on_site",
      evidenceRequired: true,
      motionCheckRequired: false,
    });
    const actions = getEligibleActions(v, [], makeScan(), undefined);
    expect(actions.find((a) => a.id === "complete_visit")?.enabled).toBe(false);
  });

  it("complete enabled when all gates pass (no motion required)", () => {
    const v = makeVisit({
      status: "on_site",
      evidenceRequired: true,
      motionCheckRequired: false,
    });
    const evidence = [
      makeEvidence({ type: "arrival_photo" }),
      makeEvidence({ id: "e2", type: "completion_photo" }),
    ];
    const actions = getEligibleActions(v, evidence, makeScan(), undefined);
    expect(actions.find((a) => a.id === "complete_visit")?.enabled).toBe(true);
  });
});

describe("canComplete — readiness blockers", () => {
  it("blocks when scan is mismatched", () => {
    const v = makeVisit({ status: "on_site" });
    const evidence = [
      makeEvidence({ type: "arrival_photo" }),
      makeEvidence({ id: "e2", type: "completion_photo" }),
    ];
    const r = canComplete(
      v,
      evidence,
      makeScan({ scannedAssetCode: "WRONG", result: "mismatch" }),
      undefined
    );
    expect(r.ready).toBe(false);
    expect(r.blockers).toContain("scan_mismatch");
  });

  it("blocks when motion required but not run", () => {
    const v = makeVisit({ status: "on_site", motionCheckRequired: true });
    const evidence = [
      makeEvidence({ type: "arrival_photo" }),
      makeEvidence({ id: "e2", type: "completion_photo" }),
    ];
    const r = canComplete(v, evidence, makeScan(), undefined);
    expect(r.ready).toBe(false);
    expect(r.blockers).toContain("motion_missing");
  });

  it("blocks on rough motion", () => {
    const v = makeVisit({ status: "on_site", motionCheckRequired: true });
    const evidence = [
      makeEvidence({ type: "arrival_photo" }),
      makeEvidence({ id: "e2", type: "completion_photo" }),
    ];
    const r = canComplete(
      v,
      evidence,
      makeScan(),
      makeMotion({ maxAccelerationG: 2.2, result: "rough_motion_detected" })
    );
    expect(r.ready).toBe(false);
    expect(r.blockers).toContain("motion_rough");
  });

  it("ready when status valid + evidence + scan match + stable motion", () => {
    const v = makeVisit({ status: "on_site", motionCheckRequired: true });
    const evidence = [
      makeEvidence({ type: "arrival_photo" }),
      makeEvidence({ id: "e2", type: "completion_photo" }),
    ];
    const r = canComplete(v, evidence, makeScan(), makeMotion());
    expect(r.ready).toBe(true);
    expect(r.blockers).toEqual([]);
  });

  it("blocks completion of cancelled visit with status_invalid", () => {
    const v = makeVisit({ status: "cancelled" });
    const r = canComplete(v, [], makeScan(), undefined);
    expect(r.blockers).toContain("status_invalid");
  });
});
