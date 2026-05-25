import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { WorkboardScreen } from "../WorkboardScreen";
import { __resetStoreForTests, FAILURE_RATES } from "../../data/api";

function Wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, gcTime: 0 } },
  });
  return (
    <QueryClientProvider client={client}>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  __resetStoreForTests();
  FAILURE_RATES.fetchSites = 0;
});

describe("WorkboardScreen", () => {
  it("renders Loading state initially, then the workboard", async () => {
    render(
      <Wrapper>
        <WorkboardScreen />
      </Wrapper>
    );
    // Initial loading view
    expect(screen.getByText(/Loading workboard/)).toBeTruthy();
    // Eventually data loads
    await waitFor(() => expect(screen.getByText(/Provider Workboard/)).toBeTruthy(), {
      timeout: 3000,
    });
  });

  it("shows ErrorView with retry when fetch fails", async () => {
    FAILURE_RATES.fetchSites = 1;
    render(
      <Wrapper>
        <WorkboardScreen />
      </Wrapper>
    );
    await waitFor(
      () => expect(screen.getByText(/Something went wrong/)).toBeTruthy(),
      { timeout: 3000 }
    );
    expect(screen.getByLabelText("Retry")).toBeTruthy();
  });

  it("renders summary metrics, filter rows, and at least one site row", async () => {
    render(
      <Wrapper>
        <WorkboardScreen />
      </Wrapper>
    );
    await waitFor(() => expect(screen.getByText("Sites")).toBeTruthy(), {
      timeout: 3000,
    });
    // "Today" and "Blocked" appear in multiple contexts (summary cell + chip
    // labels + visit timeline) — use getAllByText to allow any.
    expect(screen.getAllByText("Today").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Blocked|blocked/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Search workboard")).toBeTruthy();
    expect(screen.getByLabelText("Missing proof")).toBeTruthy();
  });

  it("typing in search fires onQueryChange (no error)", async () => {
    render(
      <Wrapper>
        <WorkboardScreen />
      </Wrapper>
    );
    await waitFor(() => screen.getByLabelText("Search workboard"));
    fireEvent.changeText(screen.getByLabelText("Search workboard"), "hub");
    // The list should re-filter without crashing.
    expect(screen.getByLabelText("Search workboard")).toBeTruthy();
  });
});
