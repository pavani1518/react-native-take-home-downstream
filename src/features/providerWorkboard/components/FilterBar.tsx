// §1 filter UI: text search + status chips + date-scope chips + evidence chips.
// Evidence filter labels are verbatim per spec: Missing proof, Scan mismatch, Ready to complete.

import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  DateScope,
  EvidenceFilter,
  WorkStatus,
} from "../types";

const STATUS_OPTIONS: { id: WorkStatus; label: string }[] = [
  { id: "needs_attention", label: "Needs attention" },
  { id: "scheduled", label: "Scheduled" },
  { id: "in_progress", label: "In progress" },
  { id: "blocked", label: "Blocked" },
  { id: "completed", label: "Completed" },
];

const DATE_OPTIONS: { id: DateScope; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "next_7_days", label: "Next 7 days" },
  { id: "all", label: "All" },
];

const EVIDENCE_OPTIONS: { id: EvidenceFilter; label: string }[] = [
  { id: "missing_proof", label: "Missing proof" },
  { id: "scan_mismatch", label: "Scan mismatch" },
  { id: "ready_to_complete", label: "Ready to complete" },
];

export function FilterBar({
  query,
  onQueryChange,
  statuses,
  onStatusToggle,
  dateScope,
  onDateScopeChange,
  evidence,
  onEvidenceChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  statuses: WorkStatus[];
  onStatusToggle: (s: WorkStatus) => void;
  dateScope: DateScope;
  onDateScopeChange: (d: DateScope) => void;
  evidence: EvidenceFilter | null;
  onEvidenceChange: (e: EvidenceFilter | null) => void;
}) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search sites, customers, equipment"
        placeholderTextColor="#9CA3AF"
        value={query}
        onChangeText={onQueryChange}
        accessibilityLabel="Search workboard"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />

      <ChipRow label="Date">
        {DATE_OPTIONS.map((opt) => (
          <Chip
            key={opt.id}
            label={opt.label}
            active={dateScope === opt.id}
            onPress={() => onDateScopeChange(opt.id)}
          />
        ))}
      </ChipRow>

      <ChipRow label="Status">
        {STATUS_OPTIONS.map((opt) => (
          <Chip
            key={opt.id}
            label={opt.label}
            active={statuses.includes(opt.id)}
            onPress={() => onStatusToggle(opt.id)}
          />
        ))}
      </ChipRow>

      <ChipRow label="Evidence">
        {EVIDENCE_OPTIONS.map((opt) => (
          <Chip
            key={opt.id}
            label={opt.label}
            active={evidence === opt.id}
            onPress={() =>
              onEvidenceChange(evidence === opt.id ? null : opt.id)
            }
          />
        ))}
      </ChipRow>
    </View>
  );
}

function ChipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.chipRow}>
      <Text style={styles.chipRowLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  search: {
    minHeight: 44,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    fontSize: 15,
    marginBottom: 8,
    color: "#111827",
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  chipRowLabel: {
    width: 64,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  chipScroll: {
    paddingRight: 8,
    gap: 6,
  },
  chip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#1E40AF",
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#1E40AF",
    fontWeight: "700",
  },
});
