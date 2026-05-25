// Badge — uses the centralized Tone tokens from ui/theme.

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, type Tone } from "./ui";

const TONE_BG: Record<Tone, string> = {
  neutral: colors.neutralBg,
  info: colors.infoBg,
  warn: colors.warnBg,
  danger: colors.dangerBg,
  success: colors.successBg,
};

const TONE_FG: Record<Tone, string> = {
  neutral: colors.textMuted,
  info: colors.info,
  warn: colors.warn,
  danger: colors.danger,
  success: colors.success,
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
