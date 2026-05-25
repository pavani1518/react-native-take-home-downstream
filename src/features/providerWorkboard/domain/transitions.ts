// Visit status transition table. Used by action eligibility + mutations.

import type { VisitActionId, VisitStatus } from "../types";

// Allowed source statuses for each action. Spec §5:
// - "Complete visit should not be available for a cancelled visit"
// - "Mark en route should not be available after completion"

const ALLOWED_FROM: Record<VisitActionId, VisitStatus[]> = {
  mark_en_route: ["scheduled", "confirmed"],
  complete_visit: ["en_route", "on_site", "scheduled", "confirmed"],
  report_blocked: ["scheduled", "confirmed", "en_route", "on_site"],
  retry_failed_upload: [
    // Retry uploads applies to evidence on any visit not yet cancelled.
    "scheduled",
    "confirmed",
    "en_route",
    "on_site",
    "blocked",
    "completed",
  ],
};

export function isTransitionAllowed(
  current: VisitStatus,
  action: VisitActionId
): boolean {
  return ALLOWED_FROM[action].includes(current);
}

// Target status after a successful action. Retry-upload doesn't change status.
const NEXT_STATUS: Partial<Record<VisitActionId, VisitStatus>> = {
  mark_en_route: "en_route",
  complete_visit: "completed",
  report_blocked: "blocked",
};

export function nextStatus(
  current: VisitStatus,
  action: VisitActionId
): VisitStatus {
  if (!isTransitionAllowed(current, action)) return current;
  const next = NEXT_STATUS[action];
  return next ?? current;
}
