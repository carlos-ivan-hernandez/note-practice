// Per-tab state, so a reload (e.g. returning from another page) picks up where the user left off.
// New tabs start fresh, which keeps dark mode as the default.

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(`note-practice:${key}`);
    if (raw === null) return fallback;
    const value: T = JSON.parse(raw);
    return value;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    sessionStorage.setItem(`note-practice:${key}`, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the app works without it.
  }
}
