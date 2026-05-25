// §14: Scan mismatch behavior; motion classification thresholds.

import { classifyScan } from "../scan";
import {
  classifyMotion,
  magnitude,
  maxAccelerationG,
  ROUGH_MOTION_THRESHOLD_G,
} from "../motion";

describe("classifyScan", () => {
  it("returns match for exact equality", () => {
    expect(classifyScan("ASSET-1", "ASSET-1")).toBe("match");
  });

  it("trims whitespace before comparing", () => {
    expect(classifyScan(" ASSET-1 ", "ASSET-1")).toBe("match");
  });

  it("returns mismatch for any difference", () => {
    expect(classifyScan("ASSET-1", "ASSET-2")).toBe("mismatch");
    expect(classifyScan("ASSET-1", "asset-1")).toBe("mismatch");
  });
});

describe("classifyMotion + magnitude + maxAccelerationG", () => {
  it("magnitude of (1,0,0) = 1", () => {
    expect(magnitude({ x: 1, y: 0, z: 0 })).toBeCloseTo(1);
  });

  it("magnitude of (1,1,1) ≈ sqrt(3)", () => {
    expect(magnitude({ x: 1, y: 1, z: 1 })).toBeCloseTo(Math.sqrt(3));
  });

  it("maxAccelerationG picks the highest magnitude in a series", () => {
    expect(
      maxAccelerationG([
        { x: 0.1, y: 0.1, z: 1 },
        { x: 2, y: 0, z: 0 },
        { x: 0.5, y: 0.5, z: 0.5 },
      ])
    ).toBeCloseTo(2);
  });

  it("classifies below threshold as stable", () => {
    expect(classifyMotion(ROUGH_MOTION_THRESHOLD_G - 0.01)).toBe("stable");
  });

  it("classifies at or above threshold as rough", () => {
    expect(classifyMotion(ROUGH_MOTION_THRESHOLD_G)).toBe(
      "rough_motion_detected"
    );
    expect(classifyMotion(ROUGH_MOTION_THRESHOLD_G + 1)).toBe(
      "rough_motion_detected"
    );
  });
});
