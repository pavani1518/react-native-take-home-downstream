// §7 barcode/QR scan. Inline in visit sheet. Includes labeled dev fallback
// for manual input when no camera is available.

import { CameraView } from "expo-camera";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { classifyScan } from "../domain";
import { track } from "../analytics";
import { openAppSettings } from "../native/permissions";
import { useCameraPermissionState } from "../native/useCameraPermission";

export function ScannerCapture({
  visitId,
  expectedAssetCode,
  onCancel,
  onResult,
}: {
  visitId: string;
  expectedAssetCode: string;
  onCancel: () => void;
  onResult: (args: {
    scannedAssetCode: string;
    result: "match" | "mismatch";
  }) => void;
}) {
  const { state, request } = useCameraPermissionState();
  const [active, setActive] = useState(false);
  const [scannedValue, setScannedValue] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");

  const start = async () => {
    if (state !== "granted") {
      const next = await request();
      if (next !== "granted") return;
    }
    setActive(true);
  };

  const handleScan = (value: string) => {
    if (scannedValue) return; // ignore subsequent reads after first capture
    setScannedValue(value);
    setActive(false);
    const result = classifyScan(expectedAssetCode, value);
    track("asset_scan_completed", {
      visit_id: visitId,
      expected: expectedAssetCode,
      scanned: value,
      result,
    });
    if (result === "mismatch") {
      track("asset_scan_mismatch", {
        visit_id: visitId,
        expected: expectedAssetCode,
        scanned: value,
      });
    }
    onResult({ scannedAssetCode: value, result });
  };

  const handleManual = () => {
    if (!manualInput.trim()) return;
    handleScan(manualInput.trim());
  };

  const handleRescan = () => {
    setScannedValue(null);
    setManualInput("");
    setActive(false);
  };

  if (scannedValue) {
    const result = classifyScan(expectedAssetCode, scannedValue);
    return (
      <View style={styles.panel}>
        <Text style={styles.heading}>Scan result</Text>
        <View style={[styles.banner, result === "match" ? styles.match : styles.mismatch]}>
          <Text style={result === "match" ? styles.matchText : styles.mismatchText}>
            {result === "match" ? "Asset matches expected." : "Scanned asset does not match expected."}
          </Text>
          <Text style={styles.codeText}>Expected: {expectedAssetCode}</Text>
          <Text style={styles.codeText}>Scanned: {scannedValue}</Text>
        </View>
        <View style={styles.btnRow}>
          <Pressable
            onPress={handleRescan}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Rescan asset"
          >
            <Text style={styles.secondaryText}>Rescan</Text>
          </Pressable>
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.primaryText}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Verify asset</Text>
      <Text style={styles.subtle}>Expected code: {expectedAssetCode}</Text>
      {active ? (
        <View style={styles.cameraWrap}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "ean13", "ean8", "code39"] }}
            onBarcodeScanned={({ data }) => handleScan(data)}
          />
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {state === "denied" ? "Camera permission required." : "Camera not active."}
          </Text>
        </View>
      )}

      <View style={styles.btnRow}>
        <Pressable
          onPress={start}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Start scanner"
        >
          <Text style={styles.primaryText}>
            {state === "granted" ? (active ? "Scanning…" : "Start scan") : "Request camera"}
          </Text>
        </Pressable>
        {state === "denied" && (
          <Pressable
            onPress={openAppSettings}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Open device settings"
          >
            <Text style={styles.secondaryText}>Settings</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.manual}>
        <Text style={styles.manualLabel}>DEV fallback — manual entry</Text>
        <View style={styles.manualRow}>
          <TextInput
            value={manualInput}
            onChangeText={setManualInput}
            placeholder="Scan / type asset code"
            placeholderTextColor="#9CA3AF"
            style={styles.manualInput}
            accessibilityLabel="Manually enter asset code"
            autoCorrect={false}
            autoCapitalize="characters"
          />
          <Pressable
            onPress={handleManual}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Submit manual scan"
          >
            <Text style={styles.secondaryText}>Submit</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={onCancel}
        style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Cancel scan"
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16, gap: 12 },
  heading: { fontSize: 16, fontWeight: "700", color: "#111827" },
  subtle: { fontSize: 13, color: "#6B7280" },
  cameraWrap: {
    height: 240,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camera: { flex: 1 },
  placeholder: {
    height: 120,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: "#6B7280" },
  banner: {
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  match: { backgroundColor: "#DCFCE7" },
  mismatch: { backgroundColor: "#FEE2E2" },
  matchText: { color: "#166534", fontWeight: "700" },
  mismatchText: { color: "#991B1B", fontWeight: "700" },
  codeText: { color: "#374151", fontSize: 13 },
  btnRow: { flexDirection: "row", gap: 10 },
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
  cancelBtn: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  cancelText: { color: "#6B7280", fontWeight: "600" },
  pressed: { opacity: 0.7 },
  manual: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    gap: 6,
  },
  manualLabel: { color: "#92400E", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  manualRow: { flexDirection: "row", gap: 8 },
  manualInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    color: "#111827",
  },
});
