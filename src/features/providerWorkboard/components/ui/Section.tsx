// Reusable titled section wrapper. Replaces the local Section helper
// duplicated in SiteDetailSheet.tsx and VisitDetailSheet.tsx.

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "./theme";

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    color: colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    fontWeight: "700",
  },
});
