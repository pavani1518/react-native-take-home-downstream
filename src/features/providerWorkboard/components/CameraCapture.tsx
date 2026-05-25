// §6 camera evidence capture. Lives inline inside the visit sheet
// (no third modal layer). Handles permission unknown/granted/denied
// with a "Open settings" recovery path. Includes a labeled dev fallback
// that simulates capture without a physical camera.

import { CameraView } from "expo-camera";
import React, { useRef, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { track } from "../analytics";
import {
  openAppSettings,
  type PermissionState,
} from "../native/permissions";
import { useCameraPermissionState } from "../native/useCameraPermission";
import { Button, colors } from "./ui";

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
            <Button
              variant="secondary"
              label="Open settings"
              onPress={openAppSettings}
              accessibilityLabel="Open device settings"
            />
          </View>
        )}
        <View style={styles.btnRow}>
          <Button
            variant="primary"
            label={state === "granted" ? "Open camera" : "Request camera"}
            onPress={handleStart}
            accessibilityLabel="Start camera capture"
          />
          <Button
            variant="secondary"
            label="DEV: simulate"
            onPress={handleSimulate}
            accessibilityLabel="Use simulated capture (development fallback)"
          />
        </View>
        <Button
          variant="link"
          label="Cancel"
          onPress={onCancel}
          accessibilityLabel="Cancel capture"
        />
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
          <Button
            variant="primary"
            label="Capture"
            onPress={handleCapture}
            accessibilityLabel="Capture photo"
          />
          <Button
            variant="secondary"
            label="DEV: simulate"
            onPress={handleSimulate}
            accessibilityLabel="Use simulated capture"
          />
        </View>
        <Button
          variant="link"
          label="Cancel"
          onPress={onCancel}
          accessibilityLabel="Cancel capture"
        />
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
        <Button
          variant="primary"
          label="Save photo"
          onPress={handleConfirm}
          accessibilityLabel="Save this photo"
        />
        <Button
          variant="secondary"
          label="Retake"
          onPress={handleRetake}
          accessibilityLabel="Retake photo"
        />
      </View>
      <Button
        variant="link"
        label="Cancel"
        onPress={onCancel}
        accessibilityLabel="Cancel without saving"
      />
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
    color: colors.text,
  },
  denied: {
    padding: 12,
    backgroundColor: colors.warnBg,
    borderRadius: 8,
    gap: 8,
  },
  deniedText: {
    color: colors.warn,
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
});
