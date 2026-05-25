import React from "react";
import { act, render } from "@testing-library/react-native";
import { useNow } from "../useNow";

function Probe({ onTick }: { onTick: (n: Date) => void }) {
  const now = useNow();
  onTick(now);
  return null;
}

describe("useNow", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns a Date on first render", () => {
    let captured: Date | null = null;
    render(<Probe onTick={(n) => (captured = n)} />);
    expect(captured).toBeInstanceOf(Date);
  });

  it("updates roughly every minute", () => {
    const ticks: Date[] = [];
    render(<Probe onTick={(n) => ticks.push(n)} />);
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    // First render + at least one timer-driven update
    expect(ticks.length).toBeGreaterThanOrEqual(2);
  });

  it("clears the interval on unmount (no errors after unmount)", () => {
    const tree = render(<Probe onTick={() => {}} />);
    tree.unmount();
    act(() => {
      jest.advanceTimersByTime(120_000);
    });
    // If interval leaked, state update on unmounted component would warn.
    // This test passes if no exception is thrown.
  });
});
