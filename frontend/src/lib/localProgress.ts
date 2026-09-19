// ============================================================
// Local progress tracking (no account, no backend)
// All course progress is stored in the browser's localStorage:
//   - Watch position per lesson   → ffm_watch_history
//   - Completed lessons           → ffm_completed_lessons
//   - Last opened lesson          → ffm_last_lesson
// Legacy per-user keys (ffm_watch_history_<userId> from the old
// auth system) are merged into the single canonical key on first
// load so no previously saved progress is lost.
// ============================================================

export interface WatchEntry {
  title: string;
  thumbnail: string | null;
  currentTime: number;
  duration: number;
  lastWatchedAt: number;
}

export type WatchHistory = Record<string, WatchEntry>;

export interface LastLesson {
  id: number;
  title: string;
  thumbnail: string | null;
  openedAt: number;
}

export const WATCH_HISTORY_KEY = 'ffm_watch_history';
export const COMPLETED_LESSONS_KEY = 'ffm_completed_lessons';
export const LAST_LESSON_KEY = 'ffm_last_lesson';

const LEGACY_KEY_PREFIX = 'ffm_watch_history_';

function parseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Load watch history. On the first run this also merges any legacy
 * per-user keys (ffm_watch_history_<userId>) left over from the old
 * auth system, keeping the most recently watched entry per lesson.
 */
export function loadWatchHistory(): WatchHistory {
  if (typeof window === 'undefined') return {};

  try {
    const current = parseJSON<WatchHistory>(localStorage.getItem(WATCH_HISTORY_KEY), {});
    let merged = current;

    const legacyKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LEGACY_KEY_PREFIX)) legacyKeys.push(key);
    }

    for (const key of legacyKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) {
        localStorage.removeItem(key);
        continue;
      }
      let legacy: WatchHistory;
      try {
        legacy = JSON.parse(raw);
      } catch {
        continue; // unparseable — leave it, don't destroy data
      }
      let changed = false;
      const next = { ...merged };
      for (const [lessonId, entry] of Object.entries(legacy)) {
        const existing = next[lessonId];
        if (
          !existing ||
          (entry && (entry.lastWatchedAt ?? 0) > (existing.lastWatchedAt ?? 0))
        ) {
          next[lessonId] = entry as WatchEntry;
          changed = true;
        }
      }
      if (changed) {
        merged = next;
        localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(merged));
      }
      localStorage.removeItem(key);
    }

    return merged;
  } catch {
    return {};
  }
}

export function saveWatchEntry(lessonId: number | string, entry: WatchEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const history = parseJSON<WatchHistory>(localStorage.getItem(WATCH_HISTORY_KEY), {});
    history[String(lessonId)] = entry;
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Storage full or unavailable — ignore, progress simply isn't persisted
  }
}

export function loadCompletedLessons(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  const ids = parseJSON<number[]>(localStorage.getItem(COMPLETED_LESSONS_KEY), []);
  return new Set(ids.filter((id) => typeof id === 'number'));
}

export function saveCompletedLessons(completed: Set<number>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify(Array.from(completed)));
  } catch {
    // ignore
  }
}

export function loadLastLesson(): LastLesson | null {
  if (typeof window === 'undefined') return null;
  const last = parseJSON<LastLesson | null>(localStorage.getItem(LAST_LESSON_KEY), null);
  if (!last || typeof last.id !== 'number') return null;
  return last;
}

export function saveLastLesson(last: LastLesson): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_LESSON_KEY, JSON.stringify(last));
  } catch {
    // ignore
  }
}
