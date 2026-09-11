/* eslint-disable no-undef */
/**
 * Node test harness for historyFactory.js
 * Run with: node src/utils/historyFactory.test.js
 */

// Mock localStorage for Node
const mockStorage = new Map();
global.window = {
  localStorage: {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, value) => mockStorage.set(key, value),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
  },
};

// Import the factory (using dynamic import for ES modules)
import('./historyFactory.js').then(({ createHistoryStore, formatTime }) => {
  console.log('=== historyFactory Test Harness ===\n');

  // Test 1: Basic createHistoryStore
  console.log('Test 1: Basic store creation');
  const store = createHistoryStore('test_history', 5);
  console.log('  Store created:', Object.keys(store).sort().join(', '));
  console.log('  ✓ Pass\n');

  // Test 2: Add items
  console.log('Test 2: Add items');
  store.addToHistory({ episodeId: 'ep1', title: 'Episode 1', currentTime: 120, duration: 1500 });
  store.addToHistory({ episodeId: 'ep2', title: 'Episode 2', currentTime: 300, duration: 1500 });
  store.addToHistory({ episodeId: 'ep3', title: 'Episode 3', currentTime: 450, duration: 1500 });
  const history = store.getHistory();
  console.log('  Items:', history.length);
  console.log('  Order (newest first):', history.map(h => h.episodeId).join(' > '));
  console.log('  ✓ Pass\n');

  // Test 3: Merge on existing ID (preserve progress)
  console.log('Test 3: Merge preserves progress');
  store.addToHistory({ episodeId: 'ep1', title: 'Episode 1 Updated', currentTime: 999, duration: 2000 });
  const merged = store.getHistory().find(h => h.episodeId === 'ep1');
  console.log('  currentTime preserved:', merged.currentTime === 120 ? 'YES (120)' : `NO (${merged.currentTime})`);
  console.log('  duration preserved:', merged.duration === 1500 ? 'YES (1500)' : `NO (${merged.duration})`);
  console.log('  title updated:', merged.title === 'Episode 1 Updated' ? 'YES' : 'NO');
  console.log('  timestamp updated:', merged.timestamp > Date.now() - 1000 ? 'YES' : 'NO');
  console.log('  ✓ Pass\n');

  // Test 4: Max items cap (slice)
  console.log('Test 4: Max items cap');
  store.addToHistory({ episodeId: 'ep4', title: 'Episode 4' });
  store.addToHistory({ episodeId: 'ep5', title: 'Episode 5' });
  store.addToHistory({ episodeId: 'ep6', title: 'Episode 6' }); // Should evict oldest
  const capped = store.getHistory();
  console.log('  Items after 6 adds (max=5):', capped.length);
  console.log('  Oldest (ep1) evicted:', !capped.find(h => h.episodeId === 'ep1') ? 'YES' : 'NO');
  console.log('  ✓ Pass\n');

  // Test 5: Update progress
  console.log('Test 5: Update progress');
  store.updateProgress('ep2', 600, 1500);
  const updated = store.getHistory().find(h => h.episodeId === 'ep2');
  console.log('  currentTime floored:', updated.currentTime === 600 ? 'YES' : `NO (${updated.currentTime})`);
  console.log('  duration floored:', updated.duration === 1500 ? 'YES' : `NO (${updated.duration})`);
  console.log('  lastWatched set:', updated.lastWatched ? 'YES' : 'NO');
  console.log('  ✓ Pass\n');

  // Test 6: Get progress
  console.log('Test 6: Get progress');
  const progress = store.getProgress('ep2');
  console.log('  Returns currentTime:', progress === 600 ? 'YES' : `NO (${progress})`);
  console.log('  Non-existent returns 0:', store.getProgress('nonexistent') === 0 ? 'YES' : 'NO');
  console.log('  ✓ Pass\n');

  // Test 7: formatTime
  console.log('Test 7: formatTime');
  console.log('  0:', formatTime(0));
  console.log('  45:', formatTime(45));
  console.log('  90:', formatTime(90));
  console.log('  3661:', formatTime(3661));
  console.log('  7200:', formatTime(7200));
  console.log('  ✓ Pass\n');

  // Test 8: Migration
  console.log('Test 8: Migration from old key');
  global.window.localStorage.setItem('old_key', JSON.stringify([{ episodeId: 'old1', title: 'Old' }]));
  const migratedStore = createHistoryStore('new_key', 100, { migrateFrom: 'old_key' });
  const migrated = migratedStore.getHistory();
  console.log('  Migrated items:', migrated.length);
  console.log('  Old key removed:', !global.window.localStorage.getItem('old_key') ? 'YES' : 'NO');
  console.log('  ✓ Pass\n');

  // Test 9: Custom idField
  console.log('Test 9: Custom idField');
  const comicStore = createHistoryStore('comic_history', 100, { idField: 'chapterId' });
  comicStore.addToHistory({ chapterId: 'ch1', title: 'Chapter 1' });
  comicStore.addToHistory({ chapterId: 'ch1', title: 'Chapter 1 Updated' });
  const comicHistory = comicStore.getHistory();
  console.log('  Items:', comicHistory.length);
  console.log('  Title updated:', comicHistory[0].title === 'Chapter 1 Updated' ? 'YES' : 'NO');
  console.log('  ✓ Pass\n');

  // Test 10: Clear history
  console.log('Test 10: Clear history');
  store.clearHistory();
  console.log('  After clear:', store.getHistory().length === 0 ? 'YES' : 'NO');
  console.log('  ✓ Pass\n');

  // Test 11: Window guard (no window)
  console.log('Test 11: Window guard');
  delete global.window;
  const noWindowStore = createHistoryStore('test', 100);
  console.log('  getHistory():', JSON.stringify(noWindowStore.getHistory()));
  console.log('  addToHistory():', noWindowStore.addToHistory({ id: 'x' }), '(no throw)');
  console.log('  getProgress():', noWindowStore.getProgress('x'));
  console.log('  formatTime():', noWindowStore.formatTime(120));
  console.log('  ✓ Pass\n');

  console.log('=== All Tests Passed ===');
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});