// Centralized design tokens — colors, spacing, typography.
// Single source for visual constants used across the workboard.

import type { ServiceVisit, ServiceSite } from "../../types";

export const colors = {
  // Surfaces
  background: "#FFFFFF",
  surfaceMuted: "#F9FAFB",
  surfaceLight: "#F3F4F6",
  divider: "#E5E7EB",
  dividerLight: "#F3F4F6",

  // Text
  text: "#111827",
  textMuted: "#374151",
  textSubtle: "#6B7280",
  textOnDark: "#FFFFFF",

  // Brand / actions
  primary: "#111827",
  link: "#1E40AF",
  linkBg: "#DBEAFE",

  // Semantic tones
  warn: "#92400E",
  warnBg: "#FEF3C7",
  danger: "#991B1B",
  dangerBg: "#FEE2E2",
  success: "#166534",
  successBg: "#DCFCE7",
  info: "#1E40AF",
  infoBg: "#DBEAFE",
  neutralBg: "#E5E7EB",

  // Misc
  placeholder: "#9CA3AF",
  shadow: "#000000",
} as const;

export const spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  pill: 16,
} as const;

// Touch-target floor per the spec — never go below this for Pressable areas.
export const TOUCH_TARGET_MIN = 44;

// Map work status / visit status to a tone for badges + indicators.
// Centralizing here means SiteRow + sheets stay consistent.
export type Tone = "neutral" | "info" | "warn" | "danger" | "success";

export function toneForWorkStatus(s: ServiceSite["workStatus"]): Tone {
  switch (s) {
    case "blocked":
      return "danger";
    case "needs_attention":
      return "warn";
    case "in_progress":
      return "info";
    case "completed":
      return "success";
    default:
      return "neutral";
  }
}

export function toneForVisitStatus(s: ServiceVisit["status"]): Tone {
  switch (s) {
    case "blocked":
      return "danger";
    case "completed":
      return "success";
    case "cancelled":
      return "neutral";
    case "en_route":
    case "on_site":
      return "info";
    default:
      return "neutral";
  }
}

export function toneForPriority(p: ServiceSite["priority"]): Tone {
  if (p === "urgent") return "danger";
  if (p === "high") return "warn";
  return "neutral";
}
