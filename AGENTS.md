# AGENTS.md

Operational notes for OpenCode sessions on this repo. Keep CLAUDE.md as the
short-form companion; this file is the canonical brief.

## Stack & layout (the parts that bite)

- React 19 + Vite 8 SPA (no SSR, no TypeScript). All `.jsx`.
- React Router v7 routes live in `src/App.jsx`. Every route except `Home` is
  `React.lazy()` — Home is the LCP route on purpose.
- Vite 8 ships **Rolldown**, not Rollup. Two consequences:
  - `manualChunks` MUST be the function form. The object form silently fails
    with "Invalid output options" then crashes at runtime.
  - Don't set `build.minify: 'esbuild'` — esbuild is no longer bundled with
    Vite 8. Default minifier is fine, just leave `minify` unset.
- PWA: `public/sw.js` is hand-written. **Bump `CACHE_VERSION` on every
  release** that ships changes to cached assets, otherwise users keep stale
  JS/CSS until they manually clear cache. `/api/*`, `/sitemap.xml`, and
  `/robots.txt` are explicitly bypassed in the SW — keep it that way.
- Hosting: Vercel. Routing rules + security headers (CSP, X-Frame-Options,
  HSTS, Permissions-Policy) all live in `vercel.json`. SPA fallback rewrites
  every non-asset path to `/index.html`.

## Repo entrypoints

- `src/main.jsx` — bootstraps, imports CSS in load order. Order matters:
  `index.css` (tokens) → `themes.css` → `neobrutalism-redesign.css` →
  `donghua-pages.css` → `anti-ads.css` → `mobile-optimizations.css` →
  `polish.css`. **`polish.css` must stay last** — it intentionally overrides.
- `src/services/api.js` — single HTTP layer. Has its own cache + global rate
  limiter (40 req/min) + serial queue with 100ms min delay between
  non-priority requests. Pass `{ priority: true }` for episode/server
  endpoints to skip the queue. Pass `{ signal }` to support cancellation.
- `src/contexts/ThemeContext.jsx` — single source of truth for theme. Stores
  `funknime-theme` in localStorage; valid values are `dark | minimal |
  neobrutalism`. The DOM attribute is `data-theme` on `<html>`. There used to
  be a competing `theme` key — don't reintroduce it.
- `src/utils/watchHistory.js` — localStorage progress store. Migrates an old
  `funknime_watch_history` key on read. Capped at `MAX_ITEMS = 100`.
- `src/utils/animeUtils.js` — `normalizeKey` + `mergeAnimeLists`. Use this
  when merging Otakudesu + Samehadaku results. Do not re-implement inline
  (it used to be duplicated 5 times).
- `api/trakteer.js` — Vercel serverless proxy for the Trakteer public API.
  Reads `TRAKTEER_API_KEY` from env. CORS is restricted to mrfunk.my.id
  (with localhost added in non-prod). Keep input validation in place.

## External services

- Anime data: `https://www.sankavollerei.com/anime` (free, ~50 req/min). The
  in-app limiter targets 40 to stay clear of 429.
- Trakteer: `https://api.trakteer.id/v1/public`. Never call directly from
  the client — go through `/api/trakteer`. The API key must stay server-side.
- Live site: `https://www.mrfunk.my.id` (canonical www host; non-www 307s).

## Commands

- `npm run dev` — Vite dev server.
- `npm run build` — production build. **Run before claiming done.**
- `npm run lint` — ESLint flat config (`eslint.config.js`). Custom rule:
  `no-unused-vars` allows names matching `^[A-Z_]` (so React component
  imports and constants don't trip it).
- `npm run preview` — preview the prod build locally.
- No test runner is configured. If you add one, prefer Vitest.

There is no Prettier or TypeScript. Don't introduce them without asking.

## Conventions worth knowing

- API responses use `snake_case` (`poster_url`, `episode_count`,
  `ongoing_donghua`, `completed_donghua`). Components defensively read both
  cases — keep that defensive pattern when adding new fields.
- Donghua endpoints return episodes **newest-first**. `DonghuaDetail`
  treats `episodes[length - 1]` as Episode 1 and `episodes[0]` as the
  latest. The labels were swapped once — don't swap them back.
- Console logging in production is forbidden. Use the `devLog/devWarn`
  helpers (gated by `import.meta.env.DEV`) that exist in `api.js` and
  `Watch.jsx`. Add equivalent helpers when adding noisy modules.
- Inline styles are tolerated only for one-off positioning. Anything reusable
  belongs in `polish.css` or a component-scoped `.css` file. Several past
  PRs migrated inline blocks → classes; don't undo that.
- Pagination on Donghua list pages uses a `PAGE_SIZE_HINT = 24` heuristic
  for `hasMore` because the API does not return total pages. The Next button
  is disabled when items < hint or when loading.

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
  `perf:`). Multi-line bodies via `git commit -F` are common in this repo —
  PowerShell mangles `-m ""` style multi-paragraph messages.
- Sitemap: `public/sitemap.xml` is hand-edited with `<lastmod>`. Update
  `lastmod` when you ship route changes that affect SEO surface.

## Known footguns

- `package.json` historically listed `axios` and `node-fetch` even though
  neither was used. They were removed; do not re-add unless actually needed.
- The repo previously had two parallel theme systems competing for
  `data-theme`. There's now one. If you add a theme UI, route through
  `useTheme()`.
- `mobile-optimizations.css` and `neobrutalism-redesign.css` are large
  legacy files. Prefer adding new rules to `polish.css` to keep diffs small
  and reviewable.
- `.gitignore` deliberately ignores in-repo design docs (`BUG_*.md`,
  `NEOBRUTALISM_REDESIGN.md`, etc.) and API response samples (`*_response.json`).
  Don't commit those even if you think they're useful — keep them local.
- Search Console "Couldn't fetch sitemap" is usually a property-mismatch
  problem in GSC, not a server problem. The file is served correctly with
  `application/xml`. If revisiting this, prefer a Domain property over a
  URL-prefix property.
