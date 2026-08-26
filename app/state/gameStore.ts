import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { applyChoice, createInitialState, getChoice } from "../../engine/gameState";
import { selectNextCard } from "../../engine/cardSelector";
import { resolveEnding } from "../../engine/endingResolver";
import { Category, DecisionCard, Ending, GameState, Side } from "../../engine/types";
import { cards, endings, CONTENT_VERSION, STARTING_CARD_ID } from "../../content";
import { createLocalStore } from "../../storage/localStore";
import { createMMKVStore } from "../../storage/kvStore";
import { fromGameSave, toGameSave } from "../../storage/serialize";
import { GameSave, RunSummary, Settings } from "../../storage/types";

const localStore = createLocalStore(createMMKVStore());
const cardsById = new Map(cards.map((card) => [card.id, card]));

const RECENT_WINDOW = 2;

function recentCategories(history: GameSave["history"]): Category[] {
  return history
    .slice(-RECENT_WINDOW)
    .map((entry) => cardsById.get(entry.cardId)?.category)
    .filter((category): category is Category => Boolean(category));
}

interface GameStoreState {
  settings: Settings;
  bootstrapped: boolean;

  engineState: GameState | null;
  currentCard: DecisionCard | null;
  history: GameSave["history"];
  runId: string | null;
  startedAt: string | null;

  lastConsequence: string | null;
  ending: Ending | null;
  runSummary: RunSummary | null;

  bootstrap: () => void;
  startNewRun: () => void;
  choose: (side: Side) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetProgress: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  settings: localStore.getSettings(),
  bootstrapped: false,

  engineState: null,
  currentCard: null,
  history: [],
  runId: null,
  startedAt: null,

  lastConsequence: null,
  ending: null,
  runSummary: null,

  bootstrap: () => {
    const settings = localStore.getSettings();
    const active = localStore.getActiveRun();

    if (active) {
      const engineState = fromGameSave(active);
      set({
        settings,
        bootstrapped: true,
        engineState,
        currentCard: cardsById.get(engineState.currentCardId) ?? null,
        history: active.history,
        runId: active.id,
        startedAt: active.startedAt,
      });
      return;
    }

    set({ settings, bootstrapped: true });
  },

  startNewRun: () => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const engineState = createInitialState(STARTING_CARD_ID);
    const currentCard = cardsById.get(STARTING_CARD_ID) ?? null;

    localStore.setActiveRun(
      toGameSave(engineState, {
        id,
        history: [],
        contentVersion: CONTENT_VERSION,
        startedAt: now,
        updatedAt: now,
      })
    );

    set({
      engineState,
      currentCard,
      history: [],
      runId: id,
      startedAt: now,
      lastConsequence: null,
      ending: null,
      runSummary: null,
    });
  },

  choose: (side) => {
    const { engineState, currentCard, history, runId, startedAt } = get();
    if (!engineState || !currentCard || !runId || !startedAt) return;

    const choice = getChoice(currentCard, side);
    const nextState = applyChoice(engineState, currentCard, side);
    const newHistory = [...history, { cardId: currentCard.id, choice: side, turn: nextState.turnCount }];
    const now = new Date().toISOString();

    const ending = resolveEnding(nextState, endings);
    if (ending) {
      const summary: RunSummary = {
        id: runId,
        endingId: ending.id,
        finalStats: nextState.stats,
        turnsSurvived: nextState.turnCount,
        startedAt,
        endedAt: now,
      };
      localStore.appendRunHistory(summary);
      localStore.clearActiveRun();
      set({
        engineState: nextState,
        currentCard: null,
        history: newHistory,
        lastConsequence: choice.consequenceText,
        ending,
        runSummary: summary,
      });
      return;
    }

    const nextCard = selectNextCard(nextState, cards, recentCategories(newHistory));
    const advancedState: GameState = { ...nextState, currentCardId: nextCard.id };

    localStore.setActiveRun(
      toGameSave(advancedState, {
        id: runId,
        history: newHistory,
        contentVersion: CONTENT_VERSION,
        startedAt,
        updatedAt: now,
      })
    );

    set({
      engineState: advancedState,
      currentCard: nextCard,
      history: newHistory,
      lastConsequence: choice.consequenceText,
    });
  },

  updateSettings: (patch) => {
    localStore.setSettings(patch);
    set({ settings: localStore.getSettings() });
  },

  resetProgress: () => {
    localStore.resetAll();
    set({
      settings: localStore.getSettings(),
      engineState: null,
      currentCard: null,
      history: [],
      runId: null,
      startedAt: null,
      lastConsequence: null,
      ending: null,
      runSummary: null,
    });
  },
}));
