import type {
  AssetScan,
  MotionSample,
  ServiceSite,
  ServiceVisit,
  VisitEvidence,
} from "../../types";

export const NOW = new Date("2026-05-24T15:00:00.000Z");

export function makeVisit(p: Partial<ServiceVisit> = {}): ServiceVisit {
  return {
    id: "v1",
    siteId: "s1",
    status: "scheduled",
    serviceType: "inspection",
    scheduledStart: "2026-05-24T14:00:00.000Z",
    scheduledEnd: "2026-05-24T15:00:00.000Z",
    equipmentLabel: "Walk-in Cooler #A12",
    expectedAssetCode: "ASSET-CL-A12",
    evidenceRequired: true,
    motionCheckRequired: false,
    locationRequired: false,
    lastUpdatedAt: "2026-05-24T14:00:00.000Z",
    ...p,
  };
}

export function makeSite(p: Partial<ServiceSite> = {}): ServiceSite {
  const visits = p.visits ?? [makeVisit()];
  return {
    id: "s1",
    customerName: "Acme Cold Storage",
    siteName: "Refrigeration Hub A",
    address: {
      line1: "100 Industrial Way",
      city: "Austin",
      region: "TX",
      postalCode: "78701",
    },
    workStatus: "scheduled",
    priority: "normal",
    visits,
    contactName: "Site Contact",
    contactPhone: "+1-555-0100",
    ...p,
  };
}

export function makeEvidence(p: Partial<VisitEvidence> = {}): VisitEvidence {
  return {
    id: "e1",
    visitId: "v1",
    type: "arrival_photo",
    localUri: "mock://x",
    capturedAt: "2026-05-24T14:00:00.000Z",
    uploadStatus: "uploaded",
    ...p,
  };
}

export function makeScan(p: Partial<AssetScan> = {}): AssetScan {
  return {
    visitId: "v1",
    expectedAssetCode: "ASSET-CL-A12",
    scannedAssetCode: "ASSET-CL-A12",
    result: "match",
    scannedAt: "2026-05-24T14:05:00.000Z",
    ...p,
  };
}

export function makeMotion(p: Partial<MotionSample> = {}): MotionSample {
  return {
    visitId: "v1",
    startedAt: "2026-05-24T14:10:00.000Z",
    completedAt: "2026-05-24T14:10:04.000Z",
    maxAccelerationG: 0.6,
    result: "stable",
    ...p,
  };
}
