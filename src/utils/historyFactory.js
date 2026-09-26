/**
 * Generic localStorage history factory.
 * Encapsulates the exact pattern from watchHistory.js for reuse across
 * anime/donghua/komik history stores.
 */

const DEFAULT_MAX_ITEMS = 100;

/**
 * Format seconds to mm:ss or hh:mm:ss
 * @param {number} seconds
 * @returns {string|null}
 */
export const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return null;
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

/**
 * Junk-title guard. Provider scrapes occasionally leak non-episode posts
 * (e.g. "Tutorial Cara Melewati Shortlink di sankanime", "[ADS]" stubs)
 * into episode lists / episode payloads. Saving those pollutes watch
 * history with items the user never actually watched, so they must be
 * filtered at write time, at read time (self-heal), and from episode lists.
 */
const JUNK_TITLE_PATTERN = /shortlink|melewati|\[ads\]/i;

/**
 * @param {string} title
 * @returns {boolean} true when the title looks like a scraped non-episode post
 */
export const isJunkTitle = (title) =>
  typeof title === 'string' && JUNK_TITLE_PATTERN.test(title);

/**
 * @param {Object} item - history entry
 * @returns {boolean} true when the entry is missing identity or has a junk title
 */
export const isJunkHistoryEntry = (item) => {
  if (!item || typeof item !== 'object') return true;
  const hasId = Boolean(item.animeId || item.episodeId || item.komikSlug || item.chapterSlug);
  if (!hasId) return true;
  const title = `${item.animeTitle || item.komikTitle || ''} ${item.episodeTitle || item.chapterTitle || ''}`;
  if (!title.trim()) return true;
  return isJunkTitle(title);
};

/**
 * Create a history store instance.
 * @param {string} key - localStorage key
 * @param {number} [max=100] - maximum items to keep
 * @param {Object} [opts={}] - options
 * @param {string} [opts.migrateFrom] - old key to migrate from (one-time)
 * @param {string} [opts.idField='episodeId'] - field name for unique identifier
 * @returns {Object} store API
 */
export const createHistoryStore = (key, max = DEFAULT_MAX_ITEMS, opts = {}) => {
  const { migrateFrom, idField = 'episodeId' } = opts;
  const MAX_ITEMS = max;
  const STORAGE_KEY = key;

  const getHistory = () => {
    if (typeof window === 'undefined') return [];
    try {
      // One-time migration from old key
      if (migrateFrom) {
        const old = window.localStorage.getItem(migrateFrom);
        if (old) {
          window.localStorage.setItem(STORAGE_KEY, old);
          window.localStorage.removeItem(migrateFrom);
        }
      }
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const _save = (history) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore localStorage errors (quota, privacy mode)
    }
  };

  /**
   * Add or update history entry.
   * If the item already exists (by idField), MERGE preserving currentTime/duration.
   * @param {Object} item - history item with idField
   */
  const addToHistory = (item) => {
    if (typeof window === 'undefined' || !item?.[idField]) return;
    try {
      const history = getHistory();
      const existingIdx = history.findIndex((h) => h[idField] === item[idField]);

      if (existingIdx >= 0) {
        // Merge: keep existing progress, update metadata
        const existing = history[existingIdx];
        history.splice(existingIdx, 1); // remove from old position
        history.unshift({
          ...existing,
          ...item,
          // PRESERVE progress if already saved
          currentTime: existing.currentTime || item.currentTime || 0,
          duration: existing.duration || item.duration || 0,
          timestamp: Date.now(),
        });
      } else {
        history.unshift({
          ...item,
          currentTime: item.currentTime || 0,
          duration: item.duration || 0,
          timestamp: Date.now(),
        });
      }

      _save(history.slice(0, MAX_ITEMS));
    } catch {
      // Ignore errors
    }
  };

  /**
   * Update progress for an item by idField.
   * Saves currentTime + duration (floored).
   * @param {string} id - item identifier
   * @param {number} currentTime - current playback position in seconds
   * @param {number} [duration] - total duration in seconds
   */
  const updateProgress = (id, currentTime, duration) => {
    if (typeof window === 'undefined' || !id || !currentTime) return;
    try {
      const history = getHistory();
      const idx = history.findIndex((h) => h[idField] === id);
      if (idx >= 0) {
        history[idx].currentTime = Math.floor(currentTime);
        history[idx].duration = Math.floor(duration || 0);
        history[idx].lastWatched = Date.now();
        _save(history);
      }
    } catch {
      // Ignore errors
    }
  };

  /**
   * Get saved progress for an item (returns seconds or 0)
   * @param {string} id - item identifier
   * @returns {number}
   */
  const getProgress = (id) => {
    if (typeof window === 'undefined' || !id) return 0;
    try {
      const history = getHistory();
      const item = history.find((h) => h[idField] === id);
      return item?.currentTime || 0;
    } catch {
      return 0;
    }
  };

  /**
   * Remove entries matching a predicate (e.g. self-heal junk entries).
   * @param {(item: Object) => boolean} predicate - return true to REMOVE
   */
  const purgeEntries = (predicate) => {
    if (typeof window === 'undefined' || typeof predicate !== 'function') return 0;
    try {
      const history = getHistory();
      const clean = history.filter((h) => !predicate(h));
      const removed = history.length - clean.length;
      if (removed > 0) _save(clean);
      return removed;
    } catch {
      return 0;
    }
  };

  /**
   * Clear all history for this store
   */
  const clearHistory = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return {
    getHistory,
    addToHistory,
    updateProgress,
    getProgress,
    clearHistory,
    purgeEntries,
    formatTime,
  };
};