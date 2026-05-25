// §2 — compact operational summary derived from filtered data.

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { WorkboardSummary } from "../types";

export function SummaryHeader({ summary }: { summary: WorkboardSummary }) {
  return (
    <View
      style={styles.row}
      accessibilityRole="summary"
      accessibilityLabel="Workboard summary"
    >
      <Cell label="Sites" value={summary.totalSites} />
      <Cell label="Today" value={summary.visitsDueToday} />
      <Cell label="Blocked" value={summary.blockedVisits} tone="danger" />
      <Cell label="Urgent" value={summary.urgentSites} tone="warn" />
      <Cell
        label="Missing"
        value={summary.visitsMissingEvidence}
        tone={summary.visitsMissingEvidence > 0 ? "warn" : "neutral"}
      />
      <Cell
        label="Uploads"
        value={summary.failedOrQueuedUploads}
        tone={summary.failedOrQueuedUploads > 0 ? "danger" : "neutral"}
      />
    </View>
  );
}

function Cell({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "warn" | "danger";
}) {
  const color =
    tone === "danger" ? "#991B1B" : tone === "warn" ? "#92400E" : "#111827";
  return (
    <View style={styles.cell} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  cell: {
    flex: 1,
    alignItems: "center",
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
  },
  label: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
});
