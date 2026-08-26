import React, { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useGameStore } from "../state/gameStore";
import { StatBars } from "../components/StatBar";
import { DecisionCardView } from "../components/DecisionCardView";
import { DecisionCard } from "../../engine/types";
import { color, space } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PAGE_COUNT = 3;

const PRACTICE_CARD: DecisionCard = {
  id: "practice_card",
  version: 1,
  prompt: "This is a practice round. Swipe either way, or tap a button below, to see how it feels.",
  category: "moral",
  weight: 1,
  choiceLeft: { label: "Swipe left", deltas: { sanity: 1 }, consequenceText: "" },
  choiceRight: { label: "Swipe right", deltas: { sanity: 1 }, consequenceText: "" },
};

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

export function OnboardingScreen({ navigation }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const startNewRun = useGameStore((s) => s.startNewRun);

  function finish() {
    updateSettings({ onboardingSeen: true });
    startNewRun();
    navigation.reset({ index: 0, routes: [{ name: "Game" }] });
  }

  function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setPage(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }

  return (
    <SafeAreaView style={styles.root}>
      <Pressable style={styles.skip} onPress={finish} accessibilityRole="button">
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.pager}
      >
        <View style={styles.page}>
          <Text style={styles.headline}>Every choice{"\n"}costs you something.</Text>
          <Text style={styles.body}>
            There's no right answer here — only the life you end up with.
          </Text>
        </View>

        <View style={styles.page}>
          <Text style={styles.headline}>Four things you can lose.</Text>
          <View style={styles.statsDemo}>
            <StatBars stats={{ morality: 50, wealth: 50, relationships: 50, sanity: 50 }} />
          </View>
          <Text style={styles.body}>
            Push any one of them too far — in either direction — and your life ends there.
          </Text>
        </View>

        <View style={[styles.page, styles.practicePage]}>
          <Text style={styles.headline}>Try it.</Text>
          <View style={styles.practiceCard}>
            <DecisionCardView card={PRACTICE_CARD} onCommit={() => undefined} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {Array.from({ length: PAGE_COUNT }).map((_, i) => (
            <View key={i} style={[styles.dot, page === i && styles.dotActive]} />
          ))}
        </View>
        {page === PAGE_COUNT - 1 && (
          <Pressable style={styles.beginButton} onPress={finish} accessibilityRole="button">
            <Text style={styles.beginButtonText}>Begin Your Life</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground },
  skip: { position: "absolute", top: space(4), right: space(6), zIndex: 1 },
  skipText: { color: color.inkDim, fontSize: 13 },
  pager: { flex: 1 },
  page: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    padding: space(8),
    gap: space(4),
  },
  practicePage: { justifyContent: "flex-start", paddingTop: space(16) },
  headline: { color: color.ink, fontSize: 24, fontWeight: "700", textAlign: "center" },
  body: { color: color.inkDim, fontSize: 14, lineHeight: 20, textAlign: "center", maxWidth: 280 },
  statsDemo: { width: "100%", marginTop: space(4) },
  practiceCard: { flex: 1, width: "100%", marginTop: space(6) },
  footer: { paddingHorizontal: space(6), paddingBottom: space(6), gap: space(4) },
  dots: { flexDirection: "row", justifyContent: "center", gap: space(2) },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.surface2 },
  dotActive: { backgroundColor: color.accent },
  beginButton: {
    backgroundColor: color.accent,
    paddingVertical: space(4),
    borderRadius: space(3),
    alignItems: "center",
  },
  beginButtonText: { color: color.ground, fontSize: 16, fontWeight: "700" },
});
