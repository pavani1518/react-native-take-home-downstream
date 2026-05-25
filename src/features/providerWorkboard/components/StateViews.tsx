import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export function LoadingView() {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator />
      <Text style={styles.subtle}>Loading workboard…</Text>
    </View>
  );
}

export function EmptyView({ message }: { message: string }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <Text style={styles.title}>Nothing to show</Text>
      <Text style={styles.subtle}>{message}</Text>
    </View>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.center} accessibilityLiveRegion="assertive">
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.subtle}>{message}</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry"
        style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
      >
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  subtle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  retry: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#111827",
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  retryPressed: {
    opacity: 0.7,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
