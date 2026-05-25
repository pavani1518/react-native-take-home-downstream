// §3 Site detail sheet — Modal pageSheet on iOS, scrollable, safe-area aware.
// Tapping a visit inside opens the nested VisitDetailSheet (§4).

import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "./Badge";
import { formatVisitTime } from "./format";
import { VisitDetailSheet } from "./VisitDetailSheet";
import {
  Section,
  SheetHeader,
  colors,
  toneForPriority,
  toneForVisitStatus,
} from "./ui";
import {
  isSiteLate,
  nextVisit,
  siteMissingEvidenceCount,
  statusSentence,
  visitStatusCounts,
} from "../domain";
import { track } from "../analytics";
import type {
  AssetScan,
  MotionSample,
  ServiceSite,
  ServiceVisit,
  VisitEvidence,
} from "../types";

export function SiteDetailSheet({
  site,
  visible,
  evidence,
  scans,
  motion,
  now,
  onClose,
}: {
  site: ServiceSite | null;
  visible: boolean;
  evidence: VisitEvidence[];
  scans: AssetScan[];
  motion: MotionSample[];
  now: Date;
  onClose: () => void;
}) {
  const [openVisit, setOpenVisit] = useState<ServiceVisit | null>(null);

  if (!site) return null;

  const counts = visitStatusCounts(site.visits);
  const next = nextVisit(site.visits, now);
  const missing = siteMissingEvidenceCount(site, evidence);
  const late = isSiteLate(site, now);
  const sentence = statusSentence(site, now);

  // Hardware permission warnings: any visit at this site that requires
  // motion check or location capture surfaces a heads-up.
  const requiresMotion = site.visits.some((v) => v.motionCheckRequired);
  const requiresLocation = site.visits.some((v) => v.locationRequired);
  const requiresEvidence = site.visits.some((v) => v.evidenceRequired);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.sheet} edges={["top", "left", "right", "bottom"]}>
        <SheetHeader
          title={site.siteName}
          onClose={onClose}
          accessibilityLabel="Close site details"
        />

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.customer}>{site.customerName}</Text>
          <Text style={styles.address}>
            {site.address.line1}, {site.address.city}, {site.address.region}{" "}
            {site.address.postalCode}
          </Text>
          <Text style={styles.contact}>
            {site.contactName} · {site.contactPhone}
          </Text>

          <View style={styles.badgeRow}>
            <Badge tone={toneForPriority(site.priority)}>
              {site.priority.toUpperCase()}
            </Badge>
            <Badge>{site.workStatus.replace("_", " ")}</Badge>
            {late && <Badge tone="danger">LATE</Badge>}
            {missing > 0 && (
              <Badge tone="warn">{missing} missing evidence</Badge>
            )}
          </View>

          <Section title="Status">
            <Text style={styles.sentence}>{sentence}</Text>
          </Section>

          {next && (
            <Section title="Next visit">
              <Text style={styles.bodyText}>
                {formatVisitTime(next.scheduledStart, now)} · {next.equipmentLabel}
              </Text>
            </Section>
          )}

          <Section title="Evidence completion">
            <Text style={styles.bodyText}>
              {missing === 0
                ? "All required evidence captured."
                : `${missing} required item${missing === 1 ? "" : "s"} still missing.`}
            </Text>
          </Section>

          {(requiresMotion || requiresLocation || requiresEvidence) && (
            <Section title="Hardware required at this site">
              {requiresEvidence && (
                <Text style={styles.warn}>• Camera (evidence capture)</Text>
              )}
              {requiresMotion && (
                <Text style={styles.warn}>• Accelerometer (motion check)</Text>
              )}
              {requiresLocation && (
                <Text style={styles.warn}>• Location (foreground)</Text>
              )}
            </Section>
          )}

          <Section title={`Visit timeline (${site.visits.length})`}>
            <Text style={styles.counts}>{summarize(counts)}</Text>
            {site.visits.map((v) => (
              <Pressable
                key={v.id}
                onPress={() => {
                  track("visit_opened", { visit_id: v.id, status: v.status });
                  setOpenVisit(v);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Open visit ${v.equipmentLabel}, status ${v.status}`}
                style={({ pressed }) => [styles.visitItem, pressed && styles.pressed]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.visitTitle} numberOfLines={1}>
                    {v.equipmentLabel}
                  </Text>
                  <Text style={styles.visitMeta} numberOfLines={1}>
                    {formatVisitTime(v.scheduledStart, now)} · {v.serviceType}
                  </Text>
                </View>
                <Badge tone={toneForVisitStatus(v.status)}>{v.status.replace("_", " ")}</Badge>
              </Pressable>
            ))}
          </Section>
        </ScrollView>

        <VisitDetailSheet
          visit={openVisit}
          visible={!!openVisit}
          evidence={evidence}
          scan={scans.find((s) => s.visitId === openVisit?.id)}
          motion={motion.find((m) => m.visitId === openVisit?.id)}
          onClose={() => setOpenVisit(null)}
        />
      </SafeAreaView>
    </Modal>
  );
}

function summarize(c: ReturnType<typeof visitStatusCounts>): string {
  return Object.entries(c)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${k.replace("_", " ")}`)
    .join(" · ");
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background },
  pressed: { opacity: 0.6 },
  body: {
    padding: 16,
    paddingBottom: 32,
  },
  customer: {
    fontSize: 14,
    color: colors.textSubtle,
    fontWeight: "600",
  },
  address: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  contact: {
    fontSize: 13,
    color: colors.textSubtle,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  sentence: {
    fontSize: 15,
    color: colors.text,
  },
  bodyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  warn: {
    fontSize: 13,
    color: colors.warn,
    marginTop: 2,
  },
  counts: {
    fontSize: 12,
    color: colors.textSubtle,
    marginBottom: 8,
  },
  visitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerLight,
    gap: 8,
    minHeight: 56,
  },
  visitTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  visitMeta: {
    fontSize: 12,
    color: colors.textSubtle,
    marginTop: 2,
  },
});
