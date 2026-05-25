// Evidence checklist completion.

import type { EvidenceType, ServiceVisit, VisitEvidence } from "../types";

// Which evidence types are required for which service types.
// Inspection/repair/swap require both arrival + completion photos.
// Pickup/delivery require completion photo only.
function requiredEvidenceTypes(visit: ServiceVisit): EvidenceType[] {
  if (!visit.evidenceRequired) return [];
  switch (visit.serviceType) {
    case "inspection":
    case "repair":
    case "swap":
      return ["arrival_photo", "completion_photo"];
    case "pickup":
    case "delivery":
      return ["completion_photo"];
    default:
      return [];
  }
}

export function evidenceChecklist(
  visit: ServiceVisit,
  evidence: VisitEvidence[]
): { type: EvidenceType; captured: boolean; uploaded: boolean }[] {
  const required = requiredEvidenceTypes(visit);
  return required.map((type) => {
    const match = evidence.find(
      (e) => e.visitId === visit.id && e.type === type
    );
    return {
      type,
      captured: !!match,
      uploaded: match?.uploadStatus === "uploaded",
    };
  });
}

export function isEvidenceComplete(
  visit: ServiceVisit,
  evidence: VisitEvidence[]
): boolean {
  const required = requiredEvidenceTypes(visit);
  if (required.length === 0) return true;
  return required.every((type) =>
    evidence.some((e) => e.visitId === visit.id && e.type === type)
  );
}

export function missingEvidenceCount(
  visit: ServiceVisit,
  evidence: VisitEvidence[]
): number {
  const required = requiredEvidenceTypes(visit);
  let missing = 0;
  for (const type of required) {
    if (!evidence.some((e) => e.visitId === visit.id && e.type === type)) {
      missing++;
    }
  }
  return missing;
}
