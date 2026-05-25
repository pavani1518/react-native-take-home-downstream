// Reusable Button. Replaces the duplicated primaryBtn / secondaryBtn /
// dangerBtn StyleSheets that lived in 4+ components.
//
// Variants:
//   primary  — dark, white text (default high-emphasis action)
//   secondary — light gray, dark text (low-emphasis action)
//   danger   — red, white text (destructive)
//   link     — text-only, centered, used for "Cancel" affordances
//
// States: pending (shows "Working…"), disabled (50% opacity, blocks press).
// Touch target is always >= 44pt regardless of variant.

import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radius, TOUCH_TARGET_MIN } from "./theme";

export type ButtonVariant = "primary" | "secondary" | "danger" | "link";

type Props = Omit<PressableProps, "style" | "children"> & {
  label: string;
  variant?: ButtonVariant;
  pending?: boolean;
  fullHeight?: boolean; // when true, fixes height (used by sticky footer rows)
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  variant = "primary",
  pending = false,
  disabled,
  fullHeight = false,
  style,
  accessibilityLabel,
  ...rest
}: Props) {
  const isDisabled = disabled || pending;
  const isLink = variant === "link";
  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!isDisabled, busy: pending }}
      style={({ pressed }) => [
        isLink ? styles.link : styles.btn,
        !isLink && variantStyles[variant],
        fullHeight && styles.fullHeight,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={isLink ? styles.linkText : textStyles[variant]}>
        {pending ? "Working…" : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    minHeight: TOUCH_TARGET_MIN,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  fullHeight: {
    flex: undefined,
    height: 48,
  },
  link: {
    minHeight: TOUCH_TARGET_MIN,
    justifyContent: "center",
    alignItems: "center",
  },
  linkText: {
    color: colors.textSubtle,
    fontWeight: "600",
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});

const variantStyles: Record<Exclude<ButtonVariant, "link">, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceLight },
  danger: { backgroundColor: colors.danger },
};

const textStyles = {
  primary: { color: colors.textOnDark, fontWeight: "700" as const },
  secondary: { color: colors.text, fontWeight: "600" as const },
  danger: { color: colors.textOnDark, fontWeight: "700" as const },
  link: { color: colors.textSubtle, fontWeight: "600" as const },
};
