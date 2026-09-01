/**
 * Thin storage port so the save logic can run against real MMKV on-device
 * and an in-memory store in tests/the debug CLI harness, without either
 * caller knowing which one it's talking to.
 */
export interface KVStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

export function createMemoryStore(): KVStore {
  const map = new Map<string, string>();
  return {
    getString: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, value);
    },
    delete: (key) => {
      map.delete(key);
    },
  };
}

export function createMMKVStore(): KVStore {
  // Required lazily so importing this module in Node (tests, the debug
  // harness) never touches the native MMKV binding.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV } = require("react-native-mmkv");
  const mmkv = new MMKV({ id: "hardest-decision" });
  return {
    getString: (key) => mmkv.getString(key),
    set: (key, value) => mmkv.set(key, value),
    delete: (key) => mmkv.delete(key),
  };
}
