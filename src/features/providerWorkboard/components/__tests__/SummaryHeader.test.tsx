import React from "react";
import { render, screen } from "@testing-library/react-native";
import { SummaryHeader } from "../SummaryHeader";

describe("SummaryHeader", () => {
  it("renders all 6 metrics from §2", () => {
    render(
      <SummaryHeader
        summary={{
          totalSites: 20,
          visitsDueToday: 5,
          blockedVisits: 2,
          urgentSites: 3,
          visitsMissingEvidence: 7,
          failedOrQueuedUploads: 1,
        }}
      />
    );
    for (const label of ["Sites", "Today", "Blocked", "Urgent", "Missing", "Uploads"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText("20")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
  });

  it("renders zeros without crashing", () => {
    render(
      <SummaryHeader
        summary={{
          totalSites: 0,
          visitsDueToday: 0,
          blockedVisits: 0,
          urgentSites: 0,
          visitsMissingEvidence: 0,
          failedOrQueuedUploads: 0,
        }}
      />
    );
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });
});
