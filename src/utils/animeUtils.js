/**
 * Normalize an anime title for de-duplication across providers.
 * Same anime from different providers may have slightly different titles
 * (whitespace, casing). This produces a stable comparison key.
 */
export const normalizeKey = (item) => {
  const raw = (item?.title || item?.name || '').toString().toLowerCase();
  return raw.replace(/\s+/g, ' ').trim();
};

/**
 * Merge anime lists from two providers. Items present in both providers are
 * marked with `providers: ['otakudesu', 'samehadaku']` so the UI can show
 * a multi-provider badge. The first provider wins on field conflicts.
 *
 * @param {Array} primary    items from the primary provider
 * @param {Array} secondary  items from the secondary provider
 * @param {Object} options
 * @param {string} options.primaryName    e.g. 'otakudesu'
 * @param {string} options.secondaryName  e.g. 'samehadaku'
 * @param {string} [options.status]       optional status to attach (e.g. 'Ongoing')
 * @returns {Array} merged list with `providers` and `provider` fields
 */
export const mergeProviderLists = (
  primary = [],
  secondary = [],
  { primaryName = 'otakudesu', secondaryName = 'samehadaku', status } = {},
) => {
  const map = new Map();

  for (const a of primary) {
    const key = normalizeKey(a);
    if (!key) continue;
    map.set(key, {
      ...a,
      providers: [primaryName],
      provider: primaryName,
      ...(status ? { status } : {}),
    });
  }

  for (const b of secondary) {
    const key = normalizeKey(b);
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      const providers = Array.from(new Set([...(existing.providers || []), secondaryName]));
      map.set(key, { ...existing, providers });
    } else {
      map.set(key, {
        ...b,
        providers: [secondaryName],
        provider: secondaryName,
        ...(status ? { status } : {}),
      });
    }
  }

  return Array.from(map.values());
};

/**
 * Backward-compatible alias for code that imports `mergeAnimeLists`
 * with the default Otakudesu/Samehadaku pairing.
 */
export const mergeAnimeLists = (otakList, sameList, status) =>
  mergeProviderLists(otakList, sameList, {
    primaryName: 'otakudesu',
    secondaryName: 'samehadaku',
    status,
  });
