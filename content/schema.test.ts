import { cards, endings } from "./index";

describe("shipped content", () => {
  it("parses cleanly against the schema (loading content/index did not throw)", () => {
    expect(cards.length).toBeGreaterThan(0);
    expect(endings.length).toBeGreaterThan(0);
  });

  it("every choice.nextCardId points at a card that actually exists in the pool", () => {
    const ids = new Set(cards.map((c) => c.id));
    for (const card of cards) {
      for (const choice of [card.choiceLeft, card.choiceRight]) {
        if (choice.nextCardId) {
          expect(ids.has(choice.nextCardId)).toBe(true);
        }
      }
    }
  });

  it("every requiredFlags/forbiddenFlags reference is set by at least one choice somewhere (or is an auto seen_<id> flag)", () => {
    const settableFlags = new Set<string>();
    for (const card of cards) {
      if (card.oneShot) settableFlags.add(`seen_${card.id}`);
      for (const choice of [card.choiceLeft, card.choiceRight]) {
        choice.setsFlags?.forEach((f) => settableFlags.add(f));
      }
    }

    const referenced = new Set<string>();
    for (const card of cards) {
      card.requiredFlags?.forEach((f) => referenced.add(f));
      card.forbiddenFlags?.forEach((f) => referenced.add(f));
    }
    for (const ending of endings) {
      ending.requiredFlags?.forEach((f) => referenced.add(f));
    }

    for (const flag of referenced) {
      expect(settableFlags.has(flag)).toBe(true);
    }
  });

  it("covers every stat in both directions (floor and ceiling) with at least one ending", () => {
    const stats: Array<"morality" | "wealth" | "relationships" | "sanity"> = [
      "morality",
      "wealth",
      "relationships",
      "sanity",
    ];
    for (const stat of stats) {
      expect(endings.some((e) => e.triggerStat === stat && e.triggerDirection === "floor")).toBe(true);
      expect(endings.some((e) => e.triggerStat === stat && e.triggerDirection === "ceiling")).toBe(true);
    }
  });

  it("every choice moves at least one stat", () => {
    for (const card of cards) {
      expect(Object.keys(card.choiceLeft.deltas).length).toBeGreaterThan(0);
      expect(Object.keys(card.choiceRight.deltas).length).toBeGreaterThan(0);
    }
  });
});
