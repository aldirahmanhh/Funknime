# AGENTS.md

Operational notes for OpenCode sessions on this repo.

## Stack & layout (the parts that bite)

- React 19 + Vite 8 SPA (no SSR, no TypeScript). All `.jsx`.
- React Router v7 routes live in `src/App.jsx`. Every route except `Home` is
  `React.lazy()` — Home is the LCP route on purpose. `@videojs/react` (the
  biggest dep) only enters the graph via the lazy `Watch` route and its own
  `videojs` manual chunk — keep it that way.
- Setting `VITE_MAINTENANCE_MODE=true` short-circuits the whole app into
  `MaintenancePage` before any route renders. `.env*` files are gitignored.
- Vite 8 ships **Rolldown**, not Rollup. Two consequences:
  - `manualChunks` MUST be the function form. The object form silently fails
    with "Invalid output options" then crashes at runtime.
  - Don't set `build.minify: 'esbuild'` — esbuild is no longer bundled with
    Vite 8. Default minifier is fine, just leave `minify` unset.
- The dev server proxies `/api/*` to production (`https://www.mrfunk.my.id`),
  so local dev exercises the real serverless functions — don't mock `/api`.
- PWA: `public/sw.js` is hand-written. **Bump `CACHE_VERSION` on every
  release** that ships changes to cached assets, otherwise users keep stale
  JS/CSS until they manually clear cache. `/api/*`, `/sitemap.xml`, and
  `/robots.txt` are explicitly bypassed in the SW — keep it that way.
- Hosting: Vercel. Routing rules + security headers (CSP, X-Frame-Options,
  HSTS, Permissions-Policy) all live in `vercel.json`. SPA fallback rewrites
  every non-asset path to `/index.html`; `public/_redirects` is vestigial —
  edit `vercel.json`, not `_redirects`. Note the CSP `connect-src` allowlist
  (`self`, sankavollerei.web.id, api.trakteer.id): a new external API host
  must also be added there or requests fail on prod only.

## Repo entrypoints

- `DESIGN.md` — the design system contract. Every visual decision (colors,
  type, spacing, components, motion) must trace to tokens defined there.
  Read it before any UI work; add missing tokens to DESIGN.md first, then use
  them. The current identity: one dark cinema-lounge theme, achromatic
  surfaces, a single functional violet accent (`--accent #8B5CF6`), pill
  controls, heavy tinted shadows. Decorative gradients/glows and emoji-as-icon
  are banned — use `src/components/Icon.jsx` (inline SVG set, no dependency).
- `src/main.jsx` — bootstraps, imports CSS in load order. Order matters:
  `index.css` (tokens + reset + primitives) →
  `donghua-pages.css` → `anti-ads.css` → `mobile-optimizations.css` →
  `polish.css`. **`polish.css` must stay last** — it intentionally overrides.
  (The old `themes.css` / `neobrutalism-redesign.css` were removed in the
  2026 redesign; don't reintroduce them.)
- `src/services/api.js` — single HTTP layer for all data providers. Two-layer
  cache (memory + localStorage under `fnk_cache_` keys) + global rate limiter
  (40 req/min). Requests run in parallel; the limiter only delays when
  approaching the cap. Pass `{ priority: true }` for episode/server/chapter
  endpoints and `{ signal }` to support cancellation.
- `src/contexts/ThemeContext.jsx` — compatibility shim. MrFunk ships ONE
  signature dark theme (DESIGN.md §0); `setTheme` is a deliberate no-op and
  `data-theme="dark"` is fixed on `<html>`. Don't build theme-switcher UI on
  top of this without revisiting DESIGN.md first.
- `src/utils/watchHistory.js` — localStorage progress store. Migrates an old
  `funknime_watch_history` key on read. Capped at `MAX_ITEMS = 100`.
- `src/utils/animeUtils.js` — `normalizeKey` + `mergeProviderLists` (exported
  alias `mergeAnimeLists`, which components import). Use these when merging
  Otakudesu + Samehadaku results. Do not re-implement inline (it used to be
  duplicated 5 times).
- `api/trakteer.js` — Vercel serverless proxy for the Trakteer public API.
  Reads `TRAKTEER_API_KEY` from env. CORS is restricted to mrfunk.my.id
  (with localhost added in non-prod). Keep input validation in place.
- `api/img-proxy.js` — serverless image proxy (`/api/img-proxy?url=…`) that
  fetches hotlink-protected comic images without a Referer header (response
  headers override `<img referrerPolicy>`). Its host allowlist must be updated
  when a comic provider changes image CDNs.

## External services

- Anime/donghua data: `https://www.sankavollerei.web.id/anime`; komik lives
  under `/comic/bacakomik` on the same domain (`COMIC_BASE_URL` in api.js).
  Free tier ~50 req/min — the in-app limiter targets 40 to stay clear of 429.
- Trakteer: `https://api.trakteer.id/v1/public`. Never call directly from
  the client — go through `/api/trakteer`. The API key must stay server-side.
- Live site: `https://www.mrfunk.my.id` (canonical www host; non-www 307s).

## Commands

- `npm run dev` — Vite dev server.
- `npm run build` — production build. **Run before claiming done.**
- `npm run lint` — ESLint flat config (`eslint.config.js`) with scoped
  environments: `api/**` gets Node globals, `public/sw.js` gets
  service-worker globals, `src/**` gets browser globals. Custom rule:
  `no-unused-vars` allows names matching `^[A-Z_]` and `_`-prefixed args
  (so React component imports and constants don't trip it).
- `npm run preview` — preview the prod build locally.
- No test runner is configured. If you add one, prefer Vitest.

There is no Prettier or TypeScript. Don't introduce them without asking.

## Conventions worth knowing

- API responses use `snake_case` (`poster_url`, `episode_count`,
  `ongoing_donghua`). Components defensively read both cases — keep that
  defensive pattern when adding new fields.
- Donghua endpoints return episodes **newest-first**. `DonghuaDetail`
  treats `episodes[length - 1]` as Episode 1 and `episodes[0]` as the
  latest. The labels were swapped once — don't swap them back.
- Console logging in production is forbidden. Use the `devLog/devWarn`
  helpers (gated by `import.meta.env.DEV`) that exist in `api.js` and
  `Watch.jsx`. Add equivalent helpers when adding noisy modules.
- Inline styles are tolerated only for one-off positioning. Anything reusable
  belongs in `polish.css` or a component-scoped `.css` file. Several past
  PRs migrated inline blocks → classes; don't undo that.
- Pagination on donghua ongoing/completed list pages uses a
  `PAGE_SIZE_HINT = 24` heuristic for `hasMore` because the API does not
  return total pages. The Next button is disabled when items < hint or when
  loading.

## A11y baseline (don't regress)

- `<ErrorBoundary>` wraps `<Routes>` in `App.jsx` — keep it.
- `<Suspense fallback={<RouteFallback />}>` is the route-level loading state.
- `:focus-visible` ring is global (in `polish.css`). Do not remove the global
  rule; instead override per-element if needed.
- AZ letter buttons use `aria-pressed`. Theme selector uses
  `aria-expanded` + `aria-pressed`. Iframe in `EmbedPlayer` uses
  `referrerPolicy="no-referrer"` — keep that for privacy.

## Git / deploy

- Branch: `main` is the deploy branch. Vercel watches it.
- Commits: use prefix-style messages (`feat:`, `fix:`, `chore:`, `style:`,
  `perf:`), optionally scoped like `fix(api):`. Multi-line bodies via
  `git commit -F` are common in this repo — PowerShell mangles `-m ""`
  style multi-paragraph messages.
- Sitemap: `public/sitemap.xml` is hand-edited with `<lastmod>`. Update
  `lastmod` when you ship route changes that affect SEO surface.

## Known footguns

- `package.json` historically listed `axios` and `node-fetch` even though
  neither was used. They were removed; do not re-add unless actually needed.
- The repo previously had two parallel theme systems competing for
  `data-theme`. Since the 2026 redesign there is exactly one signature dark
  theme; `ThemeSelector` was deleted. Don't reintroduce theme-switcher UI
  without revisiting DESIGN.md.
- `mobile-optimizations.css` is a small legacy file (touch targets, safe
  areas). Prefer adding new rules to `polish.css` or component-scoped CSS to
  keep diffs small and reviewable.
- `.gitignore` deliberately ignores in-repo design docs (`BUG_*.md`,
  `NEOBRUTALISM_REDESIGN.md`, etc.), API response samples
  (`*_response.json`), and `CLAUDE.md`. Don't commit those even if you think
  they're useful — keep them local.
- Search Console "Couldn't fetch sitemap" is usually a property-mismatch
  problem in GSC, not a server problem. The file is served correctly with
  `application/xml`. If revisiting this, prefer a Domain property over a
  URL-prefix property.
