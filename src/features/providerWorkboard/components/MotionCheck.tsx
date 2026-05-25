// §8 — Accelerometer motion check inline UI.
// Subscribes only during the active window. Cleanup is handled by useMotionCheck.

import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useMotionCheck } from "../native/useMotionCheck";
import type { MotionResult } from "../types";

export function MotionCheck({
  visitId,
  onCancel,
  onComplete,
}: {
  visitId: string;
  onCancel: () => void;
  onComplete: (args: {
    maxAccelerationG: number;
    result: MotionResult;
    startedAt: string;
    completedAt: string;
  }) => void;
}) {
  const { status, progress, result, start, stop, reset } = useMotionCheck();

  // Push result up when capture finishes.
  useEffect(() => {
    if (status === "done" && result) {
      onComplete({
        maxAccelerationG: result.maxG,
        result: result.result,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
      });
    }
  }, [status, result, onComplete]);

  // Ensure sensor stops if the host component unmounts mid-check.
  useEffect(() => stop, [stop]);

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Equipment handling check</Text>
      <Text style={styles.subtle}>
        Hold the device steady against the equipment for a few seconds.
      </Text>

      {status === "unavailable" && (
        <View style={styles.warn}>
          <Text style={styles.warnText}>
            Accelerometer unavailable on this device. Skip motion check or use a
            device with sensor support.
          </Text>
        </View>
      )}

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {status === "active"
          ? `Capturing… ${Math.round(progress * 100)}%`
          : status === "done" && result
          ? `${result.result === "stable" ? "Stable" : "Rough motion detected"} (max ${result.maxG.toFixed(2)} G)`
          : status === "checking-availability"
          ? "Checking sensor…"
          : "Idle"}
      </Text>

      <View style={styles.btnRow}>
        {status === "idle" || status === "unavailable" ? (
          <Pressable
            onPress={start}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Start motion check"
            disabled={status === "unavailable"}
          >
            <Text style={styles.primaryText}>Start</Text>
          </Pressable>
        ) : status === "done" ? (
          <Pressable
            onPress={reset}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Run motion check again"
          >
            <Text style={styles.secondaryText}>Run again</Text>
          </Pressable>
        ) : (
          <View style={styles.primaryBtnDisabled}>
            <Text style={styles.primaryText}>Running…</Text>
          </View>
        )}
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Close motion check"
        >
          <Text style={styles.secondaryText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16, gap: 12 },
  heading: { fontSize: 16, fontWeight: "700", color: "#111827" },
  subtle: { fontSize: 13, color: "#6B7280" },
  warn: {
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
  },
  warnText: { color: "#92400E", fontSize: 13 },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: { height: 10, backgroundColor: "#1E40AF" },
  progressText: { fontSize: 13, color: "#374151" },
  btnRow: { flexDirection: "row", gap: 10 },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#111827",
    minHeight: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  primaryBtnDisabled: {
    flex: 1,
    backgroundColor: "#6B7280",
    minHeight: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  primaryText: { color: "#FFFFFF", fontWeight: "700" },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    minHeight: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  secondaryText: { color: "#111827", fontWeight: "600" },
  pressed: { opacity: 0.7 },
});
