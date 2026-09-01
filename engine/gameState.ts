import { Choice, DecisionCard, GameState, Side, Stat, STATS } from "./types";

const STAT_FLOOR = 0;
const STAT_CEILING = 100;
const STARTING_STAT_VALUE = 50;

export function createInitialState(startCardId: string): GameState {
  const stats = {} as Record<Stat, number>;
  for (const stat of STATS) stats[stat] = STARTING_STAT_VALUE;

  return {
    turnCount: 0,
    stats,
    flags: new Set<string>(),
    currentCardId: startCardId,
    forcedNextCardId: undefined,
  };
}

export function clampStat(value: number): number {
  return Math.min(STAT_CEILING, Math.max(STAT_FLOOR, value));
}

export function getChoice(card: DecisionCard, side: Side): Choice {
  return side === "left" ? card.choiceLeft : card.choiceRight;
}

export function applyChoice(state: GameState, card: DecisionCard, side: Side): GameState {
  const choice = getChoice(card, side);

  const stats = { ...state.stats };
  for (const [stat, delta] of Object.entries(choice.deltas) as [Stat, number][]) {
    stats[stat] = clampStat(stats[stat] + delta);
  }

  const flags = new Set(state.flags);
  choice.setsFlags?.forEach((flag) => flags.add(flag));
  if (card.oneShot) flags.add(`seen_${card.id}`);

  return {
    ...state,
    turnCount: state.turnCount + 1,
    stats,
    flags,
    forcedNextCardId: choice.nextCardId,
  };
}
