import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { FilterBar } from "../FilterBar";

const baseProps = {
  query: "",
  onQueryChange: () => {},
  statuses: [],
  onStatusToggle: () => {},
  dateScope: "all" as const,
  onDateScopeChange: () => {},
  evidence: null,
  onEvidenceChange: () => {},
};

describe("FilterBar", () => {
  it("renders all spec-required chip labels (verbatim)", () => {
    render(<FilterBar {...baseProps} />);
    for (const label of [
      "Today",
      "Next 7 days",
      "All",
      "Missing proof",
      "Scan mismatch",
      "Ready to complete",
    ]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("fires onQueryChange when search input changes", () => {
    let captured = "";
    render(<FilterBar {...baseProps} onQueryChange={(q) => (captured = q)} />);
    fireEvent.changeText(screen.getByLabelText("Search workboard"), "hub");
    expect(captured).toBe("hub");
  });

  it("fires onDateScopeChange when a date chip is pressed", () => {
    let chosen: string | null = null;
    render(
      <FilterBar
        {...baseProps}
        onDateScopeChange={(d) => (chosen = d)}
      />
    );
    fireEvent.press(screen.getByLabelText("Today"));
    expect(chosen).toBe("today");
  });

  it("fires onStatusToggle when a status chip is pressed", () => {
    let toggled: string | null = null;
    render(
      <FilterBar
        {...baseProps}
        onStatusToggle={(s) => (toggled = s)}
      />
    );
    fireEvent.press(screen.getByLabelText("Blocked"));
    expect(toggled).toBe("blocked");
  });

  it("fires onEvidenceChange and toggles off when re-pressed", () => {
    let last: string | null = "x";
    render(
      <FilterBar
        {...baseProps}
        evidence="missing_proof"
        onEvidenceChange={(e) => (last = e)}
      />
    );
    fireEvent.press(screen.getByLabelText("Missing proof"));
    expect(last).toBeNull();
  });
});
