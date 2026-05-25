// §14: Evidence checklist completion.

import {
  evidenceChecklist,
  isEvidenceComplete,
  missingEvidenceCount,
} from "../evidence";
import { makeEvidence, makeVisit } from "./fixtures";

describe("evidenceChecklist", () => {
  it("inspection requires arrival + completion photos", () => {
    const v = makeVisit({ serviceType: "inspection", evidenceRequired: true });
    const list = evidenceChecklist(v, []);
    expect(list.map((l) => l.type)).toEqual([
      "arrival_photo",
      "completion_photo",
    ]);
    expect(list.every((l) => !l.captured)).toBe(true);
  });

  it("delivery requires completion photo only", () => {
    const v = makeVisit({ serviceType: "delivery", evidenceRequired: true });
    const list = evidenceChecklist(v, []);
    expect(list.map((l) => l.type)).toEqual(["completion_photo"]);
  });

  it("evidence not required returns empty checklist", () => {
    const v = makeVisit({ evidenceRequired: false });
    expect(evidenceChecklist(v, [])).toEqual([]);
  });

  it("captured + uploaded reflected per item", () => {
    const v = makeVisit({ serviceType: "inspection", evidenceRequired: true });
    const list = evidenceChecklist(v, [
      makeEvidence({ type: "arrival_photo", uploadStatus: "uploaded" }),
      makeEvidence({ id: "e2", type: "completion_photo", uploadStatus: "queued" }),
    ]);
    expect(list[0]).toMatchObject({ type: "arrival_photo", captured: true, uploaded: true });
    expect(list[1]).toMatchObject({
      type: "completion_photo",
      captured: true,
      uploaded: false,
    });
  });
});

describe("isEvidenceComplete", () => {
  it("returns true when no evidence required", () => {
    expect(isEvidenceComplete(makeVisit({ evidenceRequired: false }), [])).toBe(
      true
    );
  });

  it("returns false when any required type is missing", () => {
    const v = makeVisit({ serviceType: "inspection", evidenceRequired: true });
    expect(
      isEvidenceComplete(v, [makeEvidence({ type: "arrival_photo" })])
    ).toBe(false);
  });

  it("returns true when all required types present", () => {
    const v = makeVisit({ serviceType: "inspection", evidenceRequired: true });
    expect(
      isEvidenceComplete(v, [
        makeEvidence({ type: "arrival_photo" }),
        makeEvidence({ id: "e2", type: "completion_photo" }),
      ])
    ).toBe(true);
  });
});

describe("missingEvidenceCount", () => {
  it("counts each missing required type", () => {
    const v = makeVisit({ serviceType: "inspection", evidenceRequired: true });
    expect(missingEvidenceCount(v, [])).toBe(2);
    expect(
      missingEvidenceCount(v, [makeEvidence({ type: "arrival_photo" })])
    ).toBe(1);
  });
});
