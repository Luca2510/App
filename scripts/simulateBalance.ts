/**
 * Phase 2 balancing pass, standing in for real playtester data (docs/06):
 * play the shipped content many times with random choices and report the
 * ending distribution. Flags it if any single ending dominates, which would
 * mean the run isn't producing the varied deaths the design calls for.
 */
import { playDebugRun } from "../engine/debugRun";
import { createInitialState } from "../engine/gameState";
import { cards, endings, STARTING_CARD_ID } from "../content";

const RUNS = 2000;
const DOMINANCE_WARNING_THRESHOLD = 0.35;

const counts = new Map<string, number>();
const turnCounts: number[] = [];

for (let seed = 1; seed <= RUNS; seed++) {
  let state = seed;
  const rng = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  const result = playDebugRun(createInitialState(STARTING_CARD_ID), cards, endings, { rng });
  counts.set(result.ending.id, (counts.get(result.ending.id) ?? 0) + 1);
  turnCounts.push(result.finalState.turnCount);
}

const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
const endingsById = new Map(endings.map((e) => [e.id, e]));

console.log(`${RUNS} randomized runs across ${cards.length} cards / ${endings.length} endings\n`);
console.log("Ending distribution:");
for (const [id, count] of sorted) {
  const pct = ((count / RUNS) * 100).toFixed(1);
  const title = endingsById.get(id)?.title ?? id;
  console.log(`  ${pct.padStart(5)}%  (${String(count).padStart(4)})  ${title}`);
}

const unreached = endings.filter((e) => !counts.has(e.id));
if (unreached.length > 0) {
  console.log(`\nNever reached in ${RUNS} runs (expected for rare/flag-gated endings): ${unreached.map((e) => e.title).join(", ")}`);
}

const [topId, topCount] = sorted[0]!;
const topShare = topCount / RUNS;
turnCounts.sort((a, b) => a - b);
const median = turnCounts[Math.floor(turnCounts.length / 2)];

console.log(`\nMedian turns survived: ${median}`);
if (topShare > DOMINANCE_WARNING_THRESHOLD) {
  console.log(
    `\nWARNING: "${endingsById.get(topId)?.title}" accounts for ${(topShare * 100).toFixed(1)}% of runs (>${DOMINANCE_WARNING_THRESHOLD * 100}%) — consider rebalancing that stat's card deltas.`
  );
} else {
  console.log(`\nNo single ending exceeds the ${DOMINANCE_WARNING_THRESHOLD * 100}% dominance threshold.`);
}
