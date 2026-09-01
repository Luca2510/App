import React, { useEffect, useRef } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useGameStore } from "../state/gameStore";
import { STATS } from "../../engine/types";
import { endings } from "../../content";
import { color, space, statColor } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Ending">;

const STAT_LABEL: Record<string, string> = {
  morality: "Morality",
  wealth: "Wealth",
  relationships: "Relationships",
  sanity: "Sanity",
};

const endingsById = new Map(endings.map((ending) => [ending.id, ending]));

export function EndingScreen({ navigation, route }: Props) {
  const historyId = route.params?.historyId;

  const liveSummary = useGameStore((s) => s.runSummary);
  const runHistory = useGameStore((s) => s.runHistory);
  const startNewRun = useGameStore((s) => s.startNewRun);

  const shotRef = useRef<ViewShot>(null);

  const runSummary = historyId ? (runHistory.find((r) => r.id === historyId) ?? null) : liveSummary;
  const ending = runSummary ? (endingsById.get(runSummary.endingId) ?? null) : null;

  useEffect(() => {
    // Reached with nothing to show — a direct/reloaded nav, or a
    // historyId that no longer resolves to a run.
    if (!ending || !runSummary) navigation.replace(historyId ? "Legacy" : "Home");
  }, [ending, runSummary, navigation, historyId]);

  if (!ending || !runSummary) return null;

  function handlePlayAgain() {
    startNewRun();
    navigation.replace("Game");
  }

  async function handleShare() {
    try {
      const uri = await shotRef.current?.capture?.();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { dialogTitle: "Share your ending", mimeType: "image/png" });
        return;
      }
    } catch {
      // Fall through to a plain text share below.
    }
    // Safe: this screen returns null above whenever ending/runSummary are
    // absent, so handleShare is only reachable (via onPress) when both are
    // set — TS just can't see that across the closure.
    Share.share({
      message:
        `${ending!.title}\n\n${ending!.description}\n\n` +
        `I survived ${runSummary!.turnsSurvived} turns in The World's Hardest Decision.`,
    });
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <ViewShot ref={shotRef} style={styles.shareCard} options={{ format: "png", quality: 0.92 }}>
          <Text style={styles.eyebrow}>Your life ended here</Text>
          <Text style={styles.title}>{ending.title}</Text>
          <Text style={styles.description}>{ending.description}</Text>

          <Text style={styles.turns}>Survived {runSummary.turnsSurvived} turns</Text>

          <View style={styles.statRow}>
            {STATS.map((stat) => (
              <View key={stat} style={styles.statCell}>
                <Text style={[styles.statValue, { color: statColor[stat] }]}>
                  {runSummary.finalStats[stat]}
                </Text>
                <Text style={styles.statLabel}>{STAT_LABEL[stat]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.wordmark}>THE WORLD'S HARDEST DECISION</Text>
        </ViewShot>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={handlePlayAgain} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Play Again</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleShare} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Share</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground, justifyContent: "space-between", padding: space(6) },
  content: { flex: 1, justifyContent: "center" },
  shareCard: {
    backgroundColor: color.ground,
    borderRadius: space(4),
    borderWidth: 1,
    borderColor: color.rule,
    padding: space(6),
    gap: space(4),
  },
  eyebrow: {
    color: color.inkDim,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  title: { color: color.ink, fontSize: 26, fontWeight: "700", textAlign: "center" },
  description: { color: color.inkDim, fontSize: 15, lineHeight: 22, textAlign: "center" },
  turns: {
    color: color.accent,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    marginTop: space(4),
  },
  statRow: { flexDirection: "row", justifyContent: "space-between", marginTop: space(4) },
  statCell: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 20, fontWeight: "700", fontVariant: ["tabular-nums"] },
  statLabel: { color: color.inkDim, fontSize: 9, textTransform: "uppercase", marginTop: 4 },
  wordmark: {
    color: color.rule,
    fontSize: 9,
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: space(4),
  },
  actions: { gap: space(3) },
  primaryButton: {
    backgroundColor: color.accent,
    paddingVertical: space(4),
    borderRadius: space(3),
    alignItems: "center",
  },
  primaryButtonText: { color: color.ground, fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: color.rule,
    paddingVertical: space(4),
    borderRadius: space(3),
    alignItems: "center",
  },
  secondaryButtonText: { color: color.ink, fontSize: 14, fontWeight: "600" },
});
