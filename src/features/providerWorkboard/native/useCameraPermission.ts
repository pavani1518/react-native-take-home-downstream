// Camera permission wrapper. Uses expo-camera hook so it works on managed Expo.

import { useCameraPermissions } from "expo-camera";
import { useCallback, useEffect } from "react";
import { track } from "../analytics";
import type { PermissionState } from "./permissions";

export function useCameraPermissionState(): {
  state: PermissionState;
  request: () => Promise<PermissionState>;
} {
  const [permission, requestPermission] = useCameraPermissions();

  const state: PermissionState = !permission
    ? "unknown"
    : permission.granted
    ? "granted"
    : "denied";

  // Track once when state becomes known.
  useEffect(() => {
    if (permission) {
      track("camera_permission_requested", {
        outcome: permission.granted ? "granted" : "denied",
      });
    }
  }, [permission]);

  const request = useCallback(async (): Promise<PermissionState> => {
    track("camera_permission_requested", { outcome: "prompted" });
    const result = await requestPermission();
    return result.granted ? "granted" : "denied";
  }, [requestPermission]);

  return { state, request };
}
