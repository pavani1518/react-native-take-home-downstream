// Reusable sheet header bar — Close on the left (avoids overlap with iOS
// dev-menu / Expo dev gear at top-right), centered title, right-side spacer
// to keep the title visually centered. Replaces duplicated headerBar +
// closeBtn + closeText styles in SiteDetailSheet.tsx and VisitDetailSheet.tsx.

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, TOUCH_TARGET_MIN } from "./theme";

const SIDE_WIDTH = 60;

export function SheetHeader({
  title,
  onClose,
  closeLabel = "Close",
  accessibilityLabel,
}: {
  title: string;
  onClose: () => void;
  closeLabel?: string;
  accessibilityLabel?: string;
}) {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? `Close ${title}`}
        style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
        hitSlop={10}
      >
        <Text style={styles.closeText}>{closeLabel}</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  closeBtn: {
    minWidth: SIDE_WIDTH,
    minHeight: TOUCH_TARGET_MIN,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  closeText: {
    color: colors.link,
    fontWeight: "700",
  },
  spacer: {
    width: SIDE_WIDTH,
    minHeight: TOUCH_TARGET_MIN,
  },
  pressed: { opacity: 0.6 },
});
