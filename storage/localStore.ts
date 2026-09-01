import { KVStore } from "./kvStore";
import { GameSave, RunSummary, Settings } from "./types";

const ACTIVE_RUN_KEY = "active_run";
const RUN_HISTORY_KEY = "run_history";
const SETTINGS_KEY = "settings";
const CONTENT_VERSION_KEY = "content_version";

// FIFO cap per docs/03-database-schema.md — enough for a "best run" /
// recent-history screen without unbounded on-device growth.
const RUN_HISTORY_CAP = 50;

const DEFAULT_SETTINGS: Settings = {
  soundOn: true,
  hapticsOn: true,
  onboardingSeen: false,
};

export interface LocalStore {
  getActiveRun(): GameSave | null;
  setActiveRun(save: GameSave): void;
  clearActiveRun(): void;
  getRunHistory(): RunSummary[];
  appendRunHistory(summary: RunSummary): void;
  getSettings(): Settings;
  setSettings(patch: Partial<Settings>): void;
  getContentVersion(): string | undefined;
  setContentVersion(version: string): void;
  /** Wipes active run, run history, and settings back to defaults. Used by Settings > Reset Progress. */
  resetAll(): void;
}

export function createLocalStore(kv: KVStore): LocalStore {
  function readJSON<T>(key: string): T | undefined {
    const raw = kv.getString(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  }

  function writeJSON(key: string, value: unknown): void {
    kv.set(key, JSON.stringify(value));
  }

  return {
    getActiveRun() {
      return readJSON<GameSave>(ACTIVE_RUN_KEY) ?? null;
    },
    setActiveRun(save) {
      writeJSON(ACTIVE_RUN_KEY, save);
    },
    clearActiveRun() {
      kv.delete(ACTIVE_RUN_KEY);
    },
    getRunHistory() {
      return readJSON<RunSummary[]>(RUN_HISTORY_KEY) ?? [];
    },
    appendRunHistory(summary) {
      const history = readJSON<RunSummary[]>(RUN_HISTORY_KEY) ?? [];
      history.push(summary);
      const capped = history.slice(-RUN_HISTORY_CAP);
      writeJSON(RUN_HISTORY_KEY, capped);
    },
    getSettings() {
      return { ...DEFAULT_SETTINGS, ...readJSON<Settings>(SETTINGS_KEY) };
    },
    setSettings(patch) {
      const current = { ...DEFAULT_SETTINGS, ...readJSON<Settings>(SETTINGS_KEY) };
      writeJSON(SETTINGS_KEY, { ...current, ...patch });
    },
    getContentVersion() {
      return kv.getString(CONTENT_VERSION_KEY);
    },
    setContentVersion(version) {
      kv.set(CONTENT_VERSION_KEY, version);
    },
    resetAll() {
      kv.delete(ACTIVE_RUN_KEY);
      kv.delete(RUN_HISTORY_KEY);
      kv.delete(SETTINGS_KEY);
    },
  };
}
