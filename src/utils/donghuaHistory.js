import { createHistoryStore, formatTime, isJunkHistoryEntry } from './historyFactory';

const store = createHistoryStore('mrfunk_donghua_history', 100, { idField: 'episodeId' });

// Self-healing read: drop entries whose titles look like scraped non-episode
// posts (e.g. shortlink tutorials) that were saved before validation existed.
const getDonghuaHistory = () => {
  const list = store.getHistory();
  if (!list.some(isJunkHistoryEntry)) return list;
  store.purgeEntries(isJunkHistoryEntry);
  return list.filter((it) => !isJunkHistoryEntry(it));
};

export { getDonghuaHistory };
export const addDonghuaHistory = store.addToHistory;
export const updateDonghuaProgress = store.updateProgress;
export const getDonghuaProgress = store.getProgress;
export const clearDonghuaHistory = store.clearHistory;
export { formatTime };
