import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useGameStore } from "../state/gameStore";
import { color } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export function SplashScreen({ navigation }: Props) {
  const bootstrap = useGameStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
    const { settings, engineState } = useGameStore.getState();
    const target: keyof RootStackParamList = !settings.onboardingSeen
      ? "Onboarding"
      : engineState
        ? "Game"
        : "Home";
    navigation.reset({ index: 0, routes: [{ name: target }] });
    // Runs once on mount — this screen exists only to route past itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>The World's{"\n"}Hardest Decision</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground, justifyContent: "center", alignItems: "center" },
  title: {
    color: color.ink,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 32,
  },
});
