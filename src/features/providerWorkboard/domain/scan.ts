// Asset scan classification.

import type { ScanResult } from "../types";

export function classifyScan(
  expected: string,
  scanned: string
): ScanResult {
  return expected.trim() === scanned.trim() ? "match" : "mismatch";
}
