/**
 * Full validation pass over the shipped content, standing in for the
 * "prove the game loop works mathematically" step before any content
 * expansion: card draw distribution, ending distribution, per-stat
 * recoverability, story-chain activation rates, and early-game variety.
 */
import { applyChoice, createInitialState, getChoice } from "../engine/gameState";
import { selectNextCard } from "../engine/cardSelector";
import { resolveEnding } from "../engine/endingResolver";
import { Category, Side, Stat, STATS } from "../engine/types";
import { cards, endings, STARTING_CARD_ID } from "../content";

const RUNS = 5000;
const EARLY_WINDOW = 15;
const NEAR_FLOOR = 15;
const NEAR_CEILING = 85;

const CHAIN_FLAGS = [
  "made_rival_deal",
  "rival_debt_called_in",
  "fought_cofounder",
  "built_empire_alone",
  "parent_moved_in",
  "gave_up_everything_for_parent",
  "placed_parent_alone",
  "fighting_dirty_custody",
  "won_full_custody",
  "invested_in_startup",
  "cashed_out_startup",
  "stayed_in_startup",
  "cooperated_fraud_probe",
  "shielded_friend_fraud",
  "gambling_temptation",
  "sought_gambling_help",
  "gambling_spiral_deep",
  "blew_whistle",
  "exposed_retaliation",
  "reported_boss_fraud",
  "covered_boss_fraud",
  "confessed_late",
  "betrayed_boss",
] as const;

function makeRng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

const cardsById = new Map(cards.map((c) => [c.id, c]));
const endingsById = new Map(endings.map((e) => [e.id, e]));

const cardDrawCounts = new Map<string, number>(cards.map((c) => [c.id, 0]));
const endingCounts = new Map<string, number>(endings.map((e) => [e.id, 0]));
const turnCounts: number[] = [];
const chainFlagCounts = new Map<string, number>(CHAIN_FLAGS.map((f) => [f, 0]));

const dippedLow = new Map<Stat, number>(STATS.map((s) => [s, 0]));
const diedLow = new Map<Stat, number>(STATS.map((s) => [s, 0]));
const spikedHigh = new Map<Stat, number>(STATS.map((s) => [s, 0]));
const diedHigh = new Map<Stat, number>(STATS.map((s) => [s, 0]));

const earlyCardIdsSeen = new Set<string>();
let earlyCategoryRepeats = 0;
let earlyTransitionsObserved = 0;

for (let seed = 1; seed <= RUNS; seed++) {
  const rng = makeRng(seed);
  let state = createInitialState(STARTING_CARD_ID);
  const recentCategories: Category[] = [];
  const seenLowThisRun = new Set<Stat>();
  const seenHighThisRun = new Set<Stat>();
  const earlyCategories: Category[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const card = cardsById.get(state.currentCardId)!;
    cardDrawCounts.set(card.id, (cardDrawCounts.get(card.id) ?? 0) + 1);

    if (state.turnCount < EARLY_WINDOW) {
      earlyCardIdsSeen.add(card.id);
      earlyCategories.push(card.category);
    }

    const side: Side = rng() < 0.5 ? "left" : "right";
    const choice = getChoice(card, side);
    const nextState = applyChoice(state, card, side);
    recentCategories.push(card.category);

    for (const s of STATS) {
      if (nextState.stats[s] <= NEAR_FLOOR) seenLowThisRun.add(s);
      if (nextState.stats[s] >= NEAR_CEILING) seenHighThisRun.add(s);
    }
    for (const f of CHAIN_FLAGS) {
      if (nextState.flags.has(f) && !state.flags.has(f)) {
        chainFlagCounts.set(f, (chainFlagCounts.get(f) ?? 0) + 1);
      }
    }

    const ending = resolveEnding(nextState, endings);
    if (ending) {
      endingCounts.set(ending.id, (endingCounts.get(ending.id) ?? 0) + 1);
      turnCounts.push(nextState.turnCount);

      for (const s of STATS) {
        if (nextState.stats[s] === 0) diedLow.set(s, (diedLow.get(s) ?? 0) + 1);
        if (nextState.stats[s] === 100) diedHigh.set(s, (diedHigh.get(s) ?? 0) + 1);
      }
      for (const s of seenLowThisRun) dippedLow.set(s, (dippedLow.get(s) ?? 0) + 1);
      for (const s of seenHighThisRun) spikedHigh.set(s, (spikedHigh.get(s) ?? 0) + 1);

      for (let i = 1; i < Math.min(earlyCategories.length, EARLY_WINDOW); i++) {
        earlyTransitionsObserved++;
        if (earlyCategories[i] === earlyCategories[i - 1]) earlyCategoryRepeats++;
      }
      break;
    }

    const nextCard = selectNextCard(nextState, cards, recentCategories.slice(-2), rng);
    state = { ...nextState, currentCardId: nextCard.id };
  }
}

function pct(n: number, of: number): string {
  return `${((n / of) * 100).toFixed(1)}%`;
}

console.log(`=== ${RUNS} randomized runs across ${cards.length} cards / ${endings.length} endings ===\n`);

// --- Card draw distribution ---
console.log("--- Card draw distribution ---");
const neverDrawn = cards.filter((c) => (cardDrawCounts.get(c.id) ?? 0) === 0);
const drawCounts = [...cardDrawCounts.entries()].sort((a, b) => a[1] - b[1]);
console.log(`Least drawn: ${drawCounts.slice(0, 5).map(([id, n]) => `${id} (${n})`).join(", ")}`);
console.log(`Most drawn:  ${drawCounts.slice(-5).reverse().map(([id, n]) => `${id} (${n})`).join(", ")}`);
if (neverDrawn.length > 0) {
  console.log(`NEVER DRAWN (${neverDrawn.length}): ${neverDrawn.map((c) => c.id).join(", ")}`);
} else {
  console.log("Every card was drawn at least once. No unreachable content.");
}

// --- Ending distribution ---
console.log("\n--- Ending distribution ---");
const sortedEndings = [...endingCounts.entries()].sort((a, b) => b[1] - a[1]);
for (const [id, count] of sortedEndings) {
  const ending = endingsById.get(id)!;
  console.log(
    `  ${pct(count, RUNS).padStart(6)}  (${String(count).padStart(4)})  [${ending.rarity}] ${ending.title}`
  );
}
const topShare = (sortedEndings[0]?.[1] ?? 0) / RUNS;
console.log(topShare > 0.35 ? `WARNING: top ending exceeds 35% dominance.` : "No single ending exceeds 35% dominance.");

turnCounts.sort((a, b) => a - b);
const p = (q: number) => turnCounts[Math.floor(turnCounts.length * q)];
console.log(`\nTurn survival: p10=${p(0.1)}  median=${p(0.5)}  p90=${p(0.9)}  max=${turnCounts[turnCounts.length - 1]}`);

// --- Per-stat recoverability ---
console.log("\n--- Stat recoverability (dipped to <=15 or spiked to >=85 at any point during the run) ---");
for (const s of STATS) {
  const dl = dippedLow.get(s) ?? 0;
  const dh = spikedHigh.get(s) ?? 0;
  const killedLow = diedLow.get(s) ?? 0;
  const killedHigh = diedHigh.get(s) ?? 0;
  const lowRecoveryRate = dl > 0 ? 1 - killedLow / dl : NaN;
  const highRecoveryRate = dh > 0 ? 1 - killedHigh / dh : NaN;
  console.log(
    `  ${s.padEnd(14)} low: dipped ${pct(dl, RUNS)} of runs, of those ${pct(killedLow, dl)} died there (recovered ${(lowRecoveryRate * 100).toFixed(1)}%)`
  );
  console.log(
    `  ${"".padEnd(14)} high: spiked ${pct(dh, RUNS)} of runs, of those ${pct(killedHigh, dh)} died there (recovered ${(highRecoveryRate * 100).toFixed(1)}%)`
  );
}

// --- Story chain activation ---
console.log("\n--- Story-chain flag activation rates ---");
for (const f of CHAIN_FLAGS) {
  console.log(`  ${pct(chainFlagCounts.get(f) ?? 0, RUNS).padStart(6)}  ${f}`);
}

// --- Early-game variety ---
console.log(`\n--- Early-game variety (first ${EARLY_WINDOW} turns) ---`);
console.log(
  `Unique cards seen in an early window across all ${RUNS} runs: ${earlyCardIdsSeen.size} / ${cards.length} (${pct(earlyCardIdsSeen.size, cards.length)})`
);
console.log(
  `Category repeated from the immediately preceding turn: ${pct(earlyCategoryRepeats, earlyTransitionsObserved)} of early-game turn transitions`
);
