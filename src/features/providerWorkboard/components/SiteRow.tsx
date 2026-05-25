// §1 — row in the virtualized workboard list. Shows everything the spec lists.

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge } from "./Badge";
import { formatNextTime } from "./format";
import { colors, toneForPriority, toneForWorkStatus } from "./ui";
import {
  isSiteLate,
  nextVisit,
  siteMissingEvidenceCount,
  visitStatusCounts,
} from "../domain";
import type { ServiceSite, VisitEvidence } from "../types";

export function SiteRow({
  site,
  evidence,
  now,
  onPress,
}: {
  site: ServiceSite;
  evidence: VisitEvidence[];
  now: Date;
  onPress: () => void;
}) {
  const counts = visitStatusCounts(site.visits);
  const next = nextVisit(site.visits, now);
  const missing = siteMissingEvidenceCount(site, evidence);
  const late = isSiteLate(site, now);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${site.siteName}, ${site.customerName}, ${site.workStatus.replace(
        "_",
        " "
      )}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.headerLine}>
        <Text style={styles.siteName} numberOfLines={1}>
          {site.siteName}
        </Text>
        <Text style={styles.customer} numberOfLines={1}>
          {site.customerName}
        </Text>
      </View>

      <Text style={styles.address} numberOfLines={1}>
        {site.address.city}, {site.address.region}
      </Text>

      <View style={styles.badgeRow}>
        {site.priority !== "normal" && (
          <Badge tone={toneForPriority(site.priority)}>
            {site.priority.toUpperCase()}
          </Badge>
        )}
        <Badge tone={toneForWorkStatus(site.workStatus)}>
          {site.workStatus.replace("_", " ")}
        </Badge>
        {late && <Badge tone="danger">LATE</Badge>}
        {missing > 0 && <Badge tone="warn">{missing} missing</Badge>}
      </View>

      <View style={styles.footer}>
        <Text style={styles.next} numberOfLines={1}>
          {next ? `Next: ${formatNextTime(next.scheduledStart, now)}` : "No upcoming"}
        </Text>
        <Text style={styles.counts} numberOfLines={1}>
          {compactCounts(counts)}
        </Text>
      </View>
    </Pressable>
  );
}

function compactCounts(
  c: ReturnType<typeof visitStatusCounts>
): string {
  const parts: string[] = [];
  if (c.scheduled) parts.push(`${c.scheduled} sched`);
  if (c.confirmed) parts.push(`${c.confirmed} conf`);
  if (c.en_route) parts.push(`${c.en_route} en route`);
  if (c.on_site) parts.push(`${c.on_site} on site`);
  if (c.blocked) parts.push(`${c.blocked} blocked`);
  if (c.completed) parts.push(`${c.completed} done`);
  if (c.cancelled) parts.push(`${c.cancelled} cxl`);
  return parts.join(" · ");
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerLight,
    minHeight: 88,
  },
  rowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  headerLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  siteName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  customer: {
    fontSize: 13,
    color: colors.textSubtle,
    marginLeft: 8,
    maxWidth: 140,
  },
  address: {
    fontSize: 13,
    color: colors.textSubtle,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    alignItems: "center",
  },
  next: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  counts: {
    fontSize: 11,
    color: colors.textSubtle,
  },
});
