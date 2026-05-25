// Filtering and searching sites (§13, §1).

import type {
  AssetScan,
  EvidenceFilter,
  ServiceSite,
  ServiceVisit,
  VisitEvidence,
  WorkboardFilters,
  WorkStatus,
} from "../types";
import { siteHasVisitInScope } from "./dateScope";
import { canComplete } from "./completion";
import { missingEvidenceCount } from "./evidence";

// §1: Text search across site name, customer name, address, and equipment labels.
function matchesQuery(site: ServiceSite, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (site.siteName.toLowerCase().includes(q)) return true;
  if (site.customerName.toLowerCase().includes(q)) return true;
  const addr = `${site.address.line1} ${site.address.city} ${site.address.region} ${site.address.postalCode}`.toLowerCase();
  if (addr.includes(q)) return true;
  if (site.visits.some((v) => v.equipmentLabel.toLowerCase().includes(q))) {
    return true;
  }
  return false;
}

function matchesStatus(site: ServiceSite, statuses: WorkStatus[]): boolean {
  if (statuses.length === 0) return true;
  return statuses.includes(site.workStatus);
}

function matchesEvidence(
  site: ServiceSite,
  filter: EvidenceFilter | null,
  evidence: VisitEvidence[],
  scans: AssetScan[]
): boolean {
  if (!filter) return true;
  if (filter === "missing_proof") {
    return site.visits.some(
      (v) => v.evidenceRequired && missingEvidenceCount(v, evidence) > 0
    );
  }
  if (filter === "scan_mismatch") {
    return scans.some(
      (s) => s.result === "mismatch" && site.visits.some((v) => v.id === s.visitId)
    );
  }
  // ready_to_complete: at least one visit that passes canComplete and is not yet done.
  return site.visits.some((v) => {
    if (v.status === "completed" || v.status === "cancelled") return false;
    const scan = scans.find((s) => s.visitId === v.id);
    // Motion + evidence are passed via the same lookups used elsewhere; we
    // only need the readiness check to consider what's already captured.
    const readiness = canComplete(v, evidence, scan, undefined);
    // If motion is required, "ready to complete" still depends on motion result
    // being captured. Treat missing motion as not-ready.
    if (v.motionCheckRequired) {
      return false;
    }
    return readiness.ready;
  });
}

export function filterSites(
  sites: ServiceSite[],
  filters: WorkboardFilters,
  evidence: VisitEvidence[],
  scans: AssetScan[],
  now: Date
): ServiceSite[] {
  return sites.filter((site) => {
    if (!matchesQuery(site, filters.query)) return false;
    if (!matchesStatus(site, filters.statuses)) return false;
    if (!siteHasVisitInScope(site.visits, filters.dateScope, now)) return false;
    if (!matchesEvidence(site, filters.evidence, evidence, scans)) return false;
    return true;
  });
}

// Per-status counts shown on each row (§1: "compact count summary of visits by status").
export function visitStatusCounts(
  visits: ServiceVisit[]
): Record<ServiceVisit["status"], number> {
  const counts: Record<ServiceVisit["status"], number> = {
    scheduled: 0,
    confirmed: 0,
    en_route: 0,
    on_site: 0,
    blocked: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const v of visits) {
    counts[v.status]++;
  }
  return counts;
}

export function nextVisit(visits: ServiceVisit[], now: Date): ServiceVisit | null {
  const upcoming = visits
    .filter(
      (v) =>
        v.status !== "completed" &&
        v.status !== "cancelled" &&
        new Date(v.scheduledStart).getTime() >= now.getTime()
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledStart).getTime() -
        new Date(b.scheduledStart).getTime()
    );
  return upcoming[0] ?? null;
}

export function siteMissingEvidenceCount(
  site: ServiceSite,
  evidence: VisitEvidence[]
): number {
  let n = 0;
  for (const v of site.visits) {
    if (v.evidenceRequired) {
      n += missingEvidenceCount(v, evidence);
    }
  }
  return n;
}

export function isSiteLate(site: ServiceSite, now: Date): boolean {
  return site.visits.some((v) => {
    if (v.status === "completed" || v.status === "cancelled") return false;
    return new Date(v.scheduledEnd).getTime() < now.getTime();
  });
}
