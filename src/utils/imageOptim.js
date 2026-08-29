/**
 * imageOptim.js — pure URL helpers for poster image optimization.
 *
 * Provider posters (Otakudesu/Samehadaku/BacaKomik) are often WordPress
 * thumbnails with a `-WxH` size suffix (e.g. `poster-300x168.jpg`). When such
 * a thumbnail is rendered at 2–3× device-pixel-ratio the image looks blurry,
 * so we strip the suffix and request the full-size original instead.
 *
 * All functions are pure — no DOM access, safe to call anywhere.
 */

const THUMB_SUFFIX_RE = /-(\d+x\d+)(\.(?:jpe?g|png|webp))$/i;

/**
 * Upgrade a poster URL to its full-resolution original.
 *
 * - Strips a WordPress thumbnail size suffix (`-300x400`) before the
 *   extension: `poster-300x168.jpg` -> `poster.jpg`.
 * - Handles `.jpg`, `.jpeg`, `.png`, `.webp`.
 * - Already-proxied URLs (`/api/img-proxy?url=…`) are decoded, the inner URL
 *   upgraded, then re-encoded.
 * - `data:` URLs (inline fallbacks) and anything without a matching suffix
 *   are returned unchanged.
 *
 * @param {string|null|undefined} url
 * @returns {string|null|undefined} the upgraded URL, or the input unchanged
 */
export const getHighResPoster = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('data:')) return url;

  // Already-proxied: upgrade the inner URL, then re-encode.
  const proxyIdx = url.indexOf('img-proxy?url=');
  if (proxyIdx !== -1) {
    const prefix = url.slice(0, proxyIdx + 'img-proxy?url='.length);
    const rest = url.slice(proxyIdx + 'img-proxy?url='.length);
    const inner = rest.split('&')[0];
    let decoded;
    try {
      decoded = decodeURIComponent(inner);
    } catch {
      return url;
    }
    const upgraded = getHighResPoster(decoded);
    if (upgraded === decoded) return url;
    return `${prefix}${encodeURIComponent(upgraded)}`;
  }

  // Split off query/hash so the suffix match anchors on the path.
  const qIdx = url.search(/[?#]/);
  const path = qIdx === -1 ? url : url.slice(0, qIdx);
  const tail = qIdx === -1 ? '' : url.slice(qIdx);

  const upgraded = path.replace(THUMB_SUFFIX_RE, '$2');
  if (upgraded === path) return url;
  return upgraded + tail;
};

/**
 * Returns the high-resolution poster URL for use as an `<img>` src.
 * A single high-res URL is sufficient — the browser scales it down for
 * retina displays, so no srcSet is needed.
 *
 * @param {string|null|undefined} url
 * @returns {string|null|undefined} the upgraded URL, or the input unchanged
 */
export const getPosterSrcSet = (url) => getHighResPoster(url);