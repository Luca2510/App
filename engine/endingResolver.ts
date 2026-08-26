import { Ending, GameState, Stat } from "./types";

/**
 * If a choice breaks more than one stat on the same turn, sanity takes
 * precedence as the most narratively final ending, per docs/04-decision-engine.md.
 */
const BREAK_PRIORITY: readonly Stat[] = ["sanity", "morality", "relationships", "wealth"];

export function resolveEnding(state: GameState, endings: Ending[]): Ending | null {
  const brokenStat = BREAK_PRIORITY.find(
    (stat) => state.stats[stat] === 0 || state.stats[stat] === 100
  );
  if (!brokenStat) return null;

  const direction = state.stats[brokenStat] === 0 ? "floor" : "ceiling";
  const candidates = endings.filter(
    (ending) => ending.triggerStat === brokenStat && ending.triggerDirection === direction
  );
  if (candidates.length === 0) {
    throw new Error(`No ending defined for ${brokenStat}/${direction} — content gap.`);
  }

  const specific = candidates.filter((ending) =>
    ending.requiredFlags?.every((flag) => state.flags.has(flag))
  );
  // Safe: candidates is non-empty (checked above), and specific falls back
  // to it, so this array is always non-empty too.
  return (specific.length > 0 ? specific : candidates)[0] as Ending;
}
