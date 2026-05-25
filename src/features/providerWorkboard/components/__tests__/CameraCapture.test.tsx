import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { CameraCapture } from "../CameraCapture";

describe("CameraCapture — idle phase", () => {
  it("renders the heading + Open camera + DEV: simulate buttons", () => {
    render(
      <CameraCapture
        visitId="v1"
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(screen.getByText(/Capture evidence photo/)).toBeTruthy();
    expect(screen.getByLabelText("Start camera capture")).toBeTruthy();
    expect(
      screen.getByLabelText("Use simulated capture (development fallback)")
    ).toBeTruthy();
  });

  it("invokes onCancel when Cancel is pressed", () => {
    let cancelled = false;
    render(
      <CameraCapture
        visitId="v1"
        onCancel={() => (cancelled = true)}
        onConfirm={() => {}}
      />
    );
    fireEvent.press(screen.getByLabelText("Cancel capture"));
    expect(cancelled).toBe(true);
  });
});

describe("CameraCapture — DEV simulate happy path", () => {
  it("simulate → preview → save invokes onConfirm with a URI", () => {
    let savedUri: string | null = null;
    render(
      <CameraCapture
        visitId="v1"
        onCancel={() => {}}
        onConfirm={(uri) => (savedUri = uri)}
      />
    );

    // Simulate triggers the preview phase
    fireEvent.press(
      screen.getByLabelText("Use simulated capture (development fallback)")
    );

    // Preview phase shows Save photo button
    expect(screen.getByText(/Confirm photo/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Save this photo"));
    expect(savedUri).toMatch(/^https?:\/\//);
  });

  it("Retake from preview returns to framing", () => {
    render(
      <CameraCapture visitId="v1" onCancel={() => {}} onConfirm={() => {}} />
    );
    fireEvent.press(
      screen.getByLabelText("Use simulated capture (development fallback)")
    );
    fireEvent.press(screen.getByLabelText("Retake photo"));
    // After retake we're in framing phase (camera view visible)
    expect(screen.getByLabelText("Capture photo")).toBeTruthy();
  });

  it("Capture from framing without a real camera falls back to simulate", async () => {
    let savedUri: string | null = null;
    render(
      <CameraCapture
        visitId="v1"
        onCancel={() => {}}
        onConfirm={(uri) => (savedUri = uri)}
      />
    );
    // Go to framing first — ensurePermission is async, so we wait for the
    // framing phase to be reflected in the rendered tree.
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Start camera capture"));
    });
    await waitFor(() => screen.getByLabelText("Capture photo"));
    // Press Capture — mocked CameraView won't take a real picture, so the
    // handler falls through to handleSimulate.
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Capture photo"));
    });
    await waitFor(() => screen.getByLabelText("Save this photo"));
    fireEvent.press(screen.getByLabelText("Save this photo"));
    expect(savedUri).toBeTruthy();
  });
});
