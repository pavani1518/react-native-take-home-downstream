import React from "react";
import { act, render } from "@testing-library/react-native";
import * as Location from "expo-location";
import { useLocation } from "../useLocation";

function Probe({ onReady }: { onReady: (l: ReturnType<typeof useLocation>) => void }) {
  const loc = useLocation();
  onReady(loc);
  return null;
}

describe("useLocation.capture", () => {
  it("returns 'ok' with lat/lng when permission + services + position succeed", async () => {
    let api: any;
    render(<Probe onReady={(l) => (api = l)} />);
    let result: any;
    await act(async () => {
      result = await api.capture();
    });
    expect(result).toMatchObject({
      kind: "ok",
      latitude: 30.27,
      longitude: -97.74,
    });
  });

  it("returns 'denied' when permission denied (both check + request)", async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: false,
    });
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: false,
    });
    let api: any;
    render(<Probe onReady={(l) => (api = l)} />);
    let result: any;
    await act(async () => {
      result = await api.capture();
    });
    expect(result).toEqual({ kind: "denied" });
  });

  it("returns 'unavailable' when services disabled", async () => {
    (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValueOnce(false);
    let api: any;
    render(<Probe onReady={(l) => (api = l)} />);
    let result: any;
    await act(async () => {
      result = await api.capture();
    });
    expect(result).toEqual({ kind: "unavailable" });
  });

  it("returns 'error' when getCurrentPositionAsync throws", async () => {
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValueOnce(
      new Error("GPS broken")
    );
    let api: any;
    render(<Probe onReady={(l) => (api = l)} />);
    let result: any;
    await act(async () => {
      result = await api.capture();
    });
    expect(result.kind).toBe("error");
    expect(result.message).toMatch(/GPS broken/);
  });

  it("retries permission request when initial check denied", async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: false,
    });
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: true,
    });
    let api: any;
    render(<Probe onReady={(l) => (api = l)} />);
    let result: any;
    await act(async () => {
      result = await api.capture();
    });
    expect(result.kind).toBe("ok");
  });
});
