import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button } from "../ui/Button";

describe("Button", () => {
  it("renders each variant", () => {
    for (const variant of ["primary", "secondary", "danger", "link"] as const) {
      const { unmount } = render(
        <Button label={`btn-${variant}`} variant={variant} onPress={() => {}} />
      );
      expect(screen.getByText(`btn-${variant}`)).toBeTruthy();
      unmount();
    }
  });

  it("shows 'Working…' when pending and ignores presses", () => {
    let count = 0;
    render(<Button label="Save" pending onPress={() => count++} />);
    expect(screen.getByText("Working…")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Save"));
    expect(count).toBe(0);
  });

  it("calls onPress when enabled", () => {
    let pressed = false;
    render(<Button label="Tap" onPress={() => (pressed = true)} />);
    fireEvent.press(screen.getByLabelText("Tap"));
    expect(pressed).toBe(true);
  });

  it("ignores onPress when disabled", () => {
    let pressed = false;
    render(<Button label="Off" disabled onPress={() => (pressed = true)} />);
    fireEvent.press(screen.getByLabelText("Off"));
    expect(pressed).toBe(false);
  });

  it("supports fullHeight + link variants without crashing", () => {
    const { unmount } = render(
      <Button label="L" variant="link" onPress={() => {}} />
    );
    unmount();
    render(<Button label="P" fullHeight variant="primary" onPress={() => {}} />);
    expect(screen.getByText("P")).toBeTruthy();
  });

  it("sets accessibilityState busy when pending and disabled when disabled", () => {
    const { rerender } = render(
      <Button label="X" pending onPress={() => {}} />
    );
    let node = screen.getByLabelText("X");
    expect(node.props.accessibilityState).toMatchObject({ busy: true, disabled: true });

    rerender(<Button label="X" disabled onPress={() => {}} />);
    node = screen.getByLabelText("X");
    expect(node.props.accessibilityState).toMatchObject({ disabled: true });
  });
});
