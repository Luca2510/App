import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Stat } from "../../engine/types";
import { color, radius, statColor } from "../theme";

const NEAR_BREAK_THRESHOLD = 10;
const STAT_LABEL: Record<Stat, string> = {
  morality: "Morality",
  wealth: "Wealth",
  relationships: "Relationships",
  sanity: "Sanity",
};

export function StatBar({ stat, value }: { stat: Stat; value: number }) {
  const fill = useSharedValue(value);

  useEffect(() => {
    fill.value = withTiming(value, { duration: 400 });
  }, [value, fill]);

  const trackStyle = useAnimatedStyle(() => ({
    width: `${fill.value}%`,
  }));

  const nearBreak = value <= NEAR_BREAK_THRESHOLD || value >= 100 - NEAR_BREAK_THRESHOLD;

  return (
    <View style={styles.container} accessibilityLabel={`${STAT_LABEL[stat]}: ${value} of 100`}>
      <Text style={[styles.label, { color: statColor[stat] }]}>{STAT_LABEL[stat]}</Text>
      <View style={[styles.track, nearBreak && styles.trackNearBreak]}>
        <Animated.View style={[styles.fill, { backgroundColor: statColor[stat] }, trackStyle]} />
      </View>
    </View>
  );
}

export function StatBars({ stats }: { stats: Record<Stat, number> }) {
  const order: Stat[] = ["morality", "wealth", "relationships", "sanity"];
  return (
    <View style={styles.row}>
      {order.map((stat) => (
        <StatBar key={stat} stat={stat} value={stats[stat]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  container: { flex: 1 },
  label: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  track: {
    height: 5,
    borderRadius: radius,
    backgroundColor: color.surface2,
    overflow: "hidden",
  },
  trackNearBreak: {
    shadowColor: color.danger,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  fill: {
    height: "100%",
    borderRadius: radius,
  },
});
