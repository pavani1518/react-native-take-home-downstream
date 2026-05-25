// Pure date-scope matching. No React/RN imports.

import type { DateScope, ServiceVisit } from "../types";

function startOfDayUtc(iso: string): number {
  const d = new Date(iso);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function matchesDateScope(
  visit: ServiceVisit,
  scope: DateScope,
  now: Date
): boolean {
  if (scope === "all") return true;
  const startMs = new Date(visit.scheduledStart).getTime();
  const todayStart = startOfDayUtc(now.toISOString());
  if (scope === "today") {
    return startMs >= todayStart && startMs < todayStart + DAY_MS;
  }
  // next_7_days: starts today through the next 7 days inclusive.
  return startMs >= todayStart && startMs < todayStart + 7 * DAY_MS;
}

export function siteHasVisitInScope(
  visits: ServiceVisit[],
  scope: DateScope,
  now: Date
): boolean {
  if (scope === "all") return true;
  return visits.some((v) => matchesDateScope(v, scope, now));
}
