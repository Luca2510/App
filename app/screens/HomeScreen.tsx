import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useGameStore } from "../state/gameStore";
import { color, space } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const hasActiveRun = useGameStore((s) => s.engineState !== null);
  const startNewRun = useGameStore((s) => s.startNewRun);

  function handlePlay() {
    if (!hasActiveRun) startNewRun();
    navigation.navigate("Game");
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <Text style={styles.title}>The World's{"\n"}Hardest Decision</Text>
        <Pressable style={styles.playButton} onPress={handlePlay} accessibilityRole="button">
          <Text style={styles.playButtonText}>{hasActiveRun ? "Continue Your Life" : "Play"}</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.settingsLink}
        onPress={() => navigation.navigate("Settings")}
        accessibilityRole="button"
      >
        <Text style={styles.settingsLinkText}>Settings</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground, justifyContent: "space-between" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: space(10) },
  title: {
    color: color.ink,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 36,
  },
  playButton: {
    backgroundColor: color.accent,
    paddingVertical: space(4),
    paddingHorizontal: space(12),
    borderRadius: space(3),
  },
  playButtonText: { color: color.ground, fontSize: 16, fontWeight: "700" },
  settingsLink: { alignSelf: "center", paddingVertical: space(6) },
  settingsLinkText: { color: color.inkDim, fontSize: 13, letterSpacing: 0.5 },
});
