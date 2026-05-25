// Shared permission helpers. Always returns 'unknown' | 'granted' | 'denied'
// so the UI can branch on a single string.

import { Linking } from "react-native";

export type PermissionState = "unknown" | "granted" | "denied";

export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    // Best effort — settings may not be available in some environments.
  }
}
