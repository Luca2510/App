import { Category, DecisionCard, GameState } from "./types";

const ANTI_REPEAT_WINDOW = 2;

export function isEligible(card: DecisionCard, state: GameState): boolean {
  if (card.minTurn !== undefined && state.turnCount < card.minTurn) return false;
  if (card.maxTurn !== undefined && state.turnCount > card.maxTurn) return false;
  if (card.oneShot && state.flags.has(`seen_${card.id}`)) return false;
  if (card.requiredFlags?.some((flag) => !state.flags.has(flag))) return false;
  if (card.forbiddenFlags?.some((flag) => state.flags.has(flag))) return false;
  return true;
}

function weightedPick(pool: DecisionCard[], rng: () => number): DecisionCard {
  const totalWeight = pool.reduce((sum, card) => sum + card.weight, 0);
  let roll = rng() * totalWeight;
  for (const card of pool) {
    roll -= card.weight;
    if (roll <= 0) return card;
  }
  // Floating point rounding — fall back to the last card rather than throw.
  // Safe: weightedPick is only ever called with a non-empty pool.
  return pool[pool.length - 1] as DecisionCard;
}

/**
 * `recentCategories` is the category of each of the last `ANTI_REPEAT_WINDOW`
 * drawn cards (oldest first), tracked by the caller alongside its turn
 * history — kept out of GameState so the engine's persisted shape stays
 * exactly the fields in docs/03-database-schema.md.
 */
export function selectNextCard(
  state: GameState,
  pool: DecisionCard[],
  recentCategories: Category[] = [],
  rng: () => number = Math.random
): DecisionCard {
  if (state.forcedNextCardId) {
    const forced = pool.find((card) => card.id === state.forcedNextCardId);
    if (forced && isEligible(forced, state)) return forced;
  }

  const eligible = pool.filter((card) => !card.isEnding && isEligible(card, state));
  if (eligible.length === 0) {
    throw new Error(
      `No eligible cards remain in the pool at turn ${state.turnCount} — check content coverage.`
    );
  }

  const recentWindow = recentCategories.slice(-ANTI_REPEAT_WINDOW);
  const preferred = eligible.filter((card) => !recentWindow.includes(card.category));
  const drawPool = preferred.length > 0 ? preferred : eligible;

  return weightedPick(drawPool, rng);
}
