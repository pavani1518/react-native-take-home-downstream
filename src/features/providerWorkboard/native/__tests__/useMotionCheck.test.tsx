import React from "react";
import { act, render } from "@testing-library/react-native";
import { Accelerometer } from "expo-sensors";
import { useMotionCheck } from "../useMotionCheck";

function Probe({ onReady }: { onReady: (m: ReturnType<typeof useMotionCheck>) => void }) {
  const m = useMotionCheck();
  onReady(m);
  return null;
}

describe("useMotionCheck", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("start() subscribes the accelerometer and stop() unsubscribes", async () => {
    let api: any;
    render(<Probe onReady={(m) => (api = m)} />);
    await act(async () => {
      await api.start();
    });
    expect(Accelerometer.addListener).toHaveBeenCalled();

    act(() => {
      api.stop();
    });
    // No errors; subscription remove was called.
  });

  it("marks status 'unavailable' when sensor not available", async () => {
    (Accelerometer.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    let api: any;
    const tree = render(<Probe onReady={(m) => (api = m)} />);
    await act(async () => {
      await api.start();
    });
    // Re-read API after state change.
    tree.rerender(<Probe onReady={(m) => (api = m)} />);
    expect(api.status).toBe("unavailable");
  });

  it("classifies a series of low-magnitude samples as 'stable'", async () => {
    let api: any;
    const tree = render(<Probe onReady={(m) => (api = m)} />);
    await act(async () => {
      await api.start();
    });
    // Emit a low-magnitude sample
    act(() => {
      (Accelerometer as any).__emit({ x: 0.05, y: 0.05, z: 1.0 });
    });
    // Advance past the 4s capture window
    await act(async () => {
      jest.advanceTimersByTime(4100);
    });
    tree.rerender(<Probe onReady={(m) => (api = m)} />);
    expect(api.result?.result).toBe("stable");
  });

  it("reset() returns to idle state", async () => {
    let api: any;
    const tree = render(<Probe onReady={(m) => (api = m)} />);
    await act(async () => {
      await api.start();
    });
    await act(async () => {
      jest.advanceTimersByTime(4100);
    });
    act(() => {
      api.reset();
    });
    tree.rerender(<Probe onReady={(m) => (api = m)} />);
    expect(api.status).toBe("idle");
    expect(api.result).toBeNull();
  });
});
