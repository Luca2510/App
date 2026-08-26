import { createLocalStore } from "./localStore";
import { createMemoryStore } from "./kvStore";
import { GameSave, RunSummary } from "./types";

function makeSave(overrides: Partial<GameSave> = {}): GameSave {
  return {
    id: "run-1",
    turnCount: 3,
    stats: { morality: 50, wealth: 50, relationships: 50, sanity: 50 },
    flags: {},
    currentCardId: "c1",
    history: [],
    contentVersion: "1",
    startedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeSummary(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    id: "run-1",
    endingId: "end_x",
    finalStats: { morality: 0, wealth: 50, relationships: 50, sanity: 50 },
    turnsSurvived: 10,
    startedAt: "2026-01-01T00:00:00.000Z",
    endedAt: "2026-01-01T00:05:00.000Z",
    ...overrides,
  };
}

describe("localStore", () => {
  it("returns null for the active run before anything is saved", () => {
    const store = createLocalStore(createMemoryStore());
    expect(store.getActiveRun()).toBeNull();
  });

  it("round-trips an active run save", () => {
    const store = createLocalStore(createMemoryStore());
    const save = makeSave();
    store.setActiveRun(save);
    expect(store.getActiveRun()).toEqual(save);
  });

  it("clears the active run", () => {
    const store = createLocalStore(createMemoryStore());
    store.setActiveRun(makeSave());
    store.clearActiveRun();
    expect(store.getActiveRun()).toBeNull();
  });

  it("appends to run history in order", () => {
    const store = createLocalStore(createMemoryStore());
    store.appendRunHistory(makeSummary({ id: "a" }));
    store.appendRunHistory(makeSummary({ id: "b" }));
    expect(store.getRunHistory().map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("caps run history at 50 entries, evicting the oldest first", () => {
    const store = createLocalStore(createMemoryStore());
    for (let i = 0; i < 55; i++) {
      store.appendRunHistory(makeSummary({ id: `run-${i}` }));
    }
    const history = store.getRunHistory();
    expect(history).toHaveLength(50);
    expect(history[0]?.id).toBe("run-5");
    expect(history[49]?.id).toBe("run-54");
  });

  it("returns default settings before any are set, and merges partial updates", () => {
    const store = createLocalStore(createMemoryStore());
    expect(store.getSettings()).toEqual({ soundOn: true, hapticsOn: true, onboardingSeen: false });

    store.setSettings({ onboardingSeen: true });
    expect(store.getSettings()).toEqual({ soundOn: true, hapticsOn: true, onboardingSeen: true });

    store.setSettings({ soundOn: false });
    expect(store.getSettings()).toEqual({ soundOn: false, hapticsOn: true, onboardingSeen: true });
  });

  it("resetAll clears the active run, history, and settings back to defaults", () => {
    const store = createLocalStore(createMemoryStore());
    store.setActiveRun(makeSave());
    store.appendRunHistory(makeSummary());
    store.setSettings({ soundOn: false });

    store.resetAll();

    expect(store.getActiveRun()).toBeNull();
    expect(store.getRunHistory()).toEqual([]);
    expect(store.getSettings()).toEqual({ soundOn: true, hapticsOn: true, onboardingSeen: false });
  });

  it("round-trips the content version", () => {
    const store = createLocalStore(createMemoryStore());
    expect(store.getContentVersion()).toBeUndefined();
    store.setContentVersion("2");
    expect(store.getContentVersion()).toBe("2");
  });
});
