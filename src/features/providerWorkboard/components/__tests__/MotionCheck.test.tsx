import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { MotionCheck } from "../MotionCheck";

describe("MotionCheck", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders heading + Start + Close", () => {
    render(
      <MotionCheck visitId="v1" onCancel={() => {}} onComplete={() => {}} />
    );
    expect(screen.getByText(/Equipment handling check/)).toBeTruthy();
    expect(screen.getByLabelText("Start motion check")).toBeTruthy();
    expect(screen.getByLabelText("Close motion check")).toBeTruthy();
  });

  it("Close calls onCancel", () => {
    let cancelled = false;
    render(
      <MotionCheck
        visitId="v1"
        onCancel={() => (cancelled = true)}
        onComplete={() => {}}
      />
    );
    fireEvent.press(screen.getByLabelText("Close motion check"));
    expect(cancelled).toBe(true);
  });

  it("Start → 4-second timer → onComplete fires with a result", async () => {
    let captured: any = null;
    render(
      <MotionCheck
        visitId="v1"
        onCancel={() => {}}
        onComplete={(args) => (captured = args)}
      />
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Start motion check"));
    });
    await act(async () => {
      jest.advanceTimersByTime(4100);
    });
    expect(captured).not.toBeNull();
    expect(["stable", "rough_motion_detected"]).toContain(captured.result);
  });
});
