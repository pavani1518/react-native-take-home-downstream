import React from "react";
import { render, screen } from "@testing-library/react-native";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders neutral by default", () => {
    render(<Badge>LATE</Badge>);
    expect(screen.getByText("LATE")).toBeTruthy();
  });

  it("renders each tone variant without throwing", () => {
    for (const tone of ["neutral", "info", "warn", "danger", "success"] as const) {
      const { unmount } = render(<Badge tone={tone}>{tone}</Badge>);
      expect(screen.getByText(tone)).toBeTruthy();
      unmount();
    }
  });

  it("displays its children as text", () => {
    render(<Badge tone="danger">URGENT</Badge>);
    expect(screen.getByText("URGENT")).toBeTruthy();
  });
});
