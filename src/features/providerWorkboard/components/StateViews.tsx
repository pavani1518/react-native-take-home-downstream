import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button, colors } from "./ui";

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
      <View style={styles.retryWrap}>
        <Button
          variant="primary"
          label="Retry"
          onPress={onRetry}
          accessibilityLabel="Retry"
        />
      </View>
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
    color: colors.text,
  },
  subtle: {
    fontSize: 14,
    color: colors.textSubtle,
    textAlign: "center",
  },
  retryWrap: {
    marginTop: 12,
    minWidth: 140,
  },
});
