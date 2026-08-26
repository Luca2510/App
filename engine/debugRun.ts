import { applyChoice, createInitialState, getChoice } from "./gameState";
import { selectNextCard } from "./cardSelector";
import { resolveEnding } from "./endingResolver";
import { Category, DecisionCard, Ending, GameState, Side } from "./types";

const MAX_TURNS = 500;

export interface DebugRunResult {
  finalState: GameState;
  ending: Ending;
  log: string[];
}

/**
 * Plays one full life start-to-ending using the pure engine only — no UI,
 * no storage. This is the Phase 0 proof that applyChoice/selectNextCard/
 * resolveEnding compose into a playable run (docs/06-mvp-plan.md Phase 0
 * exit criterion). `chooseSide` defaults to a coin flip; tests pass a
 * deterministic or scripted chooser instead.
 */
export function playDebugRun(
  initialState: GameState,
  pool: DecisionCard[],
  endings: Ending[],
  options: {
    rng?: () => number;
    chooseSide?: (card: DecisionCard, state: GameState) => Side;
  } = {}
): DebugRunResult {
  const rng = options.rng ?? Math.random;
  const chooseSide = options.chooseSide ?? (() => (rng() < 0.5 ? "left" : "right"));

  let state = initialState;
  const log: string[] = [];
  const recentCategories: Category[] = [];

  for (let i = 0; i < MAX_TURNS; i++) {
    const card = pool.find((c) => c.id === state.currentCardId);
    if (!card) throw new Error(`Unknown card id "${state.currentCardId}"`);

    const side = chooseSide(card, state);
    const choice = getChoice(card, side);
    log.push(
      `Turn ${state.turnCount + 1} [${card.category}] "${card.prompt}" → ${choice.label}: ${choice.consequenceText}`
    );

    state = applyChoice(state, card, side);
    recentCategories.push(card.category);

    const ending = resolveEnding(state, endings);
    if (ending) {
      log.push(`--- ${ending.title} ---`);
      log.push(ending.description);
      log.push(
        `Survived ${state.turnCount} turns. Final stats: ${JSON.stringify(state.stats)}`
      );
      return { finalState: state, ending, log };
    }

    const nextCard = selectNextCard(state, pool, recentCategories, rng);
    state = { ...state, currentCardId: nextCard.id };
  }

  throw new Error(
    `Run exceeded ${MAX_TURNS} turns without reaching an ending — check stat balance/content coverage.`
  );
}

export { createInitialState };
