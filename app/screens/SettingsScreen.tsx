import React from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useGameStore } from "../state/gameStore";
import { color, space } from "../theme";
import appConfig from "../../app.json";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export function SettingsScreen({ navigation }: Props) {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const resetProgress = useGameStore((s) => s.resetProgress);

  function confirmReset() {
    Alert.alert(
      "Reset progress?",
      "This clears your current life and run history on this device. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetProgress();
            navigation.reset({ index: 0, routes: [{ name: "Home" }] });
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Sound</Text>
        <Switch
          value={settings.soundOn}
          onValueChange={(value) => updateSettings({ soundOn: value })}
          trackColor={{ false: color.surface2, true: color.accent }}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Haptics</Text>
        <Switch
          value={settings.hapticsOn}
          onValueChange={(value) => updateSettings({ hapticsOn: value })}
          trackColor={{ false: color.surface2, true: color.accent }}
        />
      </View>

      <Pressable style={styles.resetRow} onPress={confirmReset} accessibilityRole="button">
        <Text style={styles.resetText}>Reset Progress</Text>
      </Pressable>

      <Text style={styles.version}>Version {appConfig.expo.version}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground, padding: space(6) },
  header: { flexDirection: "row", alignItems: "center", gap: space(4), marginBottom: space(8) },
  back: { color: color.accent, fontSize: 14 },
  title: { color: color.ink, fontSize: 18, fontWeight: "700" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: space(4),
    borderBottomWidth: 1,
    borderBottomColor: color.rule,
  },
  rowLabel: { color: color.ink, fontSize: 15 },
  resetRow: { paddingVertical: space(5), marginTop: space(6) },
  resetText: { color: color.danger, fontSize: 15, fontWeight: "600" },
  version: {
    color: color.inkDim,
    fontSize: 11,
    textAlign: "center",
    marginTop: "auto",
    paddingBottom: space(4),
  },
});
