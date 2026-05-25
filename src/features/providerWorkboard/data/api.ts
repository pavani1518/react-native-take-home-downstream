// Mocked async resource layer.
// Imitates an API boundary that will later be replaced with real HTTP.
// Each function returns a Promise with artificial latency and a tunable
// failure probability so loading/error/retry states can be exercised.

import type {
  AssetScan,
  EvidenceType,
  MotionResult,
  MotionSample,
  ScanResult,
  ServiceSite,
  ServiceVisit,
  UploadStatus,
  VisitActionId,
  VisitEvidence,
  VisitStatus,
} from "../types";
import { buildSeed } from "./seed";

const MIN_LATENCY_MS = 250;
const MAX_LATENCY_MS = 700;

// Toggle these to exercise failure paths during dev.
export const FAILURE_RATES = {
  fetchSites: 0,
  mutateVisit: 0.15,
  uploadEvidence: 0.5, // higher so retry queue has work to do
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function latency(): number {
  return (
    MIN_LATENCY_MS + Math.floor(Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS))
  );
}

function rollFailure(rate: number): boolean {
  return Math.random() < rate;
}

// In-memory store seeded once. The mocked mutations write back here so
// summaries refresh after an action.
type Store = {
  sites: ServiceSite[];
  evidence: VisitEvidence[];
  scans: AssetScan[];
  motion: MotionSample[];
};

let store: Store | null = null;

function ensureStore(): Store {
  if (!store) {
    const seed = buildSeed();
    store = {
      sites: seed.sites,
      evidence: seed.evidence,
      scans: seed.scans,
      motion: seed.motion,
    };
  }
  return store;
}

export async function fetchSites(): Promise<ServiceSite[]> {
  await sleep(latency());
  if (rollFailure(FAILURE_RATES.fetchSites)) {
    throw new Error("Failed to fetch sites");
  }
  const s = ensureStore();
  // Deep-clone to mimic network boundary.
  return JSON.parse(JSON.stringify(s.sites)) as ServiceSite[];
}

export async function fetchEvidence(): Promise<VisitEvidence[]> {
  await sleep(latency());
  const s = ensureStore();
  return JSON.parse(JSON.stringify(s.evidence)) as VisitEvidence[];
}

export async function fetchScans(): Promise<AssetScan[]> {
  await sleep(latency());
  const s = ensureStore();
  return JSON.parse(JSON.stringify(s.scans)) as AssetScan[];
}

export async function fetchMotion(): Promise<MotionSample[]> {
  await sleep(latency());
  const s = ensureStore();
  return JSON.parse(JSON.stringify(s.motion)) as MotionSample[];
}

// Visit action mutation. Returns the updated visit on success.
export type MutateVisitArgs = {
  visitId: string;
  action: VisitActionId;
  blockedReason?: string;
};

const NEXT_STATUS: Partial<Record<VisitActionId, VisitStatus>> = {
  mark_en_route: "en_route",
  complete_visit: "completed",
  report_blocked: "blocked",
};

export async function mutateVisit(args: MutateVisitArgs): Promise<ServiceVisit> {
  await sleep(latency());
  if (rollFailure(FAILURE_RATES.mutateVisit)) {
    throw new Error("Mutation failed — please retry");
  }
  const s = ensureStore();
  let updated: ServiceVisit | null = null;
  for (const site of s.sites) {
    for (let i = 0; i < site.visits.length; i++) {
      const v = site.visits[i];
      if (v && v.id === args.visitId) {
        const next = NEXT_STATUS[args.action];
        const newVisit: ServiceVisit = {
          ...v,
          status: next ?? v.status,
          blockedReason:
            args.action === "report_blocked"
              ? args.blockedReason ?? v.blockedReason
              : v.blockedReason,
          lastUpdatedAt: new Date().toISOString(),
        };
        site.visits[i] = newVisit;
        updated = newVisit;
        break;
      }
    }
    if (updated) break;
  }
  if (!updated) throw new Error("Visit not found");
  return JSON.parse(JSON.stringify(updated)) as ServiceVisit;
}

// Save evidence locally with a queued upload state. Returns the persisted record.
export type SaveEvidenceArgs = {
  visitId: string;
  type: EvidenceType;
  localUri: string;
  latitude?: number;
  longitude?: number;
};

export async function saveEvidenceLocal(
  args: SaveEvidenceArgs
): Promise<VisitEvidence> {
  await sleep(latency());
  const s = ensureStore();
  const record: VisitEvidence = {
    id: `ev-${args.visitId}-${Date.now()}`,
    visitId: args.visitId,
    type: args.type,
    localUri: args.localUri,
    capturedAt: new Date().toISOString(),
    latitude: args.latitude,
    longitude: args.longitude,
    uploadStatus: "queued",
  };
  s.evidence.push(record);
  return JSON.parse(JSON.stringify(record)) as VisitEvidence;
}

// Simulate upload. Updates upload status in-place. Throws on failure.
export async function uploadEvidence(evidenceId: string): Promise<UploadStatus> {
  await sleep(latency());
  const s = ensureStore();
  const ev = s.evidence.find((e) => e.id === evidenceId);
  if (!ev) throw new Error("Evidence not found");
  if (rollFailure(FAILURE_RATES.uploadEvidence)) {
    ev.uploadStatus = "failed";
    throw new Error("Upload failed");
  }
  ev.uploadStatus = "uploaded";
  return "uploaded";
}

// Record a scan attempt.
export async function recordScan(args: {
  visitId: string;
  expectedAssetCode: string;
  scannedAssetCode: string;
  result: ScanResult;
}): Promise<AssetScan> {
  await sleep(latency());
  const s = ensureStore();
  const record: AssetScan = {
    visitId: args.visitId,
    expectedAssetCode: args.expectedAssetCode,
    scannedAssetCode: args.scannedAssetCode,
    result: args.result,
    scannedAt: new Date().toISOString(),
  };
  const existing = s.scans.findIndex((sc) => sc.visitId === args.visitId);
  if (existing >= 0) {
    s.scans[existing] = record;
  } else {
    s.scans.push(record);
  }
  return JSON.parse(JSON.stringify(record)) as AssetScan;
}

// Record a motion check result.
export async function recordMotion(args: {
  visitId: string;
  startedAt: string;
  completedAt: string;
  maxAccelerationG: number;
  result: MotionResult;
}): Promise<MotionSample> {
  await sleep(latency());
  const s = ensureStore();
  const record: MotionSample = { ...args };
  const existing = s.motion.findIndex((m) => m.visitId === args.visitId);
  if (existing >= 0) {
    s.motion[existing] = record;
  } else {
    s.motion.push(record);
  }
  return JSON.parse(JSON.stringify(record)) as MotionSample;
}

// Test seam: reset store between tests if used.
export function __resetStoreForTests(): void {
  store = null;
}
