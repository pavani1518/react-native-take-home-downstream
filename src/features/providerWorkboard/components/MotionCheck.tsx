// §8 — Accelerometer motion check inline UI.
// Subscribes only during the active window. Cleanup is handled by useMotionCheck.

import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useMotionCheck } from "../native/useMotionCheck";
import type { MotionResult } from "../types";
import { Button, colors } from "./ui";

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

  const isRunning = status === "active" || status === "checking-availability";

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
        {status === "done" ? (
          <Button
            variant="secondary"
            label="Run again"
            onPress={reset}
            accessibilityLabel="Run motion check again"
          />
        ) : (
          <Button
            variant="primary"
            label={isRunning ? "Running…" : "Start"}
            onPress={start}
            disabled={isRunning || status === "unavailable"}
            accessibilityLabel="Start motion check"
          />
        )}
        <Button
          variant="secondary"
          label="Close"
          onPress={onCancel}
          accessibilityLabel="Close motion check"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16, gap: 12 },
  heading: { fontSize: 16, fontWeight: "700", color: colors.text },
  subtle: { fontSize: 13, color: colors.textSubtle },
  warn: {
    padding: 12,
    backgroundColor: colors.warnBg,
    borderRadius: 8,
  },
  warnText: { color: colors.warn, fontSize: 13 },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neutralBg,
    overflow: "hidden",
  },
  progressFill: { height: 10, backgroundColor: colors.info },
  progressText: { fontSize: 13, color: colors.textMuted },
  btnRow: { flexDirection: "row", gap: 10 },
});
