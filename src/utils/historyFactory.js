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
    formatTime,
  };
};