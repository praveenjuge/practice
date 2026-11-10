// Web version of local-store.ts, backed by localStorage.

const prefixed = (key: string) => `practice.${key}`;

export const readJSON = <T>(key: string): T | null => {
  try {
    const value = globalThis.localStorage?.getItem(prefixed(key));
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
};

export const writeJSON = (key: string, value: unknown) => {
  try {
    globalThis.localStorage?.setItem(prefixed(key), JSON.stringify(value));
  } catch {
    // Storage full or blocked: the app still works, just without a cache.
  }
};

export const removeJSON = (key: string) => {
  try {
    globalThis.localStorage?.removeItem(prefixed(key));
  } catch {
    // Nothing to remove.
  }
};
