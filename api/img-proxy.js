/**
 * img-proxy.js — Vercel serverless image proxy for komiku.org assets.
 *
 * komiku.org uses hotlink protection that blocks requests with a Referer header.
 * The global Referrer-Policy in vercel.json sends the origin as Referer even
 * when <img referrerPolicy="no-referrer"> is set, because HTTP response headers
 * override the HTML attribute. This proxy fetches the image server-side without
 * any Referer, then streams it back to the browser.
 *
 * Usage: GET /api/img-proxy?url=<encoded-komiku-image-url>
 */

import { readFileSync } from 'fs';

// Allowlist: proxy images from known domains
// Expanded to handle potential API changes (new image CDNs, mirrors, etc.)
const ALLOWED_HOSTS = new Set([
  // komiku.org (original)
  'img.komiku.org',
  'thumbnail.komiku.org',
  'komiku.org',
  // Potential alternatives (CDNs, mirrors, or new API hosts)
  'cdn.komiku.org',
  'images.komiku.org',
  'static.komiku.org',
  'i.komiku.org',
  // Live production host (confirmed via user report)
  's2.komiku.org',
  // Other common manga/comic hosts
  'mangakakalot.com',
  'images.mangakakalot.com',
  'img.manganelo.com',
  'chap.manganelo.com',
  // Generic CDN patterns (in case API switched providers)
  'cdn-img.komiku.org',
  'imgcdn.komiku.org',
]);

// Max response size to stream (10 MB safety cap)
const MAX_BYTES = 10 * 1024 * 1024;

const logError = (...args) => console.error('[img-proxy]', ...args);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawUrl = req.query.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid url parameter' });
  }

  // Only allow https
  if (parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only https URLs allowed' });
  }

  // Only allow known komiku hosts (exact or suffix match for subdomains)
  const isAllowed = 
    ALLOWED_HOSTS.has(parsed.hostname) ||
    Array.from(ALLOWED_HOSTS).some(h => parsed.hostname.endsWith(`.${h}`));
  
  if (!isAllowed) {
    logError('Blocked hostname:', parsed.hostname);
    return res.status(403).json({ error: 'Host not allowed' });
  }

  // Fetch without Referer — this is the key: no Referer header bypasses hotlink protection
  let upstream;
  try {
    upstream = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        // Explicitly no Referer header
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return res.status(502).json({ error: 'Upstream fetch failed' });
  }

  if (!upstream.ok) {
    return res.status(upstream.status).json({ error: 'Upstream returned error' });
  }

  const contentType = upstream.headers.get('content-type') || 'image/jpeg';

  // Safety: only pass through image content types
  if (!contentType.startsWith('image/')) {
    return res.status(502).json({ error: 'Upstream returned non-image content' });
  }

  const contentLength = upstream.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BYTES) {
    return res.status(413).json({ error: 'Image too large' });
  }

  // Read body with size cap
  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) {
    return res.status(413).json({ error: 'Image too large' });
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(200).send(Buffer.from(buffer));
}
