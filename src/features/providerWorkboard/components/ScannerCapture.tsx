// §7 barcode/QR scan. Inline in visit sheet. Includes labeled dev fallback
// for manual input when no camera is available.

import { CameraView } from "expo-camera";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { classifyScan } from "../domain";
import { track } from "../analytics";
import { openAppSettings } from "../native/permissions";
import { useCameraPermissionState } from "../native/useCameraPermission";
import { Button, colors } from "./ui";

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
          <Button
            variant="secondary"
            label="Rescan"
            onPress={handleRescan}
            accessibilityLabel="Rescan asset"
          />
          <Button
            variant="primary"
            label="Done"
            onPress={onCancel}
          />
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
        <Button
          variant="primary"
          label={state === "granted" ? (active ? "Scanning…" : "Start scan") : "Request camera"}
          onPress={start}
          accessibilityLabel="Start scanner"
        />
        {state === "denied" && (
          <Button
            variant="secondary"
            label="Settings"
            onPress={openAppSettings}
            accessibilityLabel="Open device settings"
          />
        )}
      </View>

      <View style={styles.manual}>
        <Text style={styles.manualLabel}>DEV fallback — manual entry</Text>
        <View style={styles.manualRow}>
          <TextInput
            value={manualInput}
            onChangeText={setManualInput}
            placeholder="Scan / type asset code"
            placeholderTextColor={colors.placeholder}
            style={styles.manualInput}
            accessibilityLabel="Manually enter asset code"
            autoCorrect={false}
            autoCapitalize="characters"
          />
          <Button
            variant="secondary"
            label="Submit"
            onPress={handleManual}
            accessibilityLabel="Submit manual scan"
          />
        </View>
      </View>

      <Button
        variant="link"
        label="Cancel"
        onPress={onCancel}
        accessibilityLabel="Cancel scan"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16, gap: 12 },
  heading: { fontSize: 16, fontWeight: "700", color: colors.text },
  subtle: { fontSize: 13, color: colors.textSubtle },
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
    backgroundColor: colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: colors.textSubtle },
  banner: {
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  match: { backgroundColor: colors.successBg },
  mismatch: { backgroundColor: colors.dangerBg },
  matchText: { color: colors.success, fontWeight: "700" },
  mismatchText: { color: colors.danger, fontWeight: "700" },
  codeText: { color: colors.textMuted, fontSize: 13 },
  btnRow: { flexDirection: "row", gap: 10 },
  manual: {
    marginTop: 8,
    padding: 10,
    backgroundColor: colors.warnBg,
    borderRadius: 8,
    gap: 6,
  },
  manualLabel: { color: colors.warn, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  manualRow: { flexDirection: "row", gap: 8 },
  manualInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
    color: colors.text,
  },
});
