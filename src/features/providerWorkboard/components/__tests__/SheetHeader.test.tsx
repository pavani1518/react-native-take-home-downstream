import React from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Section } from "../ui/Section";
import { SheetHeader } from "../ui/SheetHeader";

describe("Section", () => {
  it("renders title and children", () => {
    render(
      <Section title="Status">
        <Text>hello</Text>
      </Section>
    );
    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.getByText("hello")).toBeTruthy();
  });
});

describe("SheetHeader", () => {
  it("renders title", () => {
    render(<SheetHeader title="Visit" onClose={() => {}} />);
    expect(screen.getByText("Visit")).toBeTruthy();
  });

  it("invokes onClose when Close is pressed", () => {
    let closed = false;
    render(<SheetHeader title="Hub A" onClose={() => (closed = true)} />);
    fireEvent.press(screen.getByLabelText("Close Hub A"));
    expect(closed).toBe(true);
  });

  it("uses custom accessibilityLabel when provided", () => {
    render(
      <SheetHeader
        title="X"
        onClose={() => {}}
        accessibilityLabel="Close site details"
      />
    );
    expect(screen.getByLabelText("Close site details")).toBeTruthy();
  });
});
