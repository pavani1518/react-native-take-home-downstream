// Domain barrel — pure logic only. No React/RN imports anywhere below.

export {
  matchesDateScope,
  siteHasVisitInScope,
} from "./dateScope";
export {
  filterSites,
  visitStatusCounts,
  nextVisit,
  siteMissingEvidenceCount,
  isSiteLate,
} from "./filters";
export { summarizeSites } from "./summary";
export { getEligibleActions } from "./eligibility";
export { isTransitionAllowed, nextStatus } from "./transitions";
export { statusSentence } from "./statusSentence";
export {
  evidenceChecklist,
  isEvidenceComplete,
  missingEvidenceCount,
} from "./evidence";
export { classifyScan } from "./scan";
export {
  classifyMotion,
  magnitude,
  maxAccelerationG,
  ROUGH_MOTION_THRESHOLD_G,
} from "./motion";
export type { AccelSample } from "./motion";
export { canComplete } from "./completion";
export type { CompletionBlocker, CompletionReadiness } from "./completion";
