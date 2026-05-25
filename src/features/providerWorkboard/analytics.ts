// Analytics abstraction (§12).
// Single track() entry point. Console transport — call sites look like
// production instrumentation. Event names + payload keys are stable snake_case.

export type AnalyticsEventName =
  | "workboard_viewed"
  | "search_changed"
  | "filter_changed"
  | "site_opened"
  | "visit_opened"
  | "visit_action_started"
  | "visit_action_completed"
  | "visit_action_failed"
  | "refresh_triggered"
  | "camera_permission_requested"
  | "evidence_photo_captured"
  | "evidence_retaken"
  | "asset_scan_completed"
  | "asset_scan_mismatch"
  | "motion_check_started"
  | "motion_check_completed"
  | "evidence_upload_queued"
  | "evidence_upload_failed";

export type AnalyticsPayload = Record<
  string,
  string | number | boolean | null | undefined
>;

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  payload: AnalyticsPayload;
  ts: string;
};

// In-process event log so dev tools / tests can inspect what was tracked.
const EVENT_LOG: AnalyticsEvent[] = [];

export function track(
  name: AnalyticsEventName,
  payload: AnalyticsPayload = {}
): void {
  const event: AnalyticsEvent = {
    name,
    payload,
    ts: new Date().toISOString(),
  };
  EVENT_LOG.push(event);
  // Console transport per spec. Single boring line per event.
  console.log(`[analytics] ${name}`, payload);
}

export function getEventLog(): readonly AnalyticsEvent[] {
  return EVENT_LOG;
}

export function __resetAnalyticsForTests(): void {
  EVENT_LOG.length = 0;
}
