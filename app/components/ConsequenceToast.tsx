import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { color } from "../theme";

/**
 * The ~1.5s consequence-line beat between a committed swipe and the next
 * card sliding in (docs/05-ui-ux.md). `text` is null between beats.
 */
export function ConsequenceToast({ text }: { text: string | null }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(text ? 1 : 0, { duration: 200 });
  }, [text, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!text) return null;

  return (
    <Animated.View style={[styles.wrap, style]} pointerEvents="none">
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 24,
    right: 24,
    alignItems: "center",
  },
  text: {
    color: color.inkDim,
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
});
