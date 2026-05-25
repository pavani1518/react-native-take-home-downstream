// Accelerometer motion check (§8). Subscribes ONLY while active,
// unsubscribes on cleanup. Returns progress + result.

import { Accelerometer } from "expo-sensors";
import type { Subscription } from "expo-sensors/build/DeviceSensor";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  classifyMotion,
  magnitude,
  type AccelSample,
} from "../domain";
import { track } from "../analytics";
import type { MotionResult } from "../types";

const CAPTURE_MS = 4000;
const UPDATE_INTERVAL_MS = 100;

type Status = "idle" | "checking-availability" | "unavailable" | "active" | "done";

export function useMotionCheck() {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    maxG: number;
    result: MotionResult;
    startedAt: string;
    completedAt: string;
  } | null>(null);

  const subRef = useRef<Subscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const samplesRef = useRef<AccelSample[]>([]);
  const maxGRef = useRef(0);

  const stop = useCallback(() => {
    subRef.current?.remove();
    subRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    setStatus("checking-availability");
    let available = false;
    try {
      available = await Accelerometer.isAvailableAsync();
    } catch {
      available = false;
    }
    if (!available) {
      setStatus("unavailable");
      return;
    }

    samplesRef.current = [];
    maxGRef.current = 0;
    setProgress(0);
    setResult(null);

    const startedAt = new Date().toISOString();
    track("motion_check_started", { started_at: startedAt });

    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
    subRef.current = Accelerometer.addListener((sample) => {
      const s: AccelSample = { x: sample.x, y: sample.y, z: sample.z };
      samplesRef.current.push(s);
      const m = magnitude(s);
      if (m > maxGRef.current) maxGRef.current = m;
    });

    setStatus("active");

    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += UPDATE_INTERVAL_MS;
      setProgress(Math.min(1, elapsed / CAPTURE_MS));
    }, UPDATE_INTERVAL_MS);

    timerRef.current = setTimeout(() => {
      stop();
      const completedAt = new Date().toISOString();
      const maxG = maxGRef.current;
      const classified = classifyMotion(maxG);
      setResult({
        maxG,
        result: classified,
        startedAt,
        completedAt,
      });
      setProgress(1);
      setStatus("done");
      track("motion_check_completed", {
        result: classified,
        max_g: maxG.toFixed(3),
      });
    }, CAPTURE_MS);
  }, [stop]);

  // Cleanup on unmount (§8: clean up sensor subscriptions when screen closes).
  useEffect(() => stop, [stop]);

  const reset = useCallback(() => {
    stop();
    setStatus("idle");
    setProgress(0);
    setResult(null);
  }, [stop]);

  return { status, progress, result, start, stop, reset };
}
