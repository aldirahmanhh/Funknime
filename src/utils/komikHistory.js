import { createHistoryStore, formatTime } from './historyFactory';

const store = createHistoryStore('mrfunk_komik_history', 100, { idField: 'komikSlug' });

/**
 * Parse chapter number from chapter slug.
 * e.g. "chapter-1", "chapter-1-2", "chapter-1.5" -> "1" or "1-2" or "1.5"
 * @param {string} chapterSlug
 * @returns {string|null}
 */
export const parseChapterNum = (chapterSlug) => {
  return (chapterSlug || '').match(/-chapter-(\d+(?:[.-]\d+)?)$/i)?.[1] ?? null;
};

/**
 * Get last read item for a komik slug.
 * Returns item or null if not found.
 * @param {string} komikSlug
 * @returns {Object|null}
 */
export const getKomikLastRead = (komikSlug) => {
  if (typeof window === 'undefined' || !komikSlug) return null;
  try {
    const history = store.getHistory();
    const item = history.find((h) => h.komikSlug === komikSlug);
    return item || null;
  } catch {
    return null;
  }
};

/**
 * Custom addKomikHistory that handles scrollProgress clamp 0-100
 * and ensures merge by komikSlug updates chapter info.
 */
export const addKomikHistory = (item) => {
  if (typeof window === 'undefined' || !item?.komikSlug) return;

  // Clamp scrollProgress to 0-100
  if (item.scrollProgress !== undefined) {
    item.scrollProgress = Math.max(0, Math.min(100, item.scrollProgress));
  }

  // Ensure chapter info is preserved on merge
  if (item.chapterInfo && item.chapterInfo.chapterSlug) {
    item.chapter = parseChapterNum(item.chapterInfo.chapterSlug) || item.chapter;
  }

  store.addToHistory(item);
};

export const getKomikHistory = store.getHistory;
export const updateKomikProgress = store.updateProgress;
export const clearKomikHistory = store.clearHistory;
export { formatTime };