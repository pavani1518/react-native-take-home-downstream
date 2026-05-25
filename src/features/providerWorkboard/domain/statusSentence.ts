// Human-readable status sentence for a site (§3 site detail sheet).

import type { ServiceSite, ServiceVisit } from "../types";

function isOverdue(visit: ServiceVisit, now: Date): boolean {
  if (visit.status === "completed" || visit.status === "cancelled") return false;
  return new Date(visit.scheduledEnd).getTime() < now.getTime();
}

export function statusSentence(site: ServiceSite, now: Date): string {
  const blocked = site.visits.filter((v) => v.status === "blocked");
  if (blocked.length > 0) {
    const reason = blocked[0]?.blockedReason;
    return reason
      ? `Site is blocked: ${reason}.`
      : "Site has at least one blocked visit.";
  }

  const overdue = site.visits.filter((v) => isOverdue(v, now));
  if (overdue.length > 0) {
    return `${overdue.length} overdue visit${overdue.length === 1 ? "" : "s"} ${overdue.length === 1 ? "needs" : "need"} attention.`;
  }

  const active = site.visits.filter(
    (v) => v.status === "en_route" || v.status === "on_site"
  );
  if (active.length > 0) {
    return `${active.length} visit${active.length === 1 ? "" : "s"} in progress.`;
  }

  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const dueToday = site.visits.filter((v) => {
    const t = new Date(v.scheduledStart);
    t.setUTCHours(0, 0, 0, 0);
    return t.getTime() === today.getTime();
  });
  if (dueToday.length > 0) {
    return `${dueToday.length} visit${dueToday.length === 1 ? "" : "s"} scheduled today.`;
  }

  if (site.visits.length === 0) {
    return "No visits scheduled.";
  }

  const allDone = site.visits.every(
    (v) => v.status === "completed" || v.status === "cancelled"
  );
  if (allDone) return "All visits closed out.";

  return "Upcoming visits scheduled.";
}
