# 4. Game-State System & Decision Engine

## Design choice: weighted card pool + flags, not a hand-authored tree

A fully branching narrative tree (every choice leads to a unique next node,
authored by hand) does not scale: to get N turns of real branching you need
roughly 2^N authored nodes. It also makes balancing the 4 stats nearly
impossible to reason about.

Instead we use the pattern *Reigns* popularized: a **pool of mostly
independent decision cards**, drawn each turn by a weighted, condition-
filtered selector, with **flags** used to create the *feeling* of branching
narrative (recurring characters, callbacks, multi-step arcs) at a fraction
of the authoring cost. A handful of cards do chain directly to a specific
next card (`nextCardId`) to author short, deliberate story beats — the pool
is the default, chaining is the exception.

This is the single most important architectural decision in the game and
everything below serves it.

## Core state

```ts
type Stat = "morality" | "wealth" | "relationships" | "sanity";

type GameState = {
  turnCount: number;
  stats: Record<Stat, number>;      // 0-100 each, start at 50
  flags: Set<string>;
  currentCardId: string;
  forcedNextCardId?: string;
};
```

Four stats, each 0–100, starting at 50 — centered so every run opens with
genuine room to swing either direction:

| Stat | Floor (0) means | Ceiling (100) means |
|---|---|---|
| **Morality** | Ruthless — you'll do anything | Saintly — you refuse to compromise, ever |
| **Wealth** | Destitute | Obscenely rich, at some cost |
| **Relationships** | Utterly alone | Suffocated by obligation to everyone |
| **Sanity** | Unraveled | Rigid, hollow control |

Both extremes of every stat are framed as an *ending*, not "good" vs "bad" —
maxing a stat is exactly as fatal as bottoming it out. That's what keeps
every choice genuinely hard: there's no stat you just want to pump.

## Decision card schema

```ts
type Choice = {
  label: string;                     // shown on the swipe hint, e.g. "Tell him"
  deltas: Partial<Record<Stat, number>>;   // e.g. { morality: -8, relationships: -5 }
  setsFlags?: string[];
  consequenceText: string;            // one-line confirmation shown after swipe
  nextCardId?: string;                 // forces the next draw (story chaining)
};

type DecisionCard = {
  id: string;
  version: number;
  prompt: string;                       // the dilemma text
  imageKey?: string;
  category: "moral" | "financial" | "relational" | "power";
  weight: number;                         // relative draw probability, default 10
  minTurn?: number;
  maxTurn?: number;
  requiredFlags?: string[];                 // all must be set
  forbiddenFlags?: string[];                  // none may be set
  oneShot?: boolean;                            // auto-sets `seen_<id>` flag; excluded once seen
  choiceLeft: Choice;
  choiceRight: Choice;
  isEnding?: boolean;                             // terminal card, no next draw
};
```

Example:

```json
{
  "id": "betray_partner_01",
  "prompt": "The only doctor who can save your daughter wants the location of your business partner, who's hiding from the people who'll kill him for what you both did.",
  "category": "moral",
  "weight": 10,
  "minTurn": 5,
  "requiredFlags": ["has_daughter", "has_partner"],
  "oneShot": true,
  "choiceLeft": {
    "label": "Give up the location",
    "deltas": { "morality": -15, "relationships": -10 },
    "setsFlags": ["betrayed_partner"],
    "consequenceText": "Your daughter lives. Your partner doesn't."
  },
  "choiceRight": {
    "label": "Refuse",
    "deltas": { "sanity": -12 },
    "setsFlags": ["protected_partner"],
    "consequenceText": "You'll never know if there was another way."
  }
}
```

## State transition (pure function)

```ts
function applyChoice(state: GameState, card: DecisionCard, side: "left" | "right"): GameState {
  const choice = side === "left" ? card.choiceLeft : card.choiceRight;
  const stats = clampAll(mergeDeltas(state.stats, choice.deltas));   // clamp each to [0,100]
  const flags = new Set(state.flags);
  choice.setsFlags?.forEach(f => flags.add(f));
  if (card.oneShot) flags.add(`seen_${card.id}`);

  return {
    ...state,
    turnCount: state.turnCount + 1,
    stats,
    flags,
    forcedNextCardId: choice.nextCardId,
  };
}
```

## Card selection (pure function, runs after `applyChoice`)

```ts
function selectNextCard(state: GameState, pool: DecisionCard[]): DecisionCard {
  // 1. An ending always wins — checked by the caller via resolveEnding()
  //    *before* selectNextCard is invoked; this fn assumes the run continues.

  // 2. Explicit chaining from the previous choice, if still eligible.
  if (state.forcedNextCardId) {
    const forced = pool.find(c => c.id === state.forcedNextCardId);
    if (forced && isEligible(forced, state)) return forced;
    // else fall through to random draw — a chained beat whose
    // prerequisites no longer hold is skipped, never a dead end.
  }

  // 3. Filter the pool to eligible cards.
  const eligible = pool.filter(c => isEligible(c, state) && !c.isEnding);

  // 4. Soft anti-repeat: prefer cards whose category differs from the
  //    last 2 turns, if that leaves at least one option.
  const recentCategories = lastNCategories(state, 2);
  const preferred = eligible.filter(c => !recentCategories.includes(c.category));
  const drawPool = preferred.length > 0 ? preferred : eligible;

  // 5. Weighted random pick.
  return weightedPick(drawPool);
}

function isEligible(card: DecisionCard, state: GameState): boolean {
  if (card.minTurn && state.turnCount < card.minTurn) return false;
  if (card.maxTurn && state.turnCount > card.maxTurn) return false;
  if (card.oneShot && state.flags.has(`seen_${card.id}`)) return false;
  if (card.requiredFlags?.some(f => !state.flags.has(f))) return false;
  if (card.forbiddenFlags?.some(f => state.flags.has(f))) return false;
  return true;
}
```

## Ending resolution

Checked immediately after `applyChoice`, before drawing the next card:

```ts
function resolveEnding(state: GameState, endings: Ending[]): Ending | null {
  const broken = (Object.keys(state.stats) as Stat[]).find(
    stat => state.stats[stat] === 0 || state.stats[stat] === 100
  );
  if (!broken) return null;

  const direction = state.stats[broken] === 0 ? "floor" : "ceiling";
  const candidates = endings.filter(
    e => e.triggerStat === broken && e.triggerDirection === direction
  );
  // Prefer an ending whose own flag requirements match the run's flags
  // (a more specific, narratively earned ending) before falling back to
  // the generic one for that stat/direction.
  return pickMostSpecific(candidates, state.flags) ?? candidates[0];
}
```

If two stats break on the same turn (a choice with deltas on multiple
stats can do this), priority order is fixed:
**sanity > morality > relationships > wealth** — sanity breaking is framed
as the most narratively final ("you lost yourself"), so it takes precedence
regardless of which other stat also broke that turn.

## Content authoring rules (for whoever writes the 100–150 cards)

1. Every choice must move **at least one stat**; a choice that changes
   nothing isn't a decision.
2. No choice may be strictly better than the other on every stat — if one
   side is dominant, it isn't a hard decision, cut the card.
3. `weight` defaults to 10; only deviate for deliberately rare/high-impact
   cards (`weight: 3`) or filler-tension cards (`weight: 20`).
4. `oneShot` should be true for anything with a proper noun (a named
   character, a specific past event) — recurring generic dilemmas
   ("a stranger asks for money") can repeat.
5. Chain (`nextCardId`) sparingly — 2–4 turn arcs, not long trees. The pool
   is the default; chaining is for a handful of hand-built story beats per
   stat family.
6. Every stat needs cards that push it in **both** directions at roughly
   equal density, or the stat's ending becomes statistically rare/common in
   a way that wasn't a design choice.

## Testing strategy for this module

Because `/engine` is pure, it should carry the project's heaviest test
coverage: table-driven tests asserting `applyChoice` clamping behavior at
the 0/100 boundaries, `selectNextCard` respecting every eligibility rule,
and a full content-set lint (via the zod schema in `03-database-schema.md`'s
Phase-2 mirror) that fails CI if any card references a flag no choice ever
sets, or a `nextCardId` that doesn't exist.
