import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useGameStore } from "../state/gameStore";
import { endings } from "../../content";
import { RunSummary } from "../../storage/types";
import { color, space } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Legacy">;

const endingsById = new Map(endings.map((ending) => [ending.id, ending]));

function endingTitleFor(runSummary: RunSummary): string {
  return endingsById.get(runSummary.endingId)?.title ?? "Unknown Ending";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function LegacyScreen({ navigation }: Props) {
  const runHistory = useGameStore((s) => s.runHistory);

  const best = runHistory.reduce<RunSummary | null>(
    (winner, run) => (!winner || run.turnsSurvived > winner.turnsSurvived ? run : winner),
    null
  );
  const rest = [...runHistory].reverse().filter((run) => run.id !== best?.id);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Legacy</Text>
      </View>

      {!best ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No lives lived yet. Your first ending will show up here.</Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(run) => run.id}
          ListHeaderComponent={
            <Pressable
              style={styles.bestCard}
              onPress={() => navigation.navigate("Ending", { historyId: best.id })}
              accessibilityRole="button"
            >
              <Text style={styles.bestLabel}>Personal Best</Text>
              <Text style={styles.bestTitle}>{endingTitleFor(best)}</Text>
              <Text style={styles.bestMeta}>
                {best.turnsSurvived} turns · {formatDate(best.endedAt)}
              </Text>
            </Pressable>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate("Ending", { historyId: item.id })}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{endingTitleFor(item)}</Text>
                <Text style={styles.rowMeta}>{formatDate(item.endedAt)}</Text>
              </View>
              <Text style={styles.rowTurns}>{item.turnsSurvived} turns</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No other runs yet.</Text>}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(4),
    paddingHorizontal: space(6),
    paddingTop: space(4),
    paddingBottom: space(6),
  },
  back: { color: color.accent, fontSize: 14 },
  title: { color: color.ink, fontSize: 18, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: space(8) },
  emptyText: { color: color.inkDim, fontSize: 14, textAlign: "center" },
  list: { paddingHorizontal: space(6), paddingBottom: space(8) },
  bestCard: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.accent,
    borderRadius: space(3),
    padding: space(5),
    marginBottom: space(5),
  },
  bestLabel: {
    color: color.accent,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: space(2),
  },
  bestTitle: { color: color.ink, fontSize: 17, fontWeight: "700" },
  bestMeta: { color: color.inkDim, fontSize: 12, marginTop: space(1), fontVariant: ["tabular-nums"] },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space(4),
    borderBottomWidth: 1,
    borderBottomColor: color.rule,
  },
  rowTitle: { color: color.ink, fontSize: 15 },
  rowMeta: { color: color.inkDim, fontSize: 11, marginTop: 2 },
  rowTurns: { color: color.inkDim, fontSize: 12, fontVariant: ["tabular-nums"] },
});
