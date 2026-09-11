import { createHistoryStore, formatTime } from './historyFactory';

const store = createHistoryStore('mrfunk_donghua_history', 100, { idField: 'episodeId' });

export const getDonghuaHistory = store.getHistory;
export const addDonghuaHistory = store.addToHistory;
export const updateDonghuaProgress = store.updateProgress;
export const getDonghuaProgress = store.getProgress;
export const clearDonghuaHistory = store.clearHistory;
export { formatTime };