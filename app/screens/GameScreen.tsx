import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useGameStore } from "../state/gameStore";
import { StatBars } from "../components/StatBar";
import { DecisionCardView } from "../components/DecisionCardView";
import { ConsequenceToast } from "../components/ConsequenceToast";
import { DecisionCard } from "../../engine/types";
import { color, space } from "../theme";

// The pause over the vacated card space before the next card slides in
// (docs/05-ui-ux.md) — long enough to read the consequence line, short
// enough that the loop still feels immediate.
const CONSEQUENCE_BEAT_MS = 1500;

type Props = NativeStackScreenProps<RootStackParamList, "Game">;

export function GameScreen({ navigation }: Props) {
  const engineState = useGameStore((s) => s.engineState);
  const currentCard = useGameStore((s) => s.currentCard);
  const lastConsequence = useGameStore((s) => s.lastConsequence);
  const ending = useGameStore((s) => s.ending);
  const choose = useGameStore((s) => s.choose);

  const [displayedCard, setDisplayedCard] = useState<DecisionCard | null>(currentCard);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (ending) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      navigation.replace("Ending");
      return;
    }
    if (currentCard?.id === displayedCard?.id) return;

    setShowToast(true);
    const timer = setTimeout(() => {
      setDisplayedCard(currentCard);
      setShowToast(false);
    }, CONSEQUENCE_BEAT_MS);
    return () => clearTimeout(timer);
  }, [currentCard, displayedCard, ending, navigation]);

  if (!engineState) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color={color.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <StatBars stats={engineState.stats} />
        <Text style={styles.turn}>Turn {engineState.turnCount}</Text>
      </View>

      <View style={styles.stage}>
        {displayedCard && <DecisionCardView key={displayedCard.id} card={displayedCard} onCommit={choose} />}
        <ConsequenceToast text={showToast ? lastConsequence : null} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground },
  header: { paddingHorizontal: space(6), paddingTop: space(4) },
  turn: {
    color: color.inkDim,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    marginTop: space(3),
    alignSelf: "flex-end",
  },
  stage: { flex: 1, justifyContent: "center" },
});
