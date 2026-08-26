export type Stat = "morality" | "wealth" | "relationships" | "sanity";

export const STATS: readonly Stat[] = ["morality", "wealth", "relationships", "sanity"];

export type Category = "moral" | "financial" | "relational" | "power";

export type Side = "left" | "right";

export type TriggerDirection = "floor" | "ceiling";

export interface Choice {
  label: string;
  deltas: Partial<Record<Stat, number>>;
  setsFlags?: string[];
  consequenceText: string;
  /** Forces the next draw to this card id, overriding the weighted pool. */
  nextCardId?: string;
}

export interface DecisionCard {
  id: string;
  version: number;
  prompt: string;
  imageKey?: string;
  category: Category;
  /** Relative draw probability. Default authoring weight is 10. */
  weight: number;
  minTurn?: number;
  maxTurn?: number;
  requiredFlags?: string[];
  forbiddenFlags?: string[];
  /** Auto-sets `seen_<id>` on draw and is excluded from future draws. */
  oneShot?: boolean;
  choiceLeft: Choice;
  choiceRight: Choice;
  /** Terminal card — never returned by selectNextCard. */
  isEnding?: boolean;
}

export interface Ending {
  id: string;
  triggerStat: Stat;
  triggerDirection: TriggerDirection;
  title: string;
  description: string;
  imageKey?: string;
  rarity: string;
  /** If set, this ending is preferred over a same-trigger generic one when all flags are present. */
  requiredFlags?: string[];
}

export interface GameState {
  turnCount: number;
  stats: Record<Stat, number>;
  flags: Set<string>;
  currentCardId: string;
  forcedNextCardId?: string;
}
