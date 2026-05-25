// Completion readiness from status, evidence, scan, and motion state.

import type {
  AssetScan,
  MotionSample,
  ServiceVisit,
  VisitEvidence,
} from "../types";
import { isEvidenceComplete } from "./evidence";

export type CompletionBlocker =
  | "evidence_missing"
  | "scan_missing"
  | "scan_mismatch"
  | "motion_missing"
  | "motion_rough"
  | "status_invalid";

export type CompletionReadiness = {
  ready: boolean;
  blockers: CompletionBlocker[];
};

export function canComplete(
  visit: ServiceVisit,
  evidence: VisitEvidence[],
  scan: AssetScan | undefined,
  motion: MotionSample | undefined
): CompletionReadiness {
  const blockers: CompletionBlocker[] = [];

  if (visit.status === "cancelled" || visit.status === "completed") {
    blockers.push("status_invalid");
  }

  if (visit.evidenceRequired && !isEvidenceComplete(visit, evidence)) {
    blockers.push("evidence_missing");
  }

  if (visit.expectedAssetCode) {
    if (!scan) {
      blockers.push("scan_missing");
    } else if (scan.result === "mismatch") {
      blockers.push("scan_mismatch");
    }
  }

  if (visit.motionCheckRequired) {
    if (!motion) {
      blockers.push("motion_missing");
    } else if (motion.result === "rough_motion_detected") {
      blockers.push("motion_rough");
    }
  }

  return { ready: blockers.length === 0, blockers };
}
