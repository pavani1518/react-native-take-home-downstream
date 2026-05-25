// §4 + §5 — Visit detail sheet (2nd modal layer). Hosts evidence/scan/motion
// inline (no third modal). Drives the 3 visit actions + per-evidence retry.

import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "./Badge";
import { formatVisitTime, formatTimeWindow } from "./format";
import { CameraCapture } from "./CameraCapture";
import { ScannerCapture } from "./ScannerCapture";
import { MotionCheck } from "./MotionCheck";
import {
  Button,
  Section,
  SheetHeader,
  colors,
  toneForVisitStatus,
} from "./ui";
import {
  evidenceChecklist,
  getEligibleActions,
  canComplete,
} from "../domain";
import { track } from "../analytics";
import {
  useMutateVisit,
  useRecordMotion,
  useRecordScan,
  useSaveEvidence,
  useUploadEvidence,
} from "../viewModels/useWorkboardData";
import { useLocation } from "../native/useLocation";
import type {
  AssetScan,
  EligibleAction,
  MotionSample,
  ServiceVisit,
  VisitActionId,
  VisitEvidence,
} from "../types";

type Mode = "details" | "capture" | "scan" | "motion" | "blocked-reason";

export function VisitDetailSheet({
  visit,
  visible,
  evidence,
  scan,
  motion,
  onClose,
}: {
  visit: ServiceVisit | null;
  visible: boolean;
  evidence: VisitEvidence[];
  scan: AssetScan | undefined;
  motion: MotionSample | undefined;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("details");
  const [blockedReason, setBlockedReason] = useState("");
  const [pendingAction, setPendingAction] = useState<VisitActionId | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutateVisit = useMutateVisit();
  const saveEvidence = useSaveEvidence();
  const uploadEvidence = useUploadEvidence();
  const recordScan = useRecordScan();
  const recordMotion = useRecordMotion();
  const location = useLocation();

  if (!visit) return null;

  const visitEvidence = evidence.filter((e) => e.visitId === visit.id);
  const checklist = evidenceChecklist(visit, evidence);
  const actions = getEligibleActions(visit, evidence, scan, motion);
  const readiness = canComplete(visit, evidence, scan, motion);

  const handleAction = async (id: VisitActionId) => {
    if (id === "report_blocked") {
      setMode("blocked-reason");
      return;
    }
    if (id === "retry_failed_upload") {
      const failed = visitEvidence.filter((e) => e.uploadStatus === "failed");
      for (const ev of failed) {
        try {
          await uploadEvidence.mutateAsync(ev.id);
        } catch {
          // already tracked as failed inside the mutation; UI will show next pass
        }
      }
      return;
    }

    setPendingAction(id);
    setErrorMsg(null);
    track("visit_action_started", { visit_id: visit.id, action: id });
    try {
      await mutateVisit.mutateAsync({ visitId: visit.id, action: id });
      track("visit_action_completed", { visit_id: visit.id, action: id });
    } catch (e) {
      const m = e instanceof Error ? e.message : "Action failed";
      setErrorMsg(m);
      track("visit_action_failed", { visit_id: visit.id, action: id, message: m });
    } finally {
      setPendingAction(null);
    }
  };

  const confirmBlocked = async () => {
    if (!blockedReason.trim()) return;
    setMode("details");
    setPendingAction("report_blocked");
    setErrorMsg(null);
    track("visit_action_started", { visit_id: visit.id, action: "report_blocked" });
    try {
      await mutateVisit.mutateAsync({
        visitId: visit.id,
        action: "report_blocked",
        blockedReason: blockedReason.trim(),
      });
      track("visit_action_completed", { visit_id: visit.id, action: "report_blocked" });
      setBlockedReason("");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Action failed";
      setErrorMsg(m);
      track("visit_action_failed", {
        visit_id: visit.id,
        action: "report_blocked",
        message: m,
      });
    } finally {
      setPendingAction(null);
    }
  };

  const onConfirmCapture = async (localUri: string) => {
    let lat: number | undefined;
    let lng: number | undefined;
    if (visit.locationRequired) {
      const r = await location.capture();
      if (r.kind === "ok") {
        lat = r.latitude;
        lng = r.longitude;
      } else {
        // Degraded path — not silent. Show an alert summarizing why.
        Alert.alert(
          "Location not attached",
          r.kind === "denied"
            ? "Location permission denied. Photo saved without coordinates."
            : r.kind === "unavailable"
            ? "Location services disabled. Photo saved without coordinates."
            : `Location failed: ${r.kind === "error" ? r.message : "unknown"}.`
        );
      }
    }
    // Default required evidence type for this visit:
    const type = checklist.find((c) => !c.captured)?.type ?? "completion_photo";
    const saved = await saveEvidence.mutateAsync({
      visitId: visit.id,
      type,
      localUri,
      latitude: lat,
      longitude: lng,
    });
    track("evidence_upload_queued", { visit_id: visit.id, evidence_id: saved.id });

    // Kick off upload right away — failure goes to retry queue automatically.
    uploadEvidence.mutate(saved.id);
    setMode("details");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.sheet} edges={["top", "left", "right", "bottom"]}>
        <SheetHeader
          title="Visit"
          onClose={onClose}
          accessibilityLabel="Close visit details"
        />

        {mode === "capture" && (
          <CameraCapture
            visitId={visit.id}
            onCancel={() => setMode("details")}
            onConfirm={onConfirmCapture}
          />
        )}

        {mode === "scan" && (
          <ScannerCapture
            visitId={visit.id}
            expectedAssetCode={visit.expectedAssetCode}
            onCancel={() => setMode("details")}
            onResult={async ({ scannedAssetCode, result }) => {
              await recordScan.mutateAsync({
                visitId: visit.id,
                expectedAssetCode: visit.expectedAssetCode,
                scannedAssetCode,
                result,
              });
              setMode("details");
            }}
          />
        )}

        {mode === "motion" && (
          <MotionCheck
            visitId={visit.id}
            onCancel={() => setMode("details")}
            onComplete={async (args) => {
              await recordMotion.mutateAsync({
                visitId: visit.id,
                ...args,
              });
            }}
          />
        )}

        {mode === "blocked-reason" && (
          <View style={styles.blockedPanel}>
            <Text style={styles.heading}>Report blocked</Text>
            <Text style={styles.subtle}>Provide a brief reason for blocking.</Text>
            <TextInput
              style={styles.input}
              value={blockedReason}
              onChangeText={setBlockedReason}
              placeholder="e.g. Customer site closed for audit"
              placeholderTextColor={colors.placeholder}
              accessibilityLabel="Blocked reason"
              multiline
            />
            <View style={styles.btnRow}>
              <Button
                variant="danger"
                label="Confirm"
                disabled={!blockedReason.trim()}
                onPress={() => {
                  Alert.alert(
                    "Confirm blocking visit",
                    "This will mark the visit as blocked. Continue?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Confirm", style: "destructive", onPress: confirmBlocked },
                    ]
                  );
                }}
                accessibilityLabel="Confirm and report blocked"
              />
              <Button
                variant="secondary"
                label="Cancel"
                onPress={() => setMode("details")}
              />
            </View>
          </View>
        )}

        {mode === "details" && (
          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.badgeRow}>
              <Badge tone={toneForVisitStatus(visit.status)}>
                {visit.status.replace("_", " ")}
              </Badge>
              <Badge tone="neutral">{visit.serviceType}</Badge>
            </View>

            <Section title="Equipment">
              <Text style={styles.bodyText}>{visit.equipmentLabel}</Text>
              <Text style={styles.subtle}>Expected asset: {visit.expectedAssetCode}</Text>
            </Section>

            <Section title="Scheduled">
              <Text style={styles.bodyText}>
                {formatVisitTime(visit.scheduledStart)}
              </Text>
              <Text style={styles.subtle}>
                {formatTimeWindow(visit.scheduledStart, visit.scheduledEnd)}
              </Text>
            </Section>

            {visit.assignedTech && (
              <Section title="Assigned tech">
                <Text style={styles.bodyText}>{visit.assignedTech}</Text>
              </Section>
            )}

            {visit.issueSummary && (
              <Section title="Issue">
                <Text style={styles.warn}>{visit.issueSummary}</Text>
              </Section>
            )}
            {visit.blockedReason && (
              <Section title="Blocked reason">
                <Text style={styles.warn}>{visit.blockedReason}</Text>
              </Section>
            )}

            <Section title="Last updated">
              <Text style={styles.subtle}>{formatVisitTime(visit.lastUpdatedAt)}</Text>
            </Section>

            <Section title="Evidence checklist">
              {checklist.length === 0 ? (
                <Text style={styles.subtle}>No evidence required for this visit.</Text>
              ) : (
                checklist.map((c) => (
                  <Text
                    key={c.type}
                    style={c.captured ? styles.itemDone : styles.itemTodo}
                  >
                    {c.captured ? "✓" : "○"} {c.type.replace("_", " ")}
                    {c.captured ? (c.uploaded ? " (uploaded)" : " (queued)") : ""}
                  </Text>
                ))
              )}
              {visitEvidence.length > 0 && (
                <View style={{ marginTop: 6 }}>
                  {visitEvidence.map((e) => (
                    <View key={e.id} style={styles.evidenceItem}>
                      <Text style={styles.evidenceItemText}>
                        {e.type.replace("_", " ")} · {e.uploadStatus}
                      </Text>
                      {e.uploadStatus === "failed" && (
                        <Pressable
                          onPress={() => uploadEvidence.mutate(e.id)}
                          style={({ pressed }) => [
                            styles.retryItemBtn,
                            pressed && styles.pressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Retry upload"
                        >
                          <Text style={styles.retryItemText}>Retry</Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.btnRow}>
                <Button
                  variant="secondary"
                  label="Capture evidence"
                  onPress={() => setMode("capture")}
                />
              </View>
            </Section>

            <Section title="Asset scan">
              {scan ? (
                <Text style={scan.result === "match" ? styles.itemDone : styles.warn}>
                  {scan.result === "match" ? "✓ Matches expected" : `✗ Mismatch (${scan.scannedAssetCode})`}
                </Text>
              ) : (
                <Text style={styles.subtle}>No scan recorded yet.</Text>
              )}
              <View style={styles.btnRow}>
                <Button
                  variant="secondary"
                  label={scan ? "Rescan asset" : "Scan asset"}
                  onPress={() => setMode("scan")}
                />
              </View>
            </Section>

            <Section title="Motion check">
              {motion ? (
                <Text style={motion.result === "stable" ? styles.itemDone : styles.warn}>
                  {motion.result === "stable" ? "✓ Stable" : "✗ Rough motion detected"} · max {motion.maxAccelerationG.toFixed(2)} G
                </Text>
              ) : visit.motionCheckRequired ? (
                <Text style={styles.warn}>Required — not yet run.</Text>
              ) : (
                <Text style={styles.subtle}>Optional for this visit.</Text>
              )}
              <View style={styles.btnRow}>
                <Button
                  variant="secondary"
                  label={motion ? "Run again" : "Run motion check"}
                  onPress={() => setMode("motion")}
                />
              </View>
            </Section>

          </ScrollView>
        )}

        {mode === "details" && (
          <View style={styles.stickyFooter}>
            {!readiness.ready && readiness.blockers.length > 0 && (
              <Text style={styles.footerBlocker}>
                To complete: {readiness.blockers.join(", ").replace(/_/g, " ")}
              </Text>
            )}
            {errorMsg && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
            {actions.map((a) => (
              <ActionButton
                key={a.id}
                action={a}
                pending={pendingAction === a.id}
                blockedByPending={pendingAction !== null}
                onPress={() => handleAction(a.id)}
              />
            ))}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ActionButton uses the shared Button primitive but layered with a "reason"
// note when the action is disabled. Kept local because the wrap + reason
// affordance is specific to the visit actions row.
function ActionButton({
  action,
  pending,
  blockedByPending,
  onPress,
}: {
  action: EligibleAction;
  pending: boolean;
  blockedByPending: boolean;
  onPress: () => void;
}) {
  const label = ACTION_LABELS[action.id];
  const destructive = action.id === "report_blocked";
  const enabled = action.enabled && !blockedByPending;
  return (
    <View style={styles.actionWrap}>
      <Button
        variant={destructive ? "danger" : "primary"}
        label={label}
        onPress={onPress}
        disabled={!enabled}
        pending={pending}
        fullHeight
        accessibilityLabel={label}
      />
      {!enabled && action.reason && (
        <Text style={styles.reason}>{action.reason}</Text>
      )}
    </View>
  );
}

const ACTION_LABELS: Record<VisitActionId, string> = {
  mark_en_route: "Mark en route",
  complete_visit: "Complete visit",
  report_blocked: "Report blocked",
  retry_failed_upload: "Retry failed uploads",
};

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background },
  pressed: { opacity: 0.6 },
  body: { padding: 16, paddingBottom: 24 },
  stickyFooter: {
    padding: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
    gap: 8,
  },
  footerBlocker: {
    fontSize: 12,
    color: colors.warn,
    fontWeight: "600",
  },
  badgeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  bodyText: { fontSize: 15, color: colors.text },
  subtle: { fontSize: 13, color: colors.textSubtle, marginTop: 2 },
  warn: { fontSize: 14, color: colors.warn, marginTop: 2 },
  itemDone: { fontSize: 14, color: colors.success, marginTop: 4 },
  itemTodo: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  evidenceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.dividerLight,
    gap: 8,
  },
  evidenceItemText: { fontSize: 13, color: colors.textMuted },
  retryItemBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.dangerBg,
    justifyContent: "center",
    alignItems: "center",
  },
  retryItemText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  actionWrap: { gap: 2 },
  reason: { fontSize: 12, color: colors.textSubtle, marginLeft: 4 },
  errorBanner: {
    padding: 10,
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
    marginVertical: 6,
  },
  errorText: { color: colors.danger, fontWeight: "600" },
  blockedPanel: { padding: 16, gap: 12 },
  heading: { fontSize: 16, fontWeight: "700", color: colors.text },
  input: {
    minHeight: 88,
    padding: 12,
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: "top",
  },
});
