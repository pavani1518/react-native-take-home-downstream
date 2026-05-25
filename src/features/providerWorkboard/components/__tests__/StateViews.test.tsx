import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { EmptyView, ErrorView, LoadingView } from "../StateViews";

describe("LoadingView", () => {
  it("renders 'Loading workboard…' text", () => {
    render(<LoadingView />);
    expect(screen.getByText(/Loading/)).toBeTruthy();
  });
});

describe("EmptyView", () => {
  it("renders message", () => {
    render(<EmptyView message="No sites match" />);
    expect(screen.getByText("No sites match")).toBeTruthy();
    expect(screen.getByText(/Nothing to show/)).toBeTruthy();
  });
});

describe("ErrorView", () => {
  it("renders message and triggers onRetry", () => {
    let retried = false;
    render(<ErrorView message="boom" onRetry={() => (retried = true)} />);
    expect(screen.getByText("boom")).toBeTruthy();
    expect(screen.getByText(/Something went wrong/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Retry"));
    expect(retried).toBe(true);
  });
});
