import { GameState } from "../engine/types";
import { GameSave } from "./types";

export function toGameSave(
  state: GameState,
  meta: {
    id: string;
    history: GameSave["history"];
    contentVersion: string;
    startedAt: string;
    updatedAt: string;
  }
): GameSave {
  const flags: Record<string, true> = {};
  state.flags.forEach((flag) => {
    flags[flag] = true;
  });

  return {
    id: meta.id,
    turnCount: state.turnCount,
    stats: state.stats,
    flags,
    currentCardId: state.currentCardId,
    forcedNextCardId: state.forcedNextCardId,
    history: meta.history,
    contentVersion: meta.contentVersion,
    startedAt: meta.startedAt,
    updatedAt: meta.updatedAt,
  };
}

export function fromGameSave(save: GameSave): GameState {
  return {
    turnCount: save.turnCount,
    stats: save.stats,
    flags: new Set(Object.keys(save.flags)),
    currentCardId: save.currentCardId,
    forcedNextCardId: save.forcedNextCardId,
  };
}
