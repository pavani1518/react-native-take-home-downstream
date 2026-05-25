// React Query hooks for the four resources + retry-queue persistence.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import {
  fetchEvidence,
  fetchMotion,
  fetchScans,
  fetchSites,
  mutateVisit,
  saveEvidenceLocal,
  recordScan,
  recordMotion,
  uploadEvidence,
  type MutateVisitArgs,
  type SaveEvidenceArgs,
} from "../data/api";
import {
  dequeueRetry,
  enqueueRetry,
  loadLastRefreshed,
  loadRetryQueue,
  saveLastRefreshed,
} from "../data/persistence";
import { track } from "../analytics";
import type {
  AssetScan,
  MotionResult,
  MotionSample,
  ScanResult,
  ServiceSite,
  VisitActionId,
  VisitEvidence,
} from "../types";

const KEYS = {
  sites: ["sites"] as const,
  evidence: ["evidence"] as const,
  scans: ["scans"] as const,
  motion: ["motion"] as const,
};

export function useSites() {
  return useQuery<ServiceSite[], Error>({
    queryKey: KEYS.sites,
    queryFn: fetchSites,
  });
}

export function useEvidence() {
  return useQuery<VisitEvidence[], Error>({
    queryKey: KEYS.evidence,
    queryFn: fetchEvidence,
  });
}

export function useScans() {
  return useQuery<AssetScan[], Error>({
    queryKey: KEYS.scans,
    queryFn: fetchScans,
  });
}

export function useMotion() {
  return useQuery<MotionSample[], Error>({
    queryKey: KEYS.motion,
    queryFn: fetchMotion,
  });
}

export function useRefreshAll() {
  const qc = useQueryClient();
  return useCallback(async () => {
    track("refresh_triggered", {});
    await Promise.all([
      qc.invalidateQueries({ queryKey: KEYS.sites }),
      qc.invalidateQueries({ queryKey: KEYS.evidence }),
      qc.invalidateQueries({ queryKey: KEYS.scans }),
      qc.invalidateQueries({ queryKey: KEYS.motion }),
    ]);
    const iso = new Date().toISOString();
    await saveLastRefreshed(iso);
  }, [qc]);
}

export function useLastRefreshed() {
  const [iso, setIso] = useState<string | null>(null);
  useEffect(() => {
    loadLastRefreshed().then(setIso);
  }, []);
  return iso;
}

export function useMutateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: MutateVisitArgs) => mutateVisit(args),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.sites });
    },
  });
}

export function useSaveEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: SaveEvidenceArgs) => saveEvidenceLocal(args),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.evidence });
    },
  });
}

export function useUploadEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (evidenceId: string) => {
      try {
        const status = await uploadEvidence(evidenceId);
        await dequeueRetry(evidenceId);
        return status;
      } catch (e) {
        await enqueueRetry(evidenceId);
        track("evidence_upload_failed", { evidence_id: evidenceId });
        throw e;
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.evidence });
    },
  });
}

export function useRecordScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      visitId: string;
      expectedAssetCode: string;
      scannedAssetCode: string;
      result: ScanResult;
    }) => recordScan(args),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.scans });
    },
  });
}

export function useRecordMotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      visitId: string;
      startedAt: string;
      completedAt: string;
      maxAccelerationG: number;
      result: MotionResult;
    }) => recordMotion(args),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.motion });
    },
  });
}

export function useRetryQueue() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    loadRetryQueue().then(setIds);
  }, []);
  return { ids, refresh: () => loadRetryQueue().then(setIds) };
}

// Last action id and visit id, used for "Visit action ..." analytics + buttons.
export type VisitMutationKey = `${string}:${VisitActionId}`;
