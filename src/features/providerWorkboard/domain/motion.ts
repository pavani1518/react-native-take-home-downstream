// Motion sample classification from accelerometer readings.

import type { MotionResult } from "../types";

// Per §8: derive a maxAccelerationG (or similar). Threshold-based classification.
// 1G is normal gravity. Any spike noticeably above 1G in any axis indicates
// rough handling. Threshold chosen as 1.4G for the simulated stability check.
export const ROUGH_MOTION_THRESHOLD_G = 1.4;

export type AccelSample = { x: number; y: number; z: number };

// Compute the magnitude of an accelerometer reading.
export function magnitude(s: AccelSample): number {
  return Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z);
}

// Reduce a list of samples to the max magnitude observed.
export function maxAccelerationG(samples: AccelSample[]): number {
  let max = 0;
  for (const s of samples) {
    const m = magnitude(s);
    if (m > max) max = m;
  }
  return max;
}

// Classify a motion check by its maximum acceleration in G.
export function classifyMotion(maxG: number): MotionResult {
  return maxG >= ROUGH_MOTION_THRESHOLD_G
    ? "rough_motion_detected"
    : "stable";
}
