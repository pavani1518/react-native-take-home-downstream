// §1 Workboard screen — virtualized FlatList, summary, filters, refresh.

import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FilterBar } from "../components/FilterBar";
import { SiteRow } from "../components/SiteRow";
import { SiteDetailSheet } from "../components/SiteDetailSheet";
import { SummaryHeader } from "../components/SummaryHeader";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "../components/StateViews";
import { filterSites, summarizeSites } from "../domain";
import { track } from "../analytics";
import {
  useEvidence,
  useMotion,
  useRefreshAll,
  useScans,
  useSites,
} from "../viewModels/useWorkboardData";
import { useNow } from "../viewModels/useNow";
import type {
  DateScope,
  EvidenceFilter,
  ServiceSite,
  WorkStatus,
  WorkboardFilters,
} from "../types";

export function WorkboardScreen() {
  const now = useNow();
  const sitesQ = useSites();
  const evidenceQ = useEvidence();
  const scansQ = useScans();
  const motionQ = useMotion();
  const refresh = useRefreshAll();

  const [filters, setFilters] = useState<WorkboardFilters>({
    query: "",
    statuses: [],
    dateScope: "all",
    evidence: null,
  });
  const [openSite, setOpenSite] = useState<ServiceSite | null>(null);

  useEffect(() => {
    track("workboard_viewed", {});
  }, []);

  const sites = useMemo(() => sitesQ.data ?? [], [sitesQ.data]);
  const evidence = useMemo(() => evidenceQ.data ?? [], [evidenceQ.data]);
  const scans = useMemo(() => scansQ.data ?? [], [scansQ.data]);
  const motion = useMemo(() => motionQ.data ?? [], [motionQ.data]);

  const filteredSites = useMemo(
    () => filterSites(sites, filters, evidence, scans, now),
    [sites, filters, evidence, scans, now]
  );
  const summary = useMemo(
    () => summarizeSites(filteredSites, evidence, now),
    [filteredSites, evidence, now]
  );

  // Loading / error gates apply only to the primary sites query.
  // Evidence/scan/motion queries hydrate around the list.
  if (sitesQ.isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <LoadingView />
      </SafeAreaView>
    );
  }
  if (sitesQ.isError) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <ErrorView
          message={sitesQ.error?.message ?? "Failed to load workboard."}
          onRetry={() => sitesQ.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.titleBar}>
        <Text style={styles.title}>Provider Workboard</Text>
      </View>

      <SummaryHeader summary={summary} />

      <FilterBar
        query={filters.query}
        onQueryChange={(q) => {
          setFilters((f) => ({ ...f, query: q }));
          track("search_changed", { length: q.length });
        }}
        statuses={filters.statuses}
        onStatusToggle={(s: WorkStatus) => {
          setFilters((f) => {
            const has = f.statuses.includes(s);
            const next = has
              ? f.statuses.filter((x) => x !== s)
              : [...f.statuses, s];
            track("filter_changed", { kind: "status", value: s, active: !has });
            return { ...f, statuses: next };
          });
        }}
        dateScope={filters.dateScope}
        onDateScopeChange={(d: DateScope) => {
          setFilters((f) => ({ ...f, dateScope: d }));
          track("filter_changed", { kind: "date_scope", value: d });
        }}
        evidence={filters.evidence}
        onEvidenceChange={(e: EvidenceFilter | null) => {
          setFilters((f) => ({ ...f, evidence: e }));
          track("filter_changed", { kind: "evidence", value: e ?? "none" });
        }}
      />

      <FlatList
        data={filteredSites}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <SiteRow
            site={item}
            evidence={evidence}
            now={now}
            onPress={() => {
              track("site_opened", { site_id: item.id });
              setOpenSite(item);
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyView message="No sites match the current filters." />
        }
        refreshControl={
          <RefreshControl
            refreshing={sitesQ.isFetching && !sitesQ.isLoading}
            onRefresh={refresh}
          />
        }
        initialNumToRender={10}
        windowSize={10}
        removeClippedSubviews
        contentContainerStyle={
          filteredSites.length === 0 ? styles.emptyList : undefined
        }
      />

      <SiteDetailSheet
        site={openSite}
        visible={!!openSite}
        evidence={evidence}
        scans={scans}
        motion={motion}
        now={now}
        onClose={() => setOpenSite(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  titleBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  emptyList: { flexGrow: 1 },
});
