import { isEligible, selectNextCard } from "./cardSelector";
import { createInitialState } from "./gameState";
import { DecisionCard, GameState } from "./types";

function card(overrides: Partial<DecisionCard> = {}): DecisionCard {
  return {
    id: "c",
    version: 1,
    prompt: "p",
    category: "moral",
    weight: 10,
    choiceLeft: { label: "L", deltas: { morality: -1 }, consequenceText: "l" },
    choiceRight: { label: "R", deltas: { morality: 1 }, consequenceText: "r" },
    ...overrides,
  };
}

function stateAt(turnCount: number, overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState("start"), turnCount, ...overrides };
}

describe("isEligible", () => {
  it("rejects a card before its minTurn", () => {
    expect(isEligible(card({ minTurn: 5 }), stateAt(3))).toBe(false);
    expect(isEligible(card({ minTurn: 5 }), stateAt(5))).toBe(true);
  });

  it("rejects a card after its maxTurn", () => {
    expect(isEligible(card({ maxTurn: 5 }), stateAt(6))).toBe(false);
    expect(isEligible(card({ maxTurn: 5 }), stateAt(5))).toBe(true);
  });

  it("rejects a oneShot card already seen", () => {
    const state = stateAt(0, { flags: new Set(["seen_c"]) });
    expect(isEligible(card({ id: "c", oneShot: true }), state)).toBe(false);
  });

  it("requires every requiredFlag to be present", () => {
    const missing = stateAt(0, { flags: new Set(["a"]) });
    const complete = stateAt(0, { flags: new Set(["a", "b"]) });
    const gated = card({ requiredFlags: ["a", "b"] });
    expect(isEligible(gated, missing)).toBe(false);
    expect(isEligible(gated, complete)).toBe(true);
  });

  it("rejects a card if any forbiddenFlag is present", () => {
    const clean = stateAt(0);
    const tainted = stateAt(0, { flags: new Set(["blocked"]) });
    const gated = card({ forbiddenFlags: ["blocked"] });
    expect(isEligible(gated, clean)).toBe(true);
    expect(isEligible(gated, tainted)).toBe(false);
  });
});

describe("selectNextCard", () => {
  it("follows forcedNextCardId when the target card is still eligible", () => {
    const pool = [card({ id: "a" }), card({ id: "b" })];
    const state = stateAt(0, { forcedNextCardId: "b" });
    expect(selectNextCard(state, pool).id).toBe("b");
  });

  it("falls back to a random draw if the forced card is no longer eligible", () => {
    const pool = [card({ id: "a" }), card({ id: "b", oneShot: true })];
    const state = stateAt(0, {
      forcedNextCardId: "b",
      flags: new Set(["seen_b"]),
    });
    expect(selectNextCard(state, pool, [], () => 0).id).toBe("a");
  });

  it("never returns an isEnding card", () => {
    const pool = [card({ id: "a", isEnding: true }), card({ id: "b" })];
    const state = stateAt(0);
    for (let i = 0; i < 20; i++) {
      expect(selectNextCard(state, pool, [], () => i / 20).id).toBe("b");
    }
  });

  it("prefers a card whose category differs from the recent window when possible", () => {
    const pool = [card({ id: "a", category: "moral" }), card({ id: "b", category: "financial" })];
    const state = stateAt(0);
    // rng() = 0 would pick the first card in the draw pool either way;
    // what matters is which pool it draws from.
    const picked = selectNextCard(state, pool, ["moral", "moral"], () => 0);
    expect(picked.id).toBe("b");
  });

  it("falls back to the full eligible pool if anti-repeat would empty it", () => {
    const pool = [card({ id: "a", category: "moral" })];
    const state = stateAt(0);
    const picked = selectNextCard(state, pool, ["moral", "moral"], () => 0);
    expect(picked.id).toBe("a");
  });

  it("respects relative weight in a weighted draw", () => {
    const pool = [card({ id: "heavy", weight: 99 }), card({ id: "light", weight: 1 })];
    const state = stateAt(0);
    // rng() near 0 lands in the first (heavy) card's slice of the range.
    expect(selectNextCard(state, pool, [], () => 0.01).id).toBe("heavy");
    // rng() near 1 lands past the heavy slice, into the light card's.
    expect(selectNextCard(state, pool, [], () => 0.999).id).toBe("light");
  });

  it("throws if no card in the pool is eligible", () => {
    const pool = [card({ minTurn: 10 })];
    expect(() => selectNextCard(stateAt(0), pool)).toThrow();
  });
});
