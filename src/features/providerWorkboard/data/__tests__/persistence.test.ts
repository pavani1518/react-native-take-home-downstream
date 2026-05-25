// Cover the AsyncStorage adapter used by the retry queue + last-refreshed.
// AsyncStorage is mocked in-memory globally via jest.setup.ts.

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  dequeueRetry,
  enqueueRetry,
  loadLastRefreshed,
  loadRetryQueue,
  saveLastRefreshed,
  saveRetryQueue,
} from "../persistence";

beforeEach(async () => {
  // Clear our mock store between tests.
  await AsyncStorage.removeItem("@orbit/retryQueue/v1");
  await AsyncStorage.removeItem("@orbit/lastRefreshedAt/v1");
});

describe("retry queue", () => {
  it("loadRetryQueue returns [] when nothing stored", async () => {
    expect(await loadRetryQueue()).toEqual([]);
  });

  it("enqueueRetry adds id and persists", async () => {
    const after = await enqueueRetry("ev-1");
    expect(after).toEqual(["ev-1"]);
    expect(await loadRetryQueue()).toEqual(["ev-1"]);
  });

  it("enqueueRetry is idempotent for the same id", async () => {
    await enqueueRetry("ev-1");
    const after = await enqueueRetry("ev-1");
    expect(after).toEqual(["ev-1"]);
  });

  it("dequeueRetry removes id from the queue", async () => {
    await enqueueRetry("ev-1");
    await enqueueRetry("ev-2");
    const after = await dequeueRetry("ev-1");
    expect(after).toEqual(["ev-2"]);
  });

  it("dequeueRetry is a no-op for unknown id", async () => {
    await enqueueRetry("ev-1");
    const after = await dequeueRetry("does-not-exist");
    expect(after).toEqual(["ev-1"]);
  });

  it("saveRetryQueue overwrites any prior value", async () => {
    await saveRetryQueue(["a", "b", "c"]);
    expect(await loadRetryQueue()).toEqual(["a", "b", "c"]);
    await saveRetryQueue(["x"]);
    expect(await loadRetryQueue()).toEqual(["x"]);
  });

  it("loadRetryQueue tolerates malformed JSON", async () => {
    await AsyncStorage.setItem("@orbit/retryQueue/v1", "this is not json");
    expect(await loadRetryQueue()).toEqual([]);
  });

  it("loadRetryQueue tolerates non-array JSON", async () => {
    await AsyncStorage.setItem("@orbit/retryQueue/v1", '{"oops":true}');
    expect(await loadRetryQueue()).toEqual([]);
  });

  it("loadRetryQueue filters out non-string members", async () => {
    await AsyncStorage.setItem("@orbit/retryQueue/v1", '["good", 42, null]');
    expect(await loadRetryQueue()).toEqual(["good"]);
  });
});

describe("last refreshed timestamp", () => {
  it("returns null when nothing stored", async () => {
    expect(await loadLastRefreshed()).toBeNull();
  });

  it("round-trips an ISO timestamp", async () => {
    const iso = "2026-05-24T15:30:00.000Z";
    await saveLastRefreshed(iso);
    expect(await loadLastRefreshed()).toBe(iso);
  });
});
