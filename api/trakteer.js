const TRAKTEER_API_KEY = process.env.TRAKTEER_API_KEY;
const BASE = 'https://api.trakteer.id/v1/public';

// Allowed origins (exact match). Add staging/preview here if needed.
const ALLOWED_ORIGINS = new Set([
  'https://www.mrfunk.my.id',
  'https://mrfunk.my.id',
]);

// In dev, also allow localhost
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.add('http://localhost:5173');
  ALLOWED_ORIGINS.add('http://localhost:4173');
}

const ALLOWED_ACTIONS = new Set(['supports', 'quantity']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!TRAKTEER_API_KEY) {
    return res.status(500).json({ error: 'Service misconfigured' });
  }

  // Validate action
  const action = String(req.query.action || 'supports');
  if (!ALLOWED_ACTIONS.has(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  // Validate & clamp limit/page
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 1000);

  try {
    if (action === 'quantity') {
      const email = req.query.email ? String(req.query.email).slice(0, 254) : '';
      if (email && !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      const resp = await fetch(`${BASE}/quantity-given`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'key': TRAKTEER_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: email ? `email=${encodeURIComponent(email)}` : '',
      });
      const data = await resp.json();
      return res.status(200).json(data);
    }

    // action === 'supports'
    const url = `${BASE}/supports?limit=${limit}&page=${page}`;
    const resp = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'key': TRAKTEER_API_KEY,
      },
    });
    const data = await resp.json();
    return res.status(200).json(data);
  } catch {
    // Don't leak internal error details to client
    return res.status(502).json({ error: 'Upstream error' });
  }
}
