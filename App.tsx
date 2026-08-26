import React, { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { createInitialState } from "./engine/gameState";
import { playDebugRun } from "./engine/debugRun";
import { cards, endings, STARTING_CARD_ID } from "./content";

/**
 * Phase 0 placeholder screen only. The real swipe-card Game Screen
 * (docs/05-ui-ux.md) is Phase 1 work — this exists purely to prove the
 * engine + content wire up end-to-end inside the RN app shell.
 */
export default function App() {
  const [log, setLog] = useState<string[]>([]);

  function runOnce() {
    const result = playDebugRun(createInitialState(STARTING_CARD_ID), cards, endings);
    setLog(result.log);
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>The World's Hardest Decision</Text>
        <Text style={styles.subtitle}>Phase 0 — engine wiring check</Text>
      </View>
      <Text style={styles.action} onPress={runOnce}>
        ▸ Play one randomized debug run
      </Text>
      <ScrollView style={styles.log} contentContainerStyle={{ padding: 16 }}>
        {log.map((line, i) => (
          <Text key={i} style={styles.logLine}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#14110E" },
  header: { padding: 24, paddingBottom: 8 },
  title: { color: "#EFE8DA", fontSize: 22, fontWeight: "600" },
  subtitle: { color: "#A79B87", fontSize: 13, marginTop: 4 },
  action: {
    color: "#C9A24B",
    fontSize: 15,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  log: { flex: 1 },
  logLine: { color: "#A79B87", fontSize: 12, marginBottom: 6, fontFamily: "Courier" },
});
