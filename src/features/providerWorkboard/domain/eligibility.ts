// Visit action eligibility — returns enabled flag + reason per action.
// Keep eligibility centralized (spec weak-signal: avoid scattered conditionals).

import type {
  AssetScan,
  EligibleAction,
  MotionSample,
  ServiceVisit,
  VisitActionId,
  VisitEvidence,
} from "../types";
import { canComplete } from "./completion";
import { isTransitionAllowed } from "./transitions";

const ALL_ACTIONS: VisitActionId[] = [
  "mark_en_route",
  "complete_visit",
  "report_blocked",
  "retry_failed_upload",
];

export function getEligibleActions(
  visit: ServiceVisit,
  evidence: VisitEvidence[],
  scan: AssetScan | undefined,
  motion: MotionSample | undefined
): EligibleAction[] {
  return ALL_ACTIONS.map((id) => evaluateAction(id, visit, evidence, scan, motion));
}

function evaluateAction(
  id: VisitActionId,
  visit: ServiceVisit,
  evidence: VisitEvidence[],
  scan: AssetScan | undefined,
  motion: MotionSample | undefined
): EligibleAction {
  if (!isTransitionAllowed(visit.status, id)) {
    return { id, enabled: false, reason: reasonForStatus(visit.status, id) };
  }

  if (id === "complete_visit") {
    const readiness = canComplete(visit, evidence, scan, motion);
    if (!readiness.ready) {
      return {
        id,
        enabled: false,
        reason: reasonForBlocker(readiness.blockers[0]),
      };
    }
  }

  if (id === "retry_failed_upload") {
    const hasFailed = evidence.some(
      (e) => e.visitId === visit.id && e.uploadStatus === "failed"
    );
    if (!hasFailed) {
      return {
        id,
        enabled: false,
        reason: "No failed uploads to retry",
      };
    }
  }

  return { id, enabled: true };
}

function reasonForStatus(status: ServiceVisit["status"], action: VisitActionId): string {
  if (action === "mark_en_route" && status === "completed") {
    return "Visit is already completed";
  }
  if (action === "complete_visit" && status === "cancelled") {
    return "Cannot complete a cancelled visit";
  }
  if (action === "complete_visit" && status === "completed") {
    return "Visit is already completed";
  }
  if (action === "report_blocked" && status === "cancelled") {
    return "Cannot block a cancelled visit";
  }
  if (action === "report_blocked" && status === "completed") {
    return "Cannot block a completed visit";
  }
  return `Action not available for status: ${status}`;
}

function reasonForBlocker(b: string | undefined): string {
  switch (b) {
    case "evidence_missing":
      return "Capture required evidence first";
    case "scan_missing":
      return "Scan the asset code first";
    case "scan_mismatch":
      return "Scanned asset does not match expected";
    case "motion_missing":
      return "Run motion check first";
    case "motion_rough":
      return "Rough motion detected — recheck handling";
    case "status_invalid":
      return "Visit status does not allow completion";
    default:
      return "Not ready to complete";
  }
}
