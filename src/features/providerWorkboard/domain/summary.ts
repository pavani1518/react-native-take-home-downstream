// Workboard summary header derivation (§2).
// Recomputed against the *filtered* sites so it stays in sync with current view.

import type {
  ServiceSite,
  VisitEvidence,
  WorkboardSummary,
} from "../types";
import { matchesDateScope } from "./dateScope";
import { missingEvidenceCount } from "./evidence";

export function summarizeSites(
  sites: ServiceSite[],
  evidence: VisitEvidence[],
  now: Date
): WorkboardSummary {
  let visitsDueToday = 0;
  let blockedVisits = 0;
  let urgentSites = 0;
  let visitsMissingEvidence = 0;

  for (const site of sites) {
    if (site.priority === "urgent") urgentSites++;
    for (const v of site.visits) {
      if (matchesDateScope(v, "today", now)) visitsDueToday++;
      if (v.status === "blocked") blockedVisits++;
      if (v.evidenceRequired && missingEvidenceCount(v, evidence) > 0) {
        visitsMissingEvidence++;
      }
    }
  }

  let failedOrQueuedUploads = 0;
  for (const e of evidence) {
    if (e.uploadStatus === "failed" || e.uploadStatus === "queued") {
      // Only count uploads belonging to a visit in the current filtered set.
      const visitInScope = sites.some((s) =>
        s.visits.some((v) => v.id === e.visitId)
      );
      if (visitInScope) failedOrQueuedUploads++;
    }
  }

  return {
    totalSites: sites.length,
    visitsDueToday,
    blockedVisits,
    urgentSites,
    visitsMissingEvidence,
    failedOrQueuedUploads,
  };
}
