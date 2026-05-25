import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SiteDetailSheet } from "../SiteDetailSheet";
import { makeSite, makeVisit, NOW } from "../../domain/__tests__/fixtures";

function Wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return (
    <QueryClientProvider client={client}>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

describe("SiteDetailSheet", () => {
  it("renders nothing visible when site is null", () => {
    render(
      <Wrapper>
        <SiteDetailSheet
          site={null}
          visible={false}
          evidence={[]}
          scans={[]}
          motion={[]}
          now={NOW}
          onClose={() => {}}
        />
      </Wrapper>
    );
    expect(screen.queryByLabelText("Close site details")).toBeNull();
  });

  it("renders site name, customer, address, contact, and §3 sections", () => {
    const site = makeSite({
      siteName: "Hub A",
      customerName: "Acme",
      contactName: "Site Contact",
      contactPhone: "+1-555-0100",
      visits: [
        makeVisit({
          id: "v1",
          equipmentLabel: "Walk-in Cooler #A12",
          // Schedule in the future so the "Next visit" section renders.
          scheduledStart: "2026-05-26T10:00:00.000Z",
          scheduledEnd: "2026-05-26T11:00:00.000Z",
          evidenceRequired: true,
          motionCheckRequired: true,
          locationRequired: true,
        }),
      ],
    });
    render(
      <Wrapper>
        <SiteDetailSheet
          site={site}
          visible
          evidence={[]}
          scans={[]}
          motion={[]}
          now={NOW}
          onClose={() => {}}
        />
      </Wrapper>
    );
    expect(screen.getByText("Hub A")).toBeTruthy();
    expect(screen.getByText("Acme")).toBeTruthy();
    expect(screen.getByText(/Site Contact/)).toBeTruthy();
    // §3 sections
    // §3 section titles — Section component uppercases them via textTransform.
    // Use case-insensitive matchers so the assertion isn't fragile to that.
    expect(screen.getByText(/^Status$/i)).toBeTruthy();
    expect(screen.getByText(/^Next visit$/i)).toBeTruthy();
    expect(screen.getByText(/^Evidence completion$/i)).toBeTruthy();
    expect(screen.getByText(/Hardware required at this site/i)).toBeTruthy();
    // Hardware bullets shown
    expect(screen.getByText(/Camera \(evidence capture\)/)).toBeTruthy();
    expect(screen.getByText(/Accelerometer \(motion check\)/)).toBeTruthy();
    expect(screen.getByText(/Location \(foreground\)/)).toBeTruthy();
  });

  it("invokes onClose when the Close header button is pressed", () => {
    let closed = false;
    const site = makeSite();
    render(
      <Wrapper>
        <SiteDetailSheet
          site={site}
          visible
          evidence={[]}
          scans={[]}
          motion={[]}
          now={NOW}
          onClose={() => (closed = true)}
        />
      </Wrapper>
    );
    fireEvent.press(screen.getByLabelText("Close site details"));
    expect(closed).toBe(true);
  });
});
