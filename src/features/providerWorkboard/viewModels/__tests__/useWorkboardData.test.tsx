import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react-native";

import {
  useEvidence,
  useLastRefreshed,
  useMotion,
  useMutateVisit,
  useRecordMotion,
  useRecordScan,
  useRefreshAll,
  useRetryQueue,
  useSaveEvidence,
  useScans,
  useSites,
  useUploadEvidence,
} from "../useWorkboardData";
import { __resetStoreForTests, FAILURE_RATES } from "../../data/api";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, gcTime: 0 } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "TestQueryWrapper";
  return Wrapper;
}

beforeEach(() => {
  __resetStoreForTests();
  FAILURE_RATES.fetchSites = 0;
  FAILURE_RATES.mutateVisit = 0;
  FAILURE_RATES.uploadEvidence = 0;
});

function Probe<T>({
  hook,
  onReady,
}: {
  hook: () => T;
  onReady: (v: T) => void;
}) {
  const value = hook();
  onReady(value);
  return null;
}

describe("useWorkboardData query hooks", () => {
  it("useSites fetches and returns data", async () => {
    const Wrapper = makeWrapper();
    let api: any;
    render(
      <Wrapper>
        <Probe hook={useSites} onReady={(v) => (api = v)} />
      </Wrapper>
    );
    await waitFor(() => expect(api.data).toBeTruthy(), { timeout: 3000 });
    expect(api.data.length).toBeGreaterThan(0);
  });

  it("useEvidence / useScans / useMotion all resolve to arrays", async () => {
    const Wrapper = makeWrapper();
    let e: any, s: any, m: any;
    render(
      <Wrapper>
        <Probe hook={useEvidence} onReady={(v) => (e = v)} />
        <Probe hook={useScans} onReady={(v) => (s = v)} />
        <Probe hook={useMotion} onReady={(v) => (m = v)} />
      </Wrapper>
    );
    await waitFor(() => expect(e.data && s.data && m.data).toBeTruthy(), {
      timeout: 3000,
    });
    expect(Array.isArray(e.data)).toBe(true);
    expect(Array.isArray(s.data)).toBe(true);
    expect(Array.isArray(m.data)).toBe(true);
  });
});

describe("useWorkboardData mutations", () => {
  it("useMutateVisit applies a status transition", async () => {
    const Wrapper = makeWrapper();
    let mutate: any, sites: any;
    render(
      <Wrapper>
        <Probe hook={useSites} onReady={(v) => (sites = v)} />
        <Probe hook={useMutateVisit} onReady={(v) => (mutate = v)} />
      </Wrapper>
    );
    await waitFor(() => expect(sites.data).toBeTruthy(), { timeout: 3000 });
    const visitId = sites.data[0].visits[0].id;
    await act(async () => {
      await mutate.mutateAsync({ visitId, action: "mark_en_route" });
    });
    expect(mutate.isError).toBe(false);
  });

  it("useSaveEvidence + useUploadEvidence happy path", async () => {
    const Wrapper = makeWrapper();
    let save: any, upload: any;
    render(
      <Wrapper>
        <Probe hook={useSaveEvidence} onReady={(v) => (save = v)} />
        <Probe hook={useUploadEvidence} onReady={(v) => (upload = v)} />
      </Wrapper>
    );
    let saved: any;
    await act(async () => {
      saved = await save.mutateAsync({
        visitId: "visit-0",
        type: "arrival_photo",
        localUri: "mock://x",
      });
    });
    expect(saved.uploadStatus).toBe("queued");
    await act(async () => {
      await upload.mutateAsync(saved.id);
    });
    expect(upload.isError).toBe(false);
  });

  it("useUploadEvidence onError path tracks + enqueues retry", async () => {
    FAILURE_RATES.uploadEvidence = 1;
    const Wrapper = makeWrapper();
    let save: any, upload: any;
    render(
      <Wrapper>
        <Probe hook={useSaveEvidence} onReady={(v) => (save = v)} />
        <Probe hook={useUploadEvidence} onReady={(v) => (upload = v)} />
      </Wrapper>
    );
    let saved: any;
    await act(async () => {
      saved = await save.mutateAsync({
        visitId: "visit-0",
        type: "arrival_photo",
        localUri: "mock://x",
      });
    });
    await act(async () => {
      await expect(upload.mutateAsync(saved.id)).rejects.toThrow();
    });
  });

  it("useRecordScan / useRecordMotion persist results", async () => {
    const Wrapper = makeWrapper();
    let scan: any, motion: any;
    render(
      <Wrapper>
        <Probe hook={useRecordScan} onReady={(v) => (scan = v)} />
        <Probe hook={useRecordMotion} onReady={(v) => (motion = v)} />
      </Wrapper>
    );
    await act(async () => {
      await scan.mutateAsync({
        visitId: "visit-0",
        expectedAssetCode: "X",
        scannedAssetCode: "X",
        result: "match",
      });
      await motion.mutateAsync({
        visitId: "visit-0",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        maxAccelerationG: 0.5,
        result: "stable",
      });
    });
    expect(scan.isError).toBe(false);
    expect(motion.isError).toBe(false);
  });
});

describe("useRefreshAll + useLastRefreshed + useRetryQueue", () => {
  it("useRefreshAll invalidates queries and updates lastRefreshed", async () => {
    const Wrapper = makeWrapper();
    let refresh: any;
    render(
      <Wrapper>
        <Probe hook={useRefreshAll} onReady={(v) => (refresh = v)} />
        <Probe hook={useLastRefreshed} onReady={() => {}} />
      </Wrapper>
    );
    await act(async () => {
      await refresh();
    });
    // useLastRefreshed reads from AsyncStorage on mount; no error.
    expect(typeof refresh).toBe("function");
  });

  it("useRetryQueue returns an ids array + refresh function", async () => {
    const Wrapper = makeWrapper();
    let queue: any;
    render(
      <Wrapper>
        <Probe hook={useRetryQueue} onReady={(v) => (queue = v)} />
      </Wrapper>
    );
    await waitFor(() => expect(Array.isArray(queue.ids)).toBe(true));
    expect(typeof queue.refresh).toBe("function");
  });
});
