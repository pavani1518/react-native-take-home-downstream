// Deterministic seed: ≥20 sites, ≥60 visits, across mixed statuses,
// dates, priorities, hardware requirements, and edge cases
// (overdue, blocked, cancelled, scan-mismatch-target, missing proof).

import type {
  AssetScan,
  MotionSample,
  Priority,
  ServiceSite,
  ServiceType,
  ServiceVisit,
  VisitEvidence,
  VisitStatus,
  WorkStatus,
} from "../types";

const CUSTOMERS = [
  "Northwind Logistics",
  "Acme Cold Storage",
  "Pioneer Grocers",
  "Crestline Hospitals",
  "Harbor Foods",
  "Bluebird Transit",
  "Summit Pharmacies",
  "Riverside Bakeries",
  "Coastal Brewing",
  "Lighthouse Labs",
];

const SITES_PER_CUSTOMER = [
  ["Distribution Center 1", "Distribution Center 2"],
  ["Refrigeration Hub A", "Refrigeration Hub B"],
  ["Store #418", "Store #520"],
  ["Wing C Imaging", "Wing D Pharmacy"],
  ["Warehouse 7", "Cold Room 3"],
  ["Depot North", "Depot South"],
  ["Storefront East", "Storefront West"],
  ["Bakery Line 1", "Bakery Line 2"],
  ["Brewhouse 1", "Brewhouse 2"],
  ["Lab Wing 4", "Lab Wing 5"],
];

const REGIONS = [
  { city: "Austin", region: "TX", postal: "78701" },
  { city: "Seattle", region: "WA", postal: "98101" },
  { city: "Denver", region: "CO", postal: "80202" },
  { city: "Boston", region: "MA", postal: "02108" },
  { city: "Atlanta", region: "GA", postal: "30303" },
];

const EQUIPMENT = [
  { label: "Walk-in Cooler #A12", code: "ASSET-CL-A12" },
  { label: "Pallet Jack #PJ-204", code: "ASSET-PJ-204" },
  { label: "Reach Truck #RT-77", code: "ASSET-RT-77" },
  { label: "Bakery Oven #BO-3", code: "ASSET-BO-3" },
  { label: "Brewhouse Tank #BT-5", code: "ASSET-BT-5" },
  { label: "MRI Scanner #MR-1", code: "ASSET-MR-1" },
  { label: "Pharmacy Robot #PR-9", code: "ASSET-PR-9" },
  { label: "Conveyor Belt #CB-12", code: "ASSET-CB-12" },
];

const SERVICE_TYPES: ServiceType[] = [
  "inspection",
  "repair",
  "swap",
  "pickup",
  "delivery",
];

const PRIORITIES: Priority[] = ["normal", "normal", "normal", "high", "urgent"];

// Determinism: fixed reference "now" so seed is stable across runs and tests.
// The runtime "today" can still be different; this only controls *generated* dates.
const NOW_REF_ISO = "2026-05-24T15:00:00.000Z";
const NOW = new Date(NOW_REF_ISO);

function isoOffset(daysFromNow: number, hours: number, minutes = 0): string {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  d.setUTCHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function pick<T>(arr: readonly T[], i: number): T {
  const v = arr[i % arr.length];
  if (v === undefined) {
    throw new Error("pick(): empty array");
  }
  return v;
}

type VisitSpec = {
  dayOffset: number;
  startHour: number;
  duration: number;
  status: VisitStatus;
  evidenceRequired: boolean;
  motionCheckRequired: boolean;
  locationRequired: boolean;
  issueSummary?: string;
  blockedReason?: string;
};

// Visit pattern templates — each site picks one + variations.
const PATTERNS: VisitSpec[][] = [
  // 0: standard — today scheduled + future inspection + repair
  [
    {
      dayOffset: 0,
      startHour: 14,
      duration: 1,
      status: "scheduled",
      evidenceRequired: true,
      motionCheckRequired: false,
      locationRequired: true,
    },
    {
      dayOffset: 3,
      startHour: 10,
      duration: 2,
      status: "scheduled",
      evidenceRequired: false,
      motionCheckRequired: false,
      locationRequired: false,
    },
    {
      dayOffset: 6,
      startHour: 9,
      duration: 1,
      status: "scheduled",
      evidenceRequired: true,
      motionCheckRequired: true,
      locationRequired: false,
    },
  ],
  // 1: in progress with on_site + future + completed
  [
    {
      dayOffset: 0,
      startHour: 9,
      duration: 2,
      status: "on_site",
      evidenceRequired: true,
      motionCheckRequired: true,
      locationRequired: true,
    },
    {
      dayOffset: 5,
      startHour: 13,
      duration: 1,
      status: "scheduled",
      evidenceRequired: true,
      motionCheckRequired: false,
      locationRequired: false,
    },
    {
      dayOffset: -3,
      startHour: 11,
      duration: 1,
      status: "completed",
      evidenceRequired: true,
      motionCheckRequired: false,
      locationRequired: true,
    },
  ],
  // 2: blocked + scheduled + scheduled w/ scan-mismatch target
  [
    {
      dayOffset: 0,
      startHour: 11,
      duration: 1,
      status: "blocked",
      evidenceRequired: true,
      motionCheckRequired: false,
      locationRequired: false,
      blockedReason: "Customer site closed for inventory audit",
    },
    {
      dayOffset: 4,
      startHour: 15,
      duration: 1,
      status: "scheduled",
      evidenceRequired: false,
      motionCheckRequired: false,
      locationRequired: false,
    },
    {
      dayOffset: 1,
      startHour: 10,
      duration: 1,
      status: "scheduled",
      evidenceRequired: true,
      motionCheckRequired: true,
      locationRequired: true,
    },
  ],
  // 3: overdue + cancelled + scheduled
  [
    {
      dayOffset: -1,
      startHour: 10,
      duration: 1,
      status: "scheduled",
      evidenceRequired: true,
      motionCheckRequired: true,
      locationRequired: true,
      issueSummary: "Overdue: tech did not arrive yesterday",
    },
    {
      dayOffset: 6,
      startHour: 9,
      duration: 1,
      status: "cancelled",
      evidenceRequired: false,
      motionCheckRequired: false,
      locationRequired: false,
    },
    {
      dayOffset: 2,
      startHour: 14,
      duration: 1,
      status: "scheduled",
      evidenceRequired: true,
      motionCheckRequired: false,
      locationRequired: false,
    },
  ],
  // 4: completed + future swap + scheduled
  [
    {
      dayOffset: -2,
      startHour: 8,
      duration: 2,
      status: "completed",
      evidenceRequired: true,
      motionCheckRequired: true,
      locationRequired: true,
    },
    {
      dayOffset: 2,
      startHour: 12,
      duration: 1,
      status: "scheduled",
      evidenceRequired: true,
      motionCheckRequired: false,
      locationRequired: true,
    },
    {
      dayOffset: 7,
      startHour: 9,
      duration: 1,
      status: "scheduled",
      evidenceRequired: false,
      motionCheckRequired: false,
      locationRequired: false,
    },
  ],
  // 5: confirmed + en_route — busy day
  [
    {
      dayOffset: 0,
      startHour: 8,
      duration: 1,
      status: "confirmed",
      evidenceRequired: false,
      motionCheckRequired: false,
      locationRequired: false,
    },
    {
      dayOffset: 0,
      startHour: 12,
      duration: 1,
      status: "en_route",
      evidenceRequired: true,
      motionCheckRequired: true,
      locationRequired: true,
    },
    {
      dayOffset: 1,
      startHour: 10,
      duration: 1,
      status: "scheduled",
      evidenceRequired: true,
      motionCheckRequired: false,
      locationRequired: false,
    },
  ],
  // 6: all-completed site so the "completed" workStatus filter has results
  [
    {
      dayOffset: -4,
      startHour: 8,
      duration: 2,
      status: "completed",
      evidenceRequired: true,
      motionCheckRequired: false,
      locationRequired: true,
    },
    {
      dayOffset: -3,
      startHour: 13,
      duration: 1,
      status: "completed",
      evidenceRequired: true,
      motionCheckRequired: true,
      locationRequired: true,
    },
    {
      dayOffset: -2,
      startHour: 10,
      duration: 1,
      status: "cancelled",
      evidenceRequired: false,
      motionCheckRequired: false,
      locationRequired: false,
    },
  ],
];

function workStatusFromVisits(visits: ServiceVisit[]): WorkStatus {
  const hasBlocked = visits.some((v) => v.status === "blocked");
  if (hasBlocked) return "blocked";
  const hasInProgress = visits.some(
    (v) => v.status === "en_route" || v.status === "on_site"
  );
  if (hasInProgress) return "in_progress";
  const allComplete = visits.every(
    (v) => v.status === "completed" || v.status === "cancelled"
  );
  if (allComplete && visits.length > 0) return "completed";
  const hasOverdue = visits.some((v) => {
    if (v.status === "completed" || v.status === "cancelled") return false;
    return new Date(v.scheduledEnd).getTime() < NOW.getTime();
  });
  if (hasOverdue) return "needs_attention";
  return "scheduled";
}

export function buildSeed(): {
  sites: ServiceSite[];
  evidence: VisitEvidence[];
  scans: AssetScan[];
  motion: MotionSample[];
} {
  const sites: ServiceSite[] = [];
  const evidence: VisitEvidence[] = [];
  const scans: AssetScan[] = [];
  const motion: MotionSample[] = [];

  let siteIndex = 0;
  let visitIndex = 0;

  for (let custIdx = 0; custIdx < CUSTOMERS.length; custIdx++) {
    const customer = pick(CUSTOMERS, custIdx);
    const siteNames = pick(SITES_PER_CUSTOMER, custIdx);
    for (let s = 0; s < siteNames.length; s++) {
      const siteName = pick(siteNames, s);
      const region = pick(REGIONS, siteIndex);
      const priority = pick(PRIORITIES, siteIndex);
      const pattern = pick(PATTERNS, siteIndex);

      const visits: ServiceVisit[] = pattern.map((spec, k) => {
        const equipment = pick(EQUIPMENT, visitIndex);
        const serviceType = pick(SERVICE_TYPES, visitIndex);
        const id = `visit-${visitIndex}`;
        visitIndex++;
        const visit: ServiceVisit = {
          id,
          siteId: `site-${siteIndex}`,
          status: spec.status,
          serviceType,
          scheduledStart: isoOffset(spec.dayOffset, spec.startHour, 0),
          scheduledEnd: isoOffset(
            spec.dayOffset,
            spec.startHour + spec.duration,
            0
          ),
          assignedTech: k === 0 ? "Tech Alex" : undefined,
          equipmentLabel: equipment.label,
          expectedAssetCode: equipment.code,
          evidenceRequired: spec.evidenceRequired,
          motionCheckRequired: spec.motionCheckRequired,
          locationRequired: spec.locationRequired,
          issueSummary: spec.issueSummary,
          blockedReason: spec.blockedReason,
          lastUpdatedAt: isoOffset(spec.dayOffset, spec.startHour, 30),
        };

        // Pre-existing evidence for completed visits so completion is realistic.
        if (spec.status === "completed" && spec.evidenceRequired) {
          evidence.push({
            id: `ev-${id}-arr`,
            visitId: id,
            type: "arrival_photo",
            localUri: `mock://photo/${id}/arrival.jpg`,
            capturedAt: isoOffset(spec.dayOffset, spec.startHour, 5),
            latitude: 30.27,
            longitude: -97.74,
            uploadStatus: "uploaded",
          });
          evidence.push({
            id: `ev-${id}-comp`,
            visitId: id,
            type: "completion_photo",
            localUri: `mock://photo/${id}/completion.jpg`,
            capturedAt: isoOffset(
              spec.dayOffset,
              spec.startHour + spec.duration,
              -10
            ),
            latitude: 30.27,
            longitude: -97.74,
            uploadStatus: "uploaded",
          });
          scans.push({
            visitId: id,
            expectedAssetCode: equipment.code,
            scannedAssetCode: equipment.code,
            result: "match",
            scannedAt: isoOffset(spec.dayOffset, spec.startHour, 10),
          });
          if (spec.motionCheckRequired) {
            motion.push({
              visitId: id,
              startedAt: isoOffset(spec.dayOffset, spec.startHour, 15),
              completedAt: isoOffset(spec.dayOffset, spec.startHour, 15),
              maxAccelerationG: 0.6,
              result: "stable",
            });
          }
        }

        // One scan mismatch on a site so the filter has data.
        if (siteIndex === 2 && k === 0) {
          scans.push({
            visitId: id,
            expectedAssetCode: equipment.code,
            scannedAssetCode: "ASSET-WRONG-001",
            result: "mismatch",
            scannedAt: isoOffset(spec.dayOffset, spec.startHour, 20),
          });
        }

        // One failed upload so retry-queue surface has data.
        if (siteIndex === 4 && k === 0 && spec.evidenceRequired) {
          evidence.push({
            id: `ev-${id}-failed`,
            visitId: id,
            type: "arrival_photo",
            localUri: `mock://photo/${id}/arrival.jpg`,
            capturedAt: isoOffset(spec.dayOffset, spec.startHour, 5),
            uploadStatus: "failed",
          });
        }

        return visit;
      });

      sites.push({
        id: `site-${siteIndex}`,
        customerName: customer,
        siteName,
        address: {
          line1: `${100 + siteIndex} Industrial Way`,
          city: region.city,
          region: region.region,
          postalCode: region.postal,
        },
        workStatus: workStatusFromVisits(visits),
        priority,
        visits,
        contactName: `Site Contact ${siteIndex + 1}`,
        contactPhone: `+1-555-01${String(siteIndex).padStart(2, "0")}`,
      });

      siteIndex++;
    }
  }

  return { sites, evidence, scans, motion };
}

export const SEED_NOW_ISO = NOW_REF_ISO;
