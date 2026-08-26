import { applyChoice, clampStat, createInitialState } from "./gameState";
import { DecisionCard } from "./types";

function card(overrides: Partial<DecisionCard> = {}): DecisionCard {
  return {
    id: "test_card",
    version: 1,
    prompt: "Test prompt",
    category: "moral",
    weight: 10,
    choiceLeft: { label: "Left", deltas: { morality: -10 }, consequenceText: "left" },
    choiceRight: { label: "Right", deltas: { morality: 10 }, consequenceText: "right" },
    ...overrides,
  };
}

describe("clampStat", () => {
  it("clamps below the floor to 0", () => {
    expect(clampStat(-15)).toBe(0);
  });
  it("clamps above the ceiling to 100", () => {
    expect(clampStat(115)).toBe(100);
  });
  it("leaves in-range values untouched", () => {
    expect(clampStat(42)).toBe(42);
  });
});

describe("createInitialState", () => {
  it("starts every stat at 50 with no flags", () => {
    const state = createInitialState("opening_note");
    expect(state.stats).toEqual({
      morality: 50,
      wealth: 50,
      relationships: 50,
      sanity: 50,
    });
    expect(state.flags.size).toBe(0);
    expect(state.turnCount).toBe(0);
    expect(state.currentCardId).toBe("opening_note");
  });
});

describe("applyChoice", () => {
  it("applies the chosen side's deltas and clamps to [0, 100]", () => {
    const state = createInitialState("c1");
    state.stats.morality = 5;
    const result = applyChoice(state, card(), "left");
    expect(result.stats.morality).toBe(0); // 5 - 10, clamped
  });

  it("does not mutate the input state", () => {
    const state = createInitialState("c1");
    const before = { ...state.stats };
    applyChoice(state, card(), "right");
    expect(state.stats).toEqual(before);
  });

  it("increments turnCount by exactly one", () => {
    const state = createInitialState("c1");
    const result = applyChoice(state, card(), "left");
    expect(result.turnCount).toBe(1);
  });

  it("merges setsFlags into the flag set without losing existing flags", () => {
    let state = createInitialState("c1");
    state = applyChoice(
      state,
      card({ choiceLeft: { label: "L", deltas: { morality: -1 }, setsFlags: ["a"], consequenceText: "x" } }),
      "left"
    );
    state = applyChoice(
      state,
      card({ choiceRight: { label: "R", deltas: { morality: 1 }, setsFlags: ["b"], consequenceText: "y" } }),
      "right"
    );
    expect(state.flags.has("a")).toBe(true);
    expect(state.flags.has("b")).toBe(true);
  });

  it("auto-sets a seen_<id> flag for oneShot cards", () => {
    const state = createInitialState("c1");
    const result = applyChoice(state, card({ id: "unique_card", oneShot: true }), "left");
    expect(result.flags.has("seen_unique_card")).toBe(true);
  });

  it("sets forcedNextCardId from the choice, and clears it if absent", () => {
    const state = createInitialState("c1");
    const chained = applyChoice(
      state,
      card({ choiceLeft: { label: "L", deltas: { morality: -1 }, consequenceText: "x", nextCardId: "c2" } }),
      "left"
    );
    expect(chained.forcedNextCardId).toBe("c2");

    const unchained = applyChoice(chained, card(), "right");
    expect(unchained.forcedNextCardId).toBeUndefined();
  });
});
