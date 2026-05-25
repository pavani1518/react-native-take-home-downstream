// Domain types — verbatim from the take-home spec data model.
// Pure types only. No React / React Native imports.

export type WorkStatus =
  | "needs_attention"
  | "scheduled"
  | "in_progress"
  | "blocked"
  | "completed";

export type VisitStatus =
  | "scheduled"
  | "confirmed"
  | "en_route"
  | "on_site"
  | "blocked"
  | "completed"
  | "cancelled";

export type ServiceType =
  | "inspection"
  | "repair"
  | "swap"
  | "pickup"
  | "delivery";

export type Priority = "normal" | "high" | "urgent";

export type EvidenceType =
  | "arrival_photo"
  | "completion_photo"
  | "damage_photo";

export type UploadStatus = "queued" | "uploading" | "uploaded" | "failed";

export type ScanResult = "match" | "mismatch";

export type MotionResult = "stable" | "rough_motion_detected";

export type ServiceVisit = {
  id: string;
  siteId: string;
  status: VisitStatus;
  serviceType: ServiceType;
  scheduledStart: string;
  scheduledEnd: string;
  assignedTech?: string;
  equipmentLabel: string;
  expectedAssetCode: string;
  evidenceRequired: boolean;
  motionCheckRequired: boolean;
  locationRequired: boolean;
  issueSummary?: string;
  blockedReason?: string;
  lastUpdatedAt: string;
};

export type VisitEvidence = {
  id: string;
  visitId: string;
  type: EvidenceType;
  localUri: string;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
  uploadStatus: UploadStatus;
};

export type AssetScan = {
  visitId: string;
  expectedAssetCode: string;
  scannedAssetCode: string;
  result: ScanResult;
  scannedAt: string;
};

export type MotionSample = {
  visitId: string;
  startedAt: string;
  completedAt: string;
  maxAccelerationG: number;
  result: MotionResult;
};

export type SiteAddress = {
  line1: string;
  city: string;
  region: string;
  postalCode: string;
};

export type ServiceSite = {
  id: string;
  customerName: string;
  siteName: string;
  address: SiteAddress;
  workStatus: WorkStatus;
  priority: Priority;
  visits: ServiceVisit[];
  contactName: string;
  contactPhone: string;
};

// Filter + summary types used by domain + UI.

export type DateScope = "today" | "next_7_days" | "all";

export type EvidenceFilter =
  | "missing_proof"
  | "scan_mismatch"
  | "ready_to_complete";

export type WorkboardFilters = {
  query: string;
  statuses: WorkStatus[];
  dateScope: DateScope;
  evidence: EvidenceFilter | null;
};

export type WorkboardSummary = {
  totalSites: number;
  visitsDueToday: number;
  blockedVisits: number;
  urgentSites: number;
  visitsMissingEvidence: number;
  failedOrQueuedUploads: number;
};

// Action ids used by §5. Each is from the doc's example list.
export type VisitActionId =
  | "mark_en_route"
  | "complete_visit"
  | "report_blocked"
  | "retry_failed_upload";

export type EligibleAction = {
  id: VisitActionId;
  enabled: boolean;
  reason?: string;
};
