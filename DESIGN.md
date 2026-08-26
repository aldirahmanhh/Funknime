# MrFunk Design System

Single source of truth for every visual decision. No component is written or
restyled without referencing tokens defined here. If a token is missing, add it
here FIRST, then use it. No raw hex, no magic px, no orphan patterns.

## 0. Research Log

- Embedded refs: shortlisted `spotify.md` (streaming grammar) + `sentry.md`
  (dark data-dense) → picked **Layer A `redesign-skill.md` + Layer B
  `spotify.md`** — task is an existing-UI redesign toward a professional
  streaming look; spotify.md is the curated library's only true streaming
  system and its grammar (near-black achromatic base, art-as-only-color,
  pill geometry, heavy tinted shadows) maps directly onto poster-driven
  anime/komik browsing.
- Lazyweb lane: skipped — this is a redesign of a live product; the existing
  site is the reference surface, audited via code inventory + post-build
  `/visual-qa`.
- Imagen lane: skipped — poster art supplied by providers IS the imagery;
  nothing to invent.
- User decisions (2026-08-26): **one signature dark theme** (dark/minimal/
  neobrutalism/cyberpunk/ocean/sunset retired); **refined desaturated violet**
  accent, functional-only; donations (Trakteer) surfaces preserved.

## 1. Atmosphere & Identity

A dark cinema lounge for people who came to watch, not to admire chrome.
Near-black charcoal surfaces recede so poster art is the ONLY saturated color
on screen — the interface itself is achromatic depth built from tonal shifts,
hairlines where necessary, and heavy tinted shadows that make elevated things
float in darkness.

**The signature: one violet spotlight.** A single, restrained royal violet —
desaturated until it reads expensive instead of electric — appears only where
the interface *acts*: active navigation, play affordances, focus rings,
progress, live indicators. Like a theater hallway lit by one violet lamp, the
eye always knows where "now" is. Controls are pill/circle geometry — tactile,
touch-first, never squared-off. Motion is minimal and weighty: things lift
slightly under the cursor like objects, they do not wiggle, glow, or bounce.

It must feel like Netflix/Crunchyroll-class product engineering with an
Indonesian voice — never like a template, never like a gradient landing page.

## 2. Color

### Palette

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Page background | `--bg` | `#0A0A10` | Body, deepest layer |
| Surface 1 | `--surface-1` | `#12121A` | Cards, rails, panels |
| Surface 2 | `--surface-2` | `#181822` | Inputs, chips, secondary buttons |
| Surface 3 | `--surface-3` | `#1F1F2B` | Hover state, elevated rows |
| Text primary | `--text-primary` | `#F2F2F7` | Headings, body |
| Text secondary | `--text-secondary` | `#A2A2B5` | Metadata, inactive nav |
| Text muted | `--text-muted` | `#7E7E9C` | Hints, disabled (≥4.5:1 on bg & surface-1) |
| Border subtle | `--border-subtle` | `#1F1F2B` | Hairline dividers on surfaces |
| Border default | `--border-default` | `#2C2C3A` | Input outlines, separators |
| Accent | `--accent` | `#8B5CF6` | Active states, links, play, progress, focus |
| Accent strong | `--accent-strong` | `#7C3AED` | Accent hover/pressed step |
| Accent soft | `--accent-soft` | `rgba(139, 92, 246, 0.14)` | Selected fills, soft badges |
| Accent text | `--accent-text` | `#D4C5F8` | Text/icons ON accent-soft fills (≥4.5:1) |
| CTA surface | `--cta-bg` | `#FFFFFF` | Primary button fill |
| On CTA | `--cta-fg` | `#0A0A10` | Primary button label |
| Success | `--status-success` | `#30C48D` | Confirmations only |
| Warning | `--status-warning` | `#E8A33D` | Cautions only |
| Error | `--status-error` | `#E5484D` | Errors, destructive |

### Rules

- ONE accent (`--accent` family). Cyan/amber/magenta accents are deleted.
- Accent is functional only: interactive states, focus, progress, "live".
  Never decorative backgrounds, never large fills, never text color for
  non-interactive elements.
- Primary CTA = white pill + near-black label (max contrast, streaming
  convention). Violet marks state, white sells the click.
- Semantic colors appear only in their semantic context.
- Gradients allowed ONLY as functional image scrims (bottom-of-poster black
  fade for text legibility). Zero decorative gradients. Zero glows.
- The legacy tokens `--color-glow`, `--color-glow-cyan`,
  `--color-primary-light`, `--color-secondary`, `--color-accent` are removed.

## 3. Typography

### Font stack (both already loaded in index.html — no new requests)

- Display/headings: `'Space Grotesk', system-ui, sans-serif`
- UI/body: `'Outfit', system-ui, sans-serif`

### Scale

| Level | Size | Weight | Line height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | `clamp(1.9rem, 4.5vw, 3rem)` | 700 | 1.1 | -0.02em | Hero title only |
| H1 | 1.75rem | 700 | 1.2 | -0.015em | Page titles |
| H2 | 1.35rem | 700 | 1.25 | -0.01em | Section headers |
| H3 | 1.05rem | 600 | 1.35 | 0 | Sub-blocks, detail sections |
| Card title | 0.9375rem | 500 | 1.35 | -0.005em | Poster card titles (dense grids) |
| Body lg | 1.0625rem | 400 | 1.65 | 0 | Synopses, leads (max 65ch) |
| Body | 1rem | 400 | 1.55 | 0 | Default (raised from 15.2px) |
| Sm | 0.875rem | 400–500 | 1.45 | 0 | Secondary info, nav |
| Caption | 0.75rem | 500 | 1.4 | 0.01em | Metadata, badges |
| Overline | 0.6875rem | 600 | 1.3 | 0.08em uppercase | Eyebrow labels |

### Rules

- Sentence case everywhere (Indonesian natural casing). No ALL-CAPS headers;
  uppercase reserved for overline eyebrows.
- `font-variant-numeric: tabular-nums` on episode counts, ratings, durations,
  amounts.
- Body text never below 1rem; captions floor 0.75rem.
- Buttons: 0.9375rem, weight 600, normal case (no uppercase shouting).

## 4. Spacing & Layout

### Base unit 4px (existing `--space-*` scale retained: 4/8/12/16/20/24/32/40/48/64)

### Grid

- Container: max-width 1280px, gutters `clamp(16px, 4vw, 24px)`.
- Breakpoints: 480 / 768 / 1024 / 1280.
- Poster grid: `repeat(auto-fill, minmax(min(158px, 44vw), 1fr))`, gap
  `--space-4` column / `--space-6` row.
- Rails: horizontal scroll, `scroll-snap-type: x proximity`, hidden scrollbar,
  edge fade mask on desktop.
- Vertical rhythm between homepage sections: `--space-12` desktop,
  `--space-8` mobile.

### Rules

- Spacing intent uses tokens; browser mechanics (`clamp()`, `minmax(min())`,
  viewport units) stay raw.
- Optically adjust: icon-to-label gaps 6px not 8px when it looks tighter;
  section bottom padding +8 vs top when sections share a background.

## 5. Components

Primitives below are built first (tokens + base layer) and visually verified
before page composition. States listed are REQUIRED unless noted.

### Button
- **Structure**: `<button>` / `<a>` with `.btn .btn--{variant} .btn--{size}`
- **Variants**: `primary` (white pill, near-black label), `secondary`
  (surface-2 pill, text-primary), `ghost` (transparent, text-secondary →
  text-primary on hover), `donate` (secondary shape + heart glyph, accent
  border on hover — Trakteer identity, never red/green)
- **Sizes**: md 40px h / sm 32px / lg 48px; radius `999px`; padding
  0 `--space-5`
- **States**: default, hover (bg shift + `translateY(-1px)`), active
  (`translateY(0) scale(.98)`), focus-visible (global ring), disabled
  (opacity .45 + no pointer), loading (inline spinner swaps label)
- **Accessibility**: real `<button>`/`<a>`; min hit area 40px; label never
  icon-only without `aria-label`

### IconButton
- Circle 40px (sm 32px), surface-2 bg, svg 20px centered
- States mirror Button; used for search, close, carousel dots nav

### Chip / Badge
- Pill radius `999px`; caption size; padding 2px 10px
- Variants: `neutral` (surface-2/text-secondary), `accent-soft`
  (accent-soft bg, light violet text — e.g. ongoing/live), `outline`
  (border-default, transparent)
- States: static (badges are NOT interactive; if clickable use Button sm)

### PosterCard
- **Structure**: `article.poster-card > a > (.poster-frame > img + scrim +
  play-overlay + badges) , .poster-meta(title, meta row)`
- **Variants**: anime / donghua / komik (identical anatomy, meta differs);
  sizes via grid track
- **Spacing**: frame radius 10px; meta padding-top `--space-3`; grid gap
  `--space-4/--space-6`
- **States**: default; hover (frame lifts `translateY(-3px)`, shadow-hover,
  img scales 1.05 inside overflow-hidden frame, play-overlay fades in);
  focus-visible ring on frame; loading handled by SkeletonPoster
- **Images**: aspect-ratio 2/3 locked, explicit dimensions, lazy below fold,
  provider-hosted posters served as-is (proxy unchanged)
- **Accessibility**: whole card link, `aria-label` = title; badge text real
  text; alt text on poster = "{Title} poster"
- **Motion**: 180ms ease-out transform/opacity only

### SectionRail
- SectionHeader + horizontal scroll row of PosterCards + edge controls
  (desktop only, IconButtons)
- Scroll owner: the rail itself; page scroll untouched
- States: empty → EmptyState inline; loading → SkeletonPoster × 6

### SectionHeader
- `.section-head`: H2 + optional "Lihat semua" ghost link with arrow
- Overline eyebrow optional above H2

### SiteHeader (nav)
- Sticky top, `rgba(10,10,16,.82)` + `backdrop-filter blur(14px)`, hairline
  bottom border on scroll
- Brand left; center nav (Anime/Donghua/Komik/Jadwal dropdowns); right:
  search IconButton, donate Button(sm, variant donate)
- Active route: text-primary + 2px accent underline offset; inactive:
  text-secondary
- Mobile: brand + search + hamburger → full-screen sheet (Surface bg,
  staggered link entry 30ms/item, respects reduced motion)
- States: default/scrolled/menu-open; a11y: `<nav aria-label>`,
  `aria-expanded` on disclosures, Escape closes

### SiteFooter
- Surface-1 band (tonal separation, no top border), container-aligned
- Columns: brand + tagline; Jelajahi; Bantuan; DonateCard compact
- Bottom bar: copyright + disclaimer + legal links (DMCA/Privacy)
- Donate CTA preserved: teer.id/anrizz, `target="_blank" rel="noopener"`

### DonateCard (Trakteer — MUST SURVIVE)
- Surface-2 rounded panel, heart glyph (SVG, accent), heading "Dukung
  MrFunk", one-line body, Button(primary) → teer.id/anrizz
- Home variants: Top Donatur list (rank numerals 1–5 tabular-nums, name,
  amount, message clamp-2) + support CTA; popup modal retired in favor of an
  inline support band (less interruption, still prominent)
- States: loading skeleton, error → hide silently (never block page),
  populated

### Skeleton
- Matches final layout geometry exactly (PosterCard, detail hero, watch)
- Shimmer: opacity pulse 1.4s ease-in-out infinite; respects reduced motion
  (static 0.45 opacity)

### StateViews (EmptyState / ErrorState)
- Centered, icon (SVG 28px, text-muted), title H3, one-line hint Sm,
  optional retry Button(secondary)
- Direct copy ("Koneksi gagal. Coba lagi." — no "Oops!")

### Pagination / LoadMore
- LoadMore: Button(secondary, lg) centered; disabled while loading w/
  spinner; hidden when exhausted
- Numbered pagination: pills; current = accent-soft bg + text-primary;
  `aria-current="page"`

### ProgressBar (watch resume)
- Track: surface-3 hairline 4px; fill: `--accent`; tabular time labels
- Focusable slider semantics where interactive

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 120ms | ease-out | Press feedback, chip toggle |
| Standard | 200ms | cubic-bezier(.22,1,.36,1) | Hover lifts, fades, menus |
| Emphasis | 420ms | cubic-bezier(.22,1,.36,1) | Hero entry, sheet open |

### Rules

- Animate `transform` and `opacity` ONLY.
- Every interactive element: hover + active + focus-visible states.
- Card hover recipe: translateY(-3px) + shadow-hover + inner image scale(1.05)
  + play overlay opacity 0→1. Nothing else moves.
- Scroll reveals: none by default; if added later, IntersectionObserver +
  reduced-motion guard.
- `prefers-reduced-motion: reduce` → transitions ≤1ms, shimmer/pulse off.
- No parallax, no bounce easing, no autoplaying carousels faster than 6s;
  hero carousel pauses on hover/focus and exposes pause control.

### Ambient background layer

A `<canvas>`-based 3D particle field (`AnimatedBackground`) renders a subtle
depth effect behind page content. This is a **sanctioned decorative exception**
to §2's "zero decorative gradients" rule — the particles are the only ambient
motion in the product, kept deliberately low-visibility.

- **Appears:** all routes except `/watch/*` (video player needs a clean
  backdrop) and `/komik/*` (comic reader needs distraction-free surfaces).
- **Z-index slot:** local `0` (below `.app` which carries `z-index: 1`).
  Exempt from the global `--z-*` scale per §7's local-stacking provision.
- **Opacity:** canvas element capped at 0.5 — perceptible against `--bg`
  yet never competes with content surfaces above it.
- **Particle palette:** muted tints of `--accent` (#8B5CF6) and
  `--text-primary` (#F2F2F7) only; no new colors.
- **Reduced motion:** `prefers-reduced-motion: reduce` renders a single
  static frame (drawn once, no rAF loop). The canvas remains visible but
  frozen.
- **Performance budget:** `devicePixelRatio` capped at 2; particle count
  scales with viewport area (≈35 on small mobile, ≈55 tablet, ≈85 desktop,
  hard cap 90); `requestAnimationFrame` loop pauses when `document.hidden`.
- **Pointer events:** `pointer-events: none` — purely decorative, never
  interactive.

## 7. Depth & Surface

**Strategy: tonal-shift primary + heavy tinted shadows for elevation.
Hairline borders only where tonal shift cannot separate (inputs, dividers).**

| Level | Treatment | Use |
|-------|-----------|-----|
| 0 | `--bg` | Page |
| 1 | `--surface-1`, radius 12px | Cards, footer band |
| 2 | `--surface-2`, radius 10px | Inputs, chips, nested panels |
| 3 | `--surface-3` | Hover fills |
| Shadow hover | `0 12px 32px rgba(0,0,0,.45)` | Lifted cards, popovers |
| Shadow overlay | `0 24px 64px rgba(0,0,0,.6)` | Modals, sheets |
| Hairline | `1px solid var(--border-default/subtle)` | Inputs, dividers |

Shadows are pure-black-based and heavy — subtle shadows vanish on near-black.
No glows, no colored shadows, no double borders.

### Z-index scope

The `--z-*` scale (100/200/300/400) governs GLOBAL layers: fixed nav, sheets,
modals, toasts. Values of 0–10 inside a component that creates its own
stacking context (hero backgrounds behind content, badges on posters,
player overlays) are LOCAL stacking and exempt from the scale — keep them
small and relative. Never hardcode a global-layer value outside the scale
(e.g. no more 998s).

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA target: contrast ≥4.5:1 body / ≥3:1 large text & graphics;
  visible `:focus-visible` ring on EVERY interactive element (global rule in
  polish layer stays); full keyboard reachability incl. menus/carousels
  (arrow keys within rails); `prefers-reduced-motion` honored (Section 6).
- Streaming iframe keeps `referrerPolicy="no-referrer"` (privacy invariant).
- Semantic landmarks: header/nav/main/footer; skip-to-content link added.
- All meaningful images have descriptive alt; icon-only buttons have
  `aria-label`.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| Emoji replaced by SVG icon set progressively | Header/Footer/Home first, then remaining pages | Single-icon-component rollout beats scattered one-off edits | This overhaul; leftover tracked after Phase QA |
| Inline styles remain in low-traffic components until touched | EmbedPlayer, InstallBanner, Skeleton dims | Restyling happens page-by-page; functional risk stays low | Each page's redesign pass |
| Legacy theme files ship once more before removal | themes.css, neobrutalism-redesign.css | SW CACHE_VERSION bump + deploy ordering; removal lands with this release's bump | This release |
| Provider posters unoptimized (external CDN) | All grids | Proxy/format conversion out of scope; API rate limits forbid re-fetch pipelines | Revisit if LCP regresses |
