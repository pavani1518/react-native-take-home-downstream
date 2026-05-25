import React from "react";
import { render } from "@testing-library/react-native";
import { useCameraPermissions } from "expo-camera";
import { useCameraPermissionState } from "../useCameraPermission";

function Probe({
  onReady,
}: {
  onReady: (state: ReturnType<typeof useCameraPermissionState>) => void;
}) {
  const state = useCameraPermissionState();
  onReady(state);
  return null;
}

describe("useCameraPermissionState", () => {
  it("returns granted when expo-camera reports granted", () => {
    let captured: any;
    render(<Probe onReady={(s) => (captured = s)} />);
    expect(captured.state).toBe("granted");
  });

  it("returns denied when permission is denied", () => {
    (useCameraPermissions as jest.Mock).mockReturnValueOnce([
      { granted: false, status: "denied" },
      jest.fn(),
    ]);
    let captured: any;
    render(<Probe onReady={(s) => (captured = s)} />);
    expect(captured.state).toBe("denied");
  });

  it("returns unknown when permission is null", () => {
    (useCameraPermissions as jest.Mock).mockReturnValueOnce([null, jest.fn()]);
    let captured: any;
    render(<Probe onReady={(s) => (captured = s)} />);
    expect(captured.state).toBe("unknown");
  });

  it("request() resolves to 'denied' when expo-camera returns not granted", async () => {
    (useCameraPermissions as jest.Mock).mockReturnValueOnce([
      null,
      jest.fn(async () => ({ granted: false, status: "denied" })),
    ]);
    let captured: any;
    render(<Probe onReady={(s) => (captured = s)} />);
    const result = await captured.request();
    expect(result).toBe("denied");
  });

  it("request() resolves to 'granted' when expo-camera returns granted", async () => {
    (useCameraPermissions as jest.Mock).mockReturnValueOnce([
      null,
      jest.fn(async () => ({ granted: true, status: "granted" })),
    ]);
    let captured: any;
    render(<Probe onReady={(s) => (captured = s)} />);
    const result = await captured.request();
    expect(result).toBe("granted");
  });
});
