import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ScannerCapture } from "../ScannerCapture";

describe("ScannerCapture — idle UI", () => {
  it("renders heading + expected code + manual fallback panel", () => {
    render(
      <ScannerCapture
        visitId="v1"
        expectedAssetCode="ASSET-X"
        onCancel={() => {}}
        onResult={() => {}}
      />
    );
    expect(screen.getByText(/Verify asset/)).toBeTruthy();
    expect(screen.getByText(/ASSET-X/)).toBeTruthy();
    expect(screen.getByText(/DEV fallback — manual entry/)).toBeTruthy();
    expect(screen.getByLabelText("Submit manual scan")).toBeTruthy();
  });

  it("invokes onCancel when Cancel is pressed", () => {
    let cancelled = false;
    render(
      <ScannerCapture
        visitId="v1"
        expectedAssetCode="X"
        onCancel={() => (cancelled = true)}
        onResult={() => {}}
      />
    );
    fireEvent.press(screen.getByLabelText("Cancel scan"));
    expect(cancelled).toBe(true);
  });
});

describe("ScannerCapture — manual entry → result", () => {
  it("manual submit with matching code yields result: match and shows Done", () => {
    let captured: { scannedAssetCode: string; result: "match" | "mismatch" } | null = null;
    render(
      <ScannerCapture
        visitId="v1"
        expectedAssetCode="ASSET-X"
        onCancel={() => {}}
        onResult={(r) => (captured = r)}
      />
    );
    fireEvent.changeText(
      screen.getByLabelText("Manually enter asset code"),
      "ASSET-X"
    );
    fireEvent.press(screen.getByLabelText("Submit manual scan"));
    expect(captured).toEqual({ scannedAssetCode: "ASSET-X", result: "match" });
    // The result panel renders
    expect(screen.getByText(/Asset matches expected/)).toBeTruthy();
  });

  it("manual submit with non-matching code yields result: mismatch", () => {
    let captured: any;
    render(
      <ScannerCapture
        visitId="v1"
        expectedAssetCode="ASSET-X"
        onCancel={() => {}}
        onResult={(r) => (captured = r)}
      />
    );
    fireEvent.changeText(
      screen.getByLabelText("Manually enter asset code"),
      "ASSET-WRONG"
    );
    fireEvent.press(screen.getByLabelText("Submit manual scan"));
    expect(captured.result).toBe("mismatch");
    expect(screen.getByText(/does not match expected/)).toBeTruthy();
  });

  it("empty manual input is ignored", () => {
    let called = false;
    render(
      <ScannerCapture
        visitId="v1"
        expectedAssetCode="X"
        onCancel={() => {}}
        onResult={() => (called = true)}
      />
    );
    fireEvent.press(screen.getByLabelText("Submit manual scan"));
    expect(called).toBe(false);
  });

  it("Rescan returns to the verify panel after a scan", () => {
    render(
      <ScannerCapture
        visitId="v1"
        expectedAssetCode="ASSET-X"
        onCancel={() => {}}
        onResult={() => {}}
      />
    );
    fireEvent.changeText(
      screen.getByLabelText("Manually enter asset code"),
      "ASSET-X"
    );
    fireEvent.press(screen.getByLabelText("Submit manual scan"));
    fireEvent.press(screen.getByLabelText("Rescan asset"));
    expect(screen.getByText(/Verify asset/)).toBeTruthy();
  });
});
