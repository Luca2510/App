import { fromGameSave, toGameSave } from "./serialize";
import { createInitialState, applyChoice } from "../engine/gameState";
import { DecisionCard } from "../engine/types";

describe("toGameSave / fromGameSave", () => {
  it("round-trips a GameState through the persisted GameSave shape", () => {
    const card: DecisionCard = {
      id: "c1",
      version: 1,
      prompt: "p",
      category: "moral",
      weight: 10,
      choiceLeft: { label: "L", deltas: { morality: -5 }, setsFlags: ["flag_a"], consequenceText: "l" },
      choiceRight: { label: "R", deltas: { morality: 5 }, consequenceText: "r" },
    };
    const state = applyChoice(createInitialState("c1"), card, "left");

    const save = toGameSave(state, {
      id: "run-1",
      history: [{ cardId: "c1", choice: "left", turn: 1 }],
      contentVersion: "1",
      startedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:01.000Z",
    });

    expect(save.flags).toEqual({ flag_a: true });
    expect(save.turnCount).toBe(1);

    const restored = fromGameSave(save);
    expect(restored.turnCount).toBe(state.turnCount);
    expect(restored.stats).toEqual(state.stats);
    expect(restored.flags).toEqual(state.flags);
    expect(restored.currentCardId).toBe(state.currentCardId);
  });
});
