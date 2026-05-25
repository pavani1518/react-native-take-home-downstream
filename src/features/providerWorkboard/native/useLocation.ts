// Foreground location (§9 choice). Used to attach lat/lng to evidence.
// Permission denial returns a clearly-signalled degraded result, never silent.

import * as Location from "expo-location";
import { useCallback, useState } from "react";
import type { PermissionState } from "./permissions";

export type LocationResult =
  | { kind: "ok"; latitude: number; longitude: number }
  | { kind: "denied" }
  | { kind: "unavailable" }
  | { kind: "error"; message: string };

export function useLocation() {
  const [state, setState] = useState<PermissionState>("unknown");
  const [last, setLast] = useState<LocationResult | null>(null);

  const capture = useCallback(async (): Promise<LocationResult> => {
    let perm = await Location.getForegroundPermissionsAsync();
    if (!perm.granted) {
      perm = await Location.requestForegroundPermissionsAsync();
    }
    if (!perm.granted) {
      setState("denied");
      const r: LocationResult = { kind: "denied" };
      setLast(r);
      return r;
    }
    setState("granted");
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        const r: LocationResult = { kind: "unavailable" };
        setLast(r);
        return r;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const r: LocationResult = {
        kind: "ok",
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setLast(r);
      return r;
    } catch (e) {
      const r: LocationResult = {
        kind: "error",
        message: e instanceof Error ? e.message : "Location capture failed",
      };
      setLast(r);
      return r;
    }
  }, []);

  return { state, last, capture };
}
