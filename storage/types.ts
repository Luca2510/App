import { Side, Stat } from "../engine/types";

// Mirrors docs/03-database-schema.md §3.1 — the shape synced 1:1 to the
// Postgres `game_saves` table once Phase 2's backend exists.
export interface GameSave {
  id: string;
  turnCount: number;
  stats: Record<Stat, number>;
  flags: Record<string, true>;
  currentCardId: string;
  forcedNextCardId?: string;
  history: Array<{ cardId: string; choice: Side; turn: number }>;
  contentVersion: string;
  startedAt: string;
  updatedAt: string;
}

export interface RunSummary {
  id: string;
  endingId: string;
  finalStats: Record<Stat, number>;
  turnsSurvived: number;
  startedAt: string;
  endedAt: string;
}

export interface Settings {
  soundOn: boolean;
  hapticsOn: boolean;
  onboardingSeen: boolean;
}
