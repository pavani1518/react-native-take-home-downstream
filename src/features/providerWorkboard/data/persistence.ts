// AsyncStorage adapter for the retry queue (§10).
// Persists evidence IDs whose upload has failed and survives screen navigation.

import AsyncStorage from "@react-native-async-storage/async-storage";

const RETRY_QUEUE_KEY = "@orbit/retryQueue/v1";
const LAST_REFRESH_KEY = "@orbit/lastRefreshedAt/v1";

export async function loadRetryQueue(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RETRY_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export async function saveRetryQueue(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(ids));
}

export async function enqueueRetry(id: string): Promise<string[]> {
  const current = await loadRetryQueue();
  if (current.includes(id)) return current;
  const next = [...current, id];
  await saveRetryQueue(next);
  return next;
}

export async function dequeueRetry(id: string): Promise<string[]> {
  const current = await loadRetryQueue();
  const next = current.filter((x) => x !== id);
  await saveRetryQueue(next);
  return next;
}

export async function loadLastRefreshed(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_REFRESH_KEY);
  } catch {
    return null;
  }
}

export async function saveLastRefreshed(iso: string): Promise<void> {
  await AsyncStorage.setItem(LAST_REFRESH_KEY, iso);
}
