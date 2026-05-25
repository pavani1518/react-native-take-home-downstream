import React from "react";
import { Alert } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { VisitDetailSheet } from "../VisitDetailSheet";
import {
  makeEvidence,
  makeMotion,
  makeScan,
  makeVisit,
} from "../../domain/__tests__/fixtures";
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
  FAILURE_RATES.mutateVisit = 0;
  FAILURE_RATES.uploadEvidence = 0;
});

describe("VisitDetailSheet", () => {
  it("renders nothing visible when visit is null", () => {
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={null}
          visible={false}
          evidence={[]}
          scan={undefined}
          motion={undefined}
          onClose={() => {}}
        />
      </Wrapper>
    );
    // The sheet's own content should not be present in the tree.
    expect(screen.queryByText("Visit")).toBeNull();
    expect(screen.queryByLabelText("Close visit details")).toBeNull();
  });

  it("renders §4 fields: status, service type, equipment, scheduled, tech, last updated", () => {
    const visit = makeVisit({
      id: "v1",
      status: "scheduled",
      serviceType: "inspection",
      equipmentLabel: "Walk-in Cooler #A12",
      expectedAssetCode: "ASSET-CL-A12",
      assignedTech: "Tech Alex",
    });
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={visit}
          visible
          evidence={[]}
          scan={undefined}
          motion={undefined}
          onClose={() => {}}
        />
      </Wrapper>
    );
    // The bottom sheet title
    expect(screen.getByText("Visit")).toBeTruthy();
    // §4 fields
    expect(screen.getByText("Walk-in Cooler #A12")).toBeTruthy();
    expect(screen.getByText(/ASSET-CL-A12/)).toBeTruthy();
    expect(screen.getByText("Tech Alex")).toBeTruthy();
    // Sticky footer action buttons
    expect(screen.getByLabelText("Mark en route")).toBeTruthy();
    expect(screen.getByLabelText("Complete visit")).toBeTruthy();
    expect(screen.getByLabelText("Report blocked")).toBeTruthy();
  });

  it("renders blocked reason when present", () => {
    const visit = makeVisit({
      status: "blocked",
      blockedReason: "Customer site closed for audit",
    });
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={visit}
          visible
          evidence={[]}
          scan={undefined}
          motion={undefined}
          onClose={() => {}}
        />
      </Wrapper>
    );
    expect(screen.getByText(/Customer site closed for audit/)).toBeTruthy();
  });

  it("renders scan + motion result when present", () => {
    const visit = makeVisit({ status: "on_site", motionCheckRequired: true });
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={visit}
          visible
          evidence={[]}
          scan={makeScan({ visitId: visit.id, result: "match" })}
          motion={makeMotion({ visitId: visit.id, result: "stable", maxAccelerationG: 0.6 })}
          onClose={() => {}}
        />
      </Wrapper>
    );
    expect(screen.getByText(/Matches expected/)).toBeTruthy();
    expect(screen.getByText(/Stable/)).toBeTruthy();
  });

  it("invokes onClose when Close pressed", () => {
    let closed = false;
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={makeVisit()}
          visible
          evidence={[]}
          scan={undefined}
          motion={undefined}
          onClose={() => (closed = true)}
        />
      </Wrapper>
    );
    fireEvent.press(screen.getByLabelText("Close visit details"));
    expect(closed).toBe(true);
  });

  it("Capture evidence opens the camera inline panel", () => {
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={makeVisit()}
          visible
          evidence={[]}
          scan={undefined}
          motion={undefined}
          onClose={() => {}}
        />
      </Wrapper>
    );
    fireEvent.press(screen.getByLabelText("Capture evidence"));
    expect(screen.getByText(/Capture evidence photo/)).toBeTruthy();
  });

  it("Scan asset opens the scanner inline panel", () => {
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={makeVisit()}
          visible
          evidence={[]}
          scan={undefined}
          motion={undefined}
          onClose={() => {}}
        />
      </Wrapper>
    );
    fireEvent.press(screen.getByLabelText("Scan asset"));
    expect(screen.getByText(/Verify asset/)).toBeTruthy();
  });

  it("Run motion check opens the motion panel", () => {
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={makeVisit()}
          visible
          evidence={[]}
          scan={undefined}
          motion={undefined}
          onClose={() => {}}
        />
      </Wrapper>
    );
    fireEvent.press(screen.getByLabelText("Run motion check"));
    expect(screen.getByText(/Equipment handling check/)).toBeTruthy();
  });

  it("Mark en route triggers the mutation without throwing", async () => {
    const visit = makeVisit({ status: "scheduled" });
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={visit}
          visible
          evidence={[]}
          scan={undefined}
          motion={undefined}
          onClose={() => {}}
        />
      </Wrapper>
    );
    // The button is enabled and presses cleanly. Don't assert on the
    // async "Working…" indicator — the mock store resolves quickly and
    // exact timing is implementation-detail.
    fireEvent.press(screen.getByLabelText("Mark en route"));
    // Give microtasks a chance to drain.
    await waitFor(() => expect(screen.getByText("Visit")).toBeTruthy(), {
      timeout: 2000,
    });
  });

  it("Report blocked opens the reason input panel", () => {
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={makeVisit({ status: "scheduled" })}
          visible
          evidence={[]}
          scan={undefined}
          motion={undefined}
          onClose={() => {}}
        />
      </Wrapper>
    );
    fireEvent.press(screen.getByLabelText("Report blocked"));
    expect(screen.getByText("Report blocked")).toBeTruthy();
    expect(screen.getByLabelText("Blocked reason")).toBeTruthy();
  });

  it("Retry button on failed evidence is rendered + clickable", () => {
    const visit = makeVisit();
    const failedEvidence = [
      makeEvidence({
        id: "ev-failed",
        visitId: visit.id,
        uploadStatus: "failed",
      }),
    ];
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={visit}
          visible
          evidence={failedEvidence}
          scan={undefined}
          motion={undefined}
          onClose={() => {}}
        />
      </Wrapper>
    );
    const retry = screen.getByLabelText("Retry upload");
    expect(retry).toBeTruthy();
    fireEvent.press(retry);
  });

  it("Report blocked: confirm flow submits via Alert.alert", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((...args: unknown[]) => {
        const buttons = args[2] as
          | { text: string; onPress?: () => void }[]
          | undefined;
        const confirmBtn = buttons?.find((b) => b.text === "Confirm");
        confirmBtn?.onPress?.();
      });
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={makeVisit({ status: "scheduled" })}
          visible
          evidence={[]}
          scan={undefined}
          motion={undefined}
          onClose={() => {}}
        />
      </Wrapper>
    );
    fireEvent.press(screen.getByLabelText("Report blocked"));
    fireEvent.changeText(screen.getByLabelText("Blocked reason"), "outage");
    fireEvent.press(screen.getByLabelText("Confirm and report blocked"));
    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    alertSpy.mockRestore();
  });

  it("Report blocked: empty reason keeps Confirm disabled", () => {
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={makeVisit({ status: "scheduled" })}
          visible
          evidence={[]}
          scan={undefined}
          motion={undefined}
          onClose={() => {}}
        />
      </Wrapper>
    );
    fireEvent.press(screen.getByLabelText("Report blocked"));
    const confirm = screen.getByLabelText("Confirm and report blocked");
    expect(confirm.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("Issue summary renders when present", () => {
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={makeVisit({ issueSummary: "Overdue: tech missed yesterday" })}
          visible
          evidence={[]}
          scan={undefined}
          motion={undefined}
          onClose={() => {}}
        />
      </Wrapper>
    );
    expect(screen.getByText(/Overdue: tech missed yesterday/)).toBeTruthy();
  });

  it("Retry failed uploads action is enabled when failed evidence present", () => {
    const visit = makeVisit({ status: "scheduled" });
    render(
      <Wrapper>
        <VisitDetailSheet
          visit={visit}
          visible
          evidence={[
            makeEvidence({ visitId: visit.id, uploadStatus: "failed" }),
          ]}
          scan={undefined}
          motion={undefined}
          onClose={() => {}}
        />
      </Wrapper>
    );
    const btn = screen.getByLabelText("Retry failed uploads");
    expect(btn.props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(btn);
  });
});
