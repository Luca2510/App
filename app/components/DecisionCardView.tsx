import React, { useCallback } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { DecisionCard, Side } from "../../engine/types";
import { color, radius } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_COMMIT_DISTANCE = SCREEN_WIDTH * 0.28;
const SWIPE_COMMIT_VELOCITY = 800;
const EXIT_DISTANCE = SCREEN_WIDTH * 1.5;

/**
 * The core Game Screen mechanic (docs/05-ui-ux.md): swipe left/right to
 * choose. The two buttons below are not a lesser fallback — they run the
 * identical animateExit path, so keyboard/switch-control/motor-impaired
 * players get the same feel as a swipe, per the accessibility requirement.
 */
export function DecisionCardView({
  card,
  onCommit,
}: {
  card: DecisionCard;
  onCommit: (side: Side) => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const commit = useCallback(
    (side: Side) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onCommit(side);
    },
    [onCommit]
  );

  const animateExit = useCallback(
    (side: Side) => {
      translateX.value = withTiming(
        side === "right" ? EXIT_DISTANCE : -EXIT_DISTANCE,
        { duration: 220 },
        (finished) => {
          if (finished) runOnJS(commit)(side);
        }
      );
    },
    [commit, translateX]
  );

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.2;
    })
    .onEnd((e) => {
      const pastDistance = Math.abs(e.translationX) > SWIPE_COMMIT_DISTANCE;
      const pastVelocity = Math.abs(e.velocityX) > SWIPE_COMMIT_VELOCITY;
      if (pastDistance || pastVelocity) {
        const side: Side = e.translationX > 0 ? "right" : "left";
        runOnJS(animateExit)(side);
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, SCREEN_WIDTH],
      [-12, 12],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const leftLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_COMMIT_DISTANCE, 0], [1, 0], Extrapolation.CLAMP),
  }));
  const rightLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_COMMIT_DISTANCE], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Animated.Text style={[styles.edgeLabel, styles.edgeLabelLeft, leftLabelStyle]} numberOfLines={2}>
            {card.choiceLeft.label}
          </Animated.Text>
          <Animated.Text style={[styles.edgeLabel, styles.edgeLabelRight, rightLabelStyle]} numberOfLines={2}>
            {card.choiceRight.label}
          </Animated.Text>
          <Text style={styles.prompt}>{card.prompt}</Text>
        </Animated.View>
      </GestureDetector>

      <View style={styles.buttonRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={card.choiceLeft.label}
          style={styles.choiceButton}
          onPress={() => animateExit("left")}
        >
          <Text style={styles.choiceButtonText}>{card.choiceLeft.label}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={card.choiceRight.label}
          style={styles.choiceButton}
          onPress={() => animateExit("right")}
        >
          <Text style={styles.choiceButtonText}>{card.choiceRight.label}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 24 },
  card: {
    width: SCREEN_WIDTH - 48,
    minHeight: 320,
    backgroundColor: color.surface,
    borderRadius: radius * 4,
    borderWidth: 1,
    borderColor: color.rule,
    padding: 28,
    justifyContent: "center",
  },
  prompt: {
    color: color.ink,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
  },
  edgeLabel: {
    position: "absolute",
    top: 20,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: color.accent,
    maxWidth: 110,
  },
  edgeLabelLeft: { left: 20, textAlign: "left" },
  edgeLabelRight: { right: 20, textAlign: "right" },
  buttonRow: { flexDirection: "row", gap: 12, width: SCREEN_WIDTH - 48 },
  choiceButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius * 3,
    borderWidth: 1,
    borderColor: color.rule,
    backgroundColor: color.surface,
    alignItems: "center",
  },
  choiceButtonText: { color: color.ink, fontSize: 13, fontWeight: "600", textAlign: "center" },
});
