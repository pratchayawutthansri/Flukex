export interface KeyValueStorage {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

class BrowserKeyValueStorage implements KeyValueStorage {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T) {
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string) {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  }
}

export const browserStorage: KeyValueStorage = new BrowserKeyValueStorage();
export const STORAGE_KEYS = {
  session: "flukex-pos:session",
  registeredUsers: "flukex-pos:registered-users",
  repositoryPrefix: "flukex-pos:repository:",
  subscription: "flukex-pos:subscription",
} as const;
