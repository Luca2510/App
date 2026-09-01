import { resolveEnding } from "./endingResolver";
import { createInitialState } from "./gameState";
import { Ending, GameState } from "./types";

function ending(overrides: Partial<Ending> = {}): Ending {
  return {
    id: "e",
    triggerStat: "morality",
    triggerDirection: "floor",
    title: "t",
    description: "d",
    rarity: "common",
    ...overrides,
  };
}

function stateWithStats(overrides: Partial<GameState["stats"]>): GameState {
  const state = createInitialState("c1");
  return { ...state, stats: { ...state.stats, ...overrides } };
}

describe("resolveEnding", () => {
  it("returns null while every stat is mid-range", () => {
    expect(resolveEnding(createInitialState("c1"), [ending()])).toBeNull();
  });

  it("matches the floor ending for the broken stat", () => {
    const state = stateWithStats({ wealth: 0 });
    const endings = [
      ending({ id: "wealth_floor", triggerStat: "wealth", triggerDirection: "floor" }),
      ending({ id: "wealth_ceiling", triggerStat: "wealth", triggerDirection: "ceiling" }),
    ];
    expect(resolveEnding(state, endings)?.id).toBe("wealth_floor");
  });

  it("matches the ceiling ending for the broken stat", () => {
    const state = stateWithStats({ relationships: 100 });
    const endings = [
      ending({ id: "rel_floor", triggerStat: "relationships", triggerDirection: "floor" }),
      ending({ id: "rel_ceiling", triggerStat: "relationships", triggerDirection: "ceiling" }),
    ];
    expect(resolveEnding(state, endings)?.id).toBe("rel_ceiling");
  });

  it("prioritizes sanity over morality, relationships, and wealth when several break at once", () => {
    const state = stateWithStats({ sanity: 0, morality: 0, wealth: 0, relationships: 100 });
    const endings = [
      ending({ id: "sanity_floor", triggerStat: "sanity", triggerDirection: "floor" }),
      ending({ id: "morality_floor", triggerStat: "morality", triggerDirection: "floor" }),
    ];
    expect(resolveEnding(state, endings)?.id).toBe("sanity_floor");
  });

  it("prefers a flag-specific ending over the generic one when its flags are all set", () => {
    const state = { ...stateWithStats({ relationships: 0 }), flags: new Set(["rare_flag"]) };
    const endings = [
      ending({ id: "generic", triggerStat: "relationships", triggerDirection: "floor" }),
      ending({
        id: "specific",
        triggerStat: "relationships",
        triggerDirection: "floor",
        requiredFlags: ["rare_flag"],
      }),
    ];
    expect(resolveEnding(state, endings)?.id).toBe("specific");
  });

  it("falls back to the generic ending when the specific one's flags aren't met", () => {
    const state = stateWithStats({ relationships: 0 });
    const endings = [
      ending({ id: "generic", triggerStat: "relationships", triggerDirection: "floor" }),
      ending({
        id: "specific",
        triggerStat: "relationships",
        triggerDirection: "floor",
        requiredFlags: ["rare_flag"],
      }),
    ];
    expect(resolveEnding(state, endings)?.id).toBe("generic");
  });

  it("throws when no ending covers the broken stat/direction (a content gap)", () => {
    const state = stateWithStats({ sanity: 100 });
    expect(() => resolveEnding(state, [ending({ triggerStat: "sanity", triggerDirection: "floor" })])).toThrow();
  });
});
