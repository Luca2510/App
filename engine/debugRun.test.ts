import { playDebugRun } from "./debugRun";
import { createInitialState } from "./gameState";
import { DecisionCard, Ending } from "./types";
import { cards as realCards, endings as realEndings, STARTING_CARD_ID } from "../content";

describe("playDebugRun", () => {
  it("drives a minimal two-card pool to a deterministic ending", () => {
    const pool: DecisionCard[] = [
      {
        id: "start",
        version: 1,
        prompt: "p",
        category: "moral",
        weight: 10,
        choiceLeft: { label: "L", deltas: { wealth: -100 }, consequenceText: "l" },
        choiceRight: { label: "R", deltas: { wealth: 100 }, consequenceText: "r" },
      },
    ];
    const endings: Ending[] = [
      { id: "broke", triggerStat: "wealth", triggerDirection: "floor", title: "t", description: "d", rarity: "common" },
    ];

    const result = playDebugRun(createInitialState("start"), pool, endings, {
      chooseSide: () => "left",
    });

    expect(result.ending.id).toBe("broke");
    expect(result.finalState.turnCount).toBe(1);
    expect(result.log.length).toBeGreaterThan(0);
  });

  it("throws if the run cannot reach an ending within the turn cap", () => {
    const pool: DecisionCard[] = [
      {
        id: "start",
        version: 1,
        prompt: "p",
        category: "moral",
        weight: 10,
        choiceLeft: { label: "L", deltas: { wealth: 1 }, consequenceText: "l" },
        choiceRight: { label: "R", deltas: { wealth: -1 }, consequenceText: "r" },
      },
    ];
    // Alternating +1/-1 forever never touches 0 or 100 from a start of 50.
    let toggle = true;
    const chooseSide = () => {
      toggle = !toggle;
      return toggle ? "left" : "right";
    };
    expect(() =>
      playDebugRun(createInitialState("start"), pool, [], { chooseSide })
    ).toThrow(/exceeded/);
  });

  it("plays the real shipped content set to completion under many random seeds without throwing", () => {
    for (let seed = 1; seed <= 25; seed++) {
      let state = seed; // simple LCG so each seed is reproducible
      const rng = () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
      };
      const result = playDebugRun(createInitialState(STARTING_CARD_ID), realCards, realEndings, { rng });
      expect(result.finalState.turnCount).toBeGreaterThan(0);
      expect(realEndings.some((e) => e.id === result.ending.id)).toBe(true);
    }
  });
});
