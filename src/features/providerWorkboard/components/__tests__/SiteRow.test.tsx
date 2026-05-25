import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SiteRow } from "../SiteRow";
import { makeSite, makeVisit, NOW } from "../../domain/__tests__/fixtures";

describe("SiteRow", () => {
  it("renders all §1 fields", () => {
    const site = makeSite({
      siteName: "Hub A",
      customerName: "Acme",
      priority: "urgent",
      workStatus: "blocked",
      visits: [
        makeVisit({ status: "blocked", scheduledEnd: "2020-01-01T00:00:00Z" }),
      ],
    });
    render(<SiteRow site={site} evidence={[]} now={NOW} onPress={() => {}} />);
    expect(screen.getByText("Hub A")).toBeTruthy();
    expect(screen.getByText("Acme")).toBeTruthy();
    expect(screen.getByText("URGENT")).toBeTruthy();
    expect(screen.getByText("LATE")).toBeTruthy();
  });

  it("hides URGENT badge when priority is normal", () => {
    const site = makeSite({ priority: "normal" });
    render(<SiteRow site={site} evidence={[]} now={NOW} onPress={() => {}} />);
    expect(screen.queryByText("URGENT")).toBeNull();
  });

  it("invokes onPress when the row is tapped", () => {
    const site = makeSite();
    let pressed = false;
    render(
      <SiteRow site={site} evidence={[]} now={NOW} onPress={() => (pressed = true)} />
    );
    fireEvent.press(
      screen.getByLabelText(
        `${site.siteName}, ${site.customerName}, ${site.workStatus.replace("_", " ")}`
      )
    );
    expect(pressed).toBe(true);
  });

  it("renders 'No upcoming' when no future visits", () => {
    const site = makeSite({
      visits: [
        makeVisit({
          status: "completed",
          scheduledStart: "2020-01-01T00:00:00Z",
          scheduledEnd: "2020-01-01T01:00:00Z",
        }),
      ],
    });
    render(<SiteRow site={site} evidence={[]} now={NOW} onPress={() => {}} />);
    expect(screen.getByText("No upcoming")).toBeTruthy();
  });
});
