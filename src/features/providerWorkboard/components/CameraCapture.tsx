// §6 camera evidence capture. Lives inline inside the visit sheet
// (no third modal layer). Handles permission unknown/granted/denied
// with a "Open settings" recovery path. Includes a labeled dev fallback
// that simulates capture without a physical camera.

import { CameraView } from "expo-camera";
import React, { useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { track } from "../analytics";
import {
  openAppSettings,
  type PermissionState,
} from "../native/permissions";
import { useCameraPermissionState } from "../native/useCameraPermission";

type Phase = "idle" | "framing" | "preview";

const SIMULATED_URI = "https://placehold.co/600x400/png?text=Captured+Evidence";

export function CameraCapture({
  visitId,
  onCancel,
  onConfirm,
}: {
  visitId: string;
  onCancel: () => void;
  onConfirm: (localUri: string) => void;
}) {
  const { state, request } = useCameraPermissionState();
  const [phase, setPhase] = useState<Phase>("idle");
  const [uri, setUri] = useState<string | null>(null);
  const camRef = useRef<CameraView>(null);

  const ensurePermission = async (): Promise<PermissionState> => {
    if (state === "granted") return "granted";
    return await request();
  };

  const handleStart = async () => {
    const next = await ensurePermission();
    if (next === "granted") setPhase("framing");
  };

  const handleCapture = async () => {
    try {
      const photo = await camRef.current?.takePictureAsync({ quality: 0.5 });
      if (photo?.uri) {
        setUri(photo.uri);
        setPhase("preview");
        track("evidence_photo_captured", { visit_id: visitId, source: "camera" });
      }
    } catch {
      // Camera failure path — show preview with simulated content as fallback.
      handleSimulate();
    }
  };

  const handleSimulate = () => {
    setUri(SIMULATED_URI);
    setPhase("preview");
    track("evidence_photo_captured", { visit_id: visitId, source: "simulated" });
  };

  const handleRetake = () => {
    track("evidence_retaken", { visit_id: visitId });
    setUri(null);
    setPhase("framing");
  };

  const handleConfirm = () => {
    if (!uri) return;
    onConfirm(uri);
  };

  // Idle (also covers permission unknown/denied)
  if (phase === "idle") {
    return (
      <View style={styles.panel}>
        <Text style={styles.heading}>Capture evidence photo</Text>
        {state === "denied" && (
          <View style={styles.denied}>
            <Text style={styles.deniedText}>
              Camera permission is denied. Open settings to allow camera access,
              or use the simulated capture fallback below.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              onPress={openAppSettings}
              accessibilityRole="button"
              accessibilityLabel="Open device settings"
            >
              <Text style={styles.secondaryText}>Open settings</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.btnRow}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="Start camera capture"
          >
            <Text style={styles.primaryText}>
              {state === "granted" ? "Open camera" : "Request camera"}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            onPress={handleSimulate}
            accessibilityRole="button"
            accessibilityLabel="Use simulated capture (development fallback)"
          >
            <Text style={styles.secondaryText}>DEV: simulate</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Cancel capture"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === "framing") {
    return (
      <View style={styles.panel}>
        <View style={styles.cameraWrap}>
          <CameraView ref={camRef} style={styles.camera} facing="back" />
        </View>
        <View style={styles.btnRow}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={handleCapture}
            accessibilityRole="button"
            accessibilityLabel="Capture photo"
          >
            <Text style={styles.primaryText}>Capture</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            onPress={handleSimulate}
            accessibilityRole="button"
            accessibilityLabel="Use simulated capture"
          >
            <Text style={styles.secondaryText}>DEV: simulate</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Cancel capture"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  // preview
  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Confirm photo</Text>
      {uri && (
        <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
      )}
      <View style={styles.btnRow}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          onPress={handleConfirm}
          accessibilityRole="button"
          accessibilityLabel="Save this photo"
        >
          <Text style={styles.primaryText}>Save photo</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          onPress={handleRetake}
          accessibilityRole="button"
          accessibilityLabel="Retake photo"
        >
          <Text style={styles.secondaryText}>Retake</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={onCancel}
        style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Cancel without saving"
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  denied: {
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    gap: 8,
  },
  deniedText: {
    color: "#92400E",
    fontSize: 13,
  },
  cameraWrap: {
    height: 280,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camera: { flex: 1 },
  preview: {
    height: 280,
    borderRadius: 12,
    backgroundColor: "#000",
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#111827",
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
  cancelBtn: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: { color: "#6B7280", fontWeight: "600" },
  pressed: { opacity: 0.7 },
});
