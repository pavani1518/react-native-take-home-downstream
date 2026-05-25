import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Tone = "neutral" | "info" | "warn" | "danger" | "success";

const TONE_BG: Record<Tone, string> = {
  neutral: "#E5E7EB",
  info: "#DBEAFE",
  warn: "#FEF3C7",
  danger: "#FEE2E2",
  success: "#DCFCE7",
};

const TONE_FG: Record<Tone, string> = {
  neutral: "#374151",
  info: "#1E40AF",
  warn: "#92400E",
  danger: "#991B1B",
  success: "#166534",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: TONE_BG[tone] }]}>
      <Text style={[styles.text, { color: TONE_FG[tone] }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
