# Design Handoff — International Raging Grannies

**For Claude Code:** This document and the files in `docs/design/source/` are **design references only** — HTML/React prototypes created in Claude Design demonstrating the intended look, behavior, and information architecture. They are NOT production code to copy directly.

Your task is to recreate these designs in the existing Astro + Tailwind 4 + TypeScript codebase at `src/`. The project already has:
- Astro 6 with Tailwind 4 via `@tailwindcss/vite`
- WPGraphQL client at `src/lib/graphql.ts`
- BaseLayout at `src/layouts/BaseLayout.astro`
- Working song list and song detail pages (functional but need restyling to match this design)
- 1,493 songs in WordPress, queryable via GraphQL
- Brand tokens in `src/styles/global.css` (update these to match the design tokens below — the design tokens supersede what's currently there)

All file paths in this document starting with `source/` refer to `docs/design/source/` — the reference prototypes. All file paths starting with `assets/` refer to `docs/design/source/assets/`.

**Design direction chosen: "The Bulletin" (home-b.jsx).** Do not implement home-a.jsx or home-c.jsx — those are archived alternate directions.

See `docs/design/screenshots/` for reference renders of every page at 1440px width.

**Key difference from current implementation:** The design tokens below include colors and typography not yet in the codebase (e.g., `--ink`, `--mustard`, `--font-serif`, updated type scale). Update `src/styles/global.css` to match these tokens. The design's color palette supersedes the original brand colors where they differ.

## Overview

A public website for the International Raging Grannies — a loose network of ~80 autonomous gaggles of women over fifty who use satirical protest song for political education. The site centers on a searchable songbook (1,493+ songs), a gaggle directory/map, and auto-populated press coverage, with a set of supporting content pages (About, Herstory, Philosophy, FAQ, Contact).

Tone: **competent with a touch of whimsy** — civic/newsprint foundations with small eccentric flourishes. Not cutesy. Not a newsletter.

## About the Design Files

The files in `source/` are **design references created in HTML/React (inline JSX via Babel-standalone)** — prototypes demonstrating intended look, behavior, and information architecture. They are **not production code to copy directly**.

Your task is to **recreate these designs in the target codebase's existing environment** using its established patterns, component library, routing, and data layer. If no environment exists yet, pick an appropriate framework (Next.js + TypeScript is a reasonable default) and implement there.

The source HTML opens as a pan/zoom design canvas with every page laid out as artboards. Open `Raging Grannies Designs.html` locally to see all pages in context.

## Fidelity

**High-fidelity.** Colors, typography, spacing, component structure, and interactions are all final. Recreate pixel-perfectly using the codebase's libraries and patterns. Copywriting is also final unless a teammate has flagged otherwise.

## Information Architecture

Pages (all share the global `SiteHeader` + `SiteFooter`):

| Page | Route | Purpose |
|---|---|---|
| Homepage | `/` | Newsprint-style front page: masthead, featured lyric, on-the-streets dispatches, random songbook picks, Herstory teaser, About strip, Issues grid, Gaggle-map teaser, FAQ teaser |
| Song Library | `/songs` | Browse/search/filter 1,493+ songs. Left rail filters (Issue, Gaggle, Songwriter, Tune), sticky search, comfortable rows |
| Song Detail | `/songs/[id]` | Context-first: tune/songwriter/gaggle/note + YouTube embed, then printable lyrics card. Graceful fallback when no video on file |
| Gaggle Map | `/gaggles` | US+Canada map with 54 pins (US red, CA purple), click through to gaggle subsites |
| Press | `/press` | Auto-populated Google Alerts clippings, grouped by date, filterable by region (state/province) |
| About | `/about` | Who we are, stat bar, dual CTAs (find a gaggle / start a gaggle) |
| Herstory | `/about/herstory` | Origin story (Victoria 1987) + decade-by-decade timeline |
| Philosophy | `/about/philosophy` | Big pullquote + 5 numbered principles |
| FAQ | `/faq` | Sticky photo aside + 10 expanding Q&A items |
| Contact | `/contact` | Contact form + 4 routed inboxes (join / start / press / general) |

The homepage folder also contains two alternate directions (`A · Songbook`, `C · Marquee`) kept for archival reference only — **do not implement these**.

## Design Tokens

All tokens live in `source/styles.css` as CSS custom properties on `:root`. Port these verbatim to your token system.

### Colors

| Token | Hex | Usage |
|---|---|---|
| `--paper` | `#F5F4E6` | Primary surface (cream) |
| `--paper-2` | `#EDECDA` | Secondary surface (slightly darker cream) |
| `--card` | `#FFFFFF` | Card surface |
| `--ink` | `#2A1847` | Deep purple — primary text-on-light, dark surfaces, ink details |
| `--red` | `#E22A2C` | Accent red — CTAs, hover states, accents |
| `--mustard` | `#E6B94A` | Secondary accent on dark surfaces |
| `--purple` | `#57228C` | Alt purple — kickers, tertiary accents |
| `--text` | `#1F1729` | Body copy |
| `--text-soft` | `#4A3A5E` | Secondary body copy |
| `--muted` | `#7A6B88` | Metadata, uppercase labels |
| `--rule` | `#D8D3BE` | Dividers, borders |
| `--on-dark` | `#F5F4E6` | Text/surfaces on ink backgrounds |

Tweak mode can swap accent balance (`balanced` is the default — keep this). Purple-forward and red-forward are experiments not required for ship.

### Typography

- **Display (`--font-display`):** `'Rum Raisin', sans-serif` — 400 weight only. Self-hosted; use the Google Fonts version (`https://fonts.googleapis.com/css2?family=Rum+Raisin&display=swap`). Used for all headlines, page titles, numeric displays.
- **Body (`--font-body`):** System stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`. Weights used: 400, 500, 700, 800.
- **Serif (`--font-serif`):** `'Iowan Old Style', 'Palatino Linotype', Georgia, serif` — used for long-form prose (lyrics, lead stories, FAQ answers).

Type scale: `clamp(56px, 8vw, 104px)` for page titles, 52px H2, 36px H3, 22px dek, 19px body lede, 17–18px body, 12–13px uppercase kickers with 0.12–0.16em letter-spacing.

### Spacing & Radii

- Container max-width: `1240px` with `40px` horizontal padding
- Narrow container: `920px` with `40px` horizontal padding
- Section vertical padding: `72–96px`
- Radii: `--radius: 12px`, `--radius-lg: 16px`, `--radius-pill: 999px`
- Card shadow (photos): `0 14px 36px rgba(0,0,0,.18)`

### Imagery Treatment

Photos are displayed as **polaroids**: white `padding: 10–14px`, 0 bottom padding, `box-shadow`, slight `rotate(-2° to +2°)`, caption strip in uppercase 11px letter-spaced body font. See `.inner-photo`, `.bul-about-photo`, `.bul-herstory-photo`, `.press-hero-photo`.

## Components

Core shared components (see `source/shared.jsx`):

- **`SiteHeader`** — Logo (SVG) + 6 nav items (Home, Songs, Gaggles, About, Press, Contact) + sticky/non-sticky variants. Active link gets red underline.
- **`SiteFooter`** — 3-col: logo+mission, site-nav columns, mailing-list pitch (*not* a newsletter — just announcements), legal strip.
- **`GrannyImg`** — `<img>` wrapper with default `src="assets/logo-cropped.svg"`.
- **Icons** — Inline SVGs: `IconArrow`, `IconArrowL`, `IconSearch`, `IconMap`, `IconDown`, `IconPrint`, `IconPlay`, `IconShuffle`, `IconPlus`, `IconMenu`, `IconClose`, `IconSparkle`.
- **Shared data** — `ISSUES`, `SONGS` (sample of 12), `FEATURED_LYRIC`, `HERSTORY`, `FAQ_TEASER`. Replace with real data from API/CMS.

Page-level components are each in their own file. See **Files** below.

## Interactions & Behavior

- **Song Library** — Left rail is sticky; filter chips are toggleable; search is debounced (client-side in the mock). In production, server-backed search.
- **Song Detail** — Emphasis (`<strong>` = strong beat, `<em>` = inflection) is a styling convention, visible in the legend. Print stylesheet should render the lyrics card only.
- **Gaggle Map** — SVG US+Canada outline with pins positioned by lat/lng. Hover tooltip shows gaggle name + city + est year. Click opens `/gaggles/[id]`. Data shape: `{id, name, country, lat, lng, city, est}`.
- **Press** — Filter chips for region (auto-computed from data). Groups by month. Each row links out to the source article (external). Data shape: `{title, source, date (ISO), region, gaggle, blurb, url}`.
- **FAQ** — `<details>` with custom summary marker. First item open by default.
- **Contact form** — Preventdefault on submit in the mock; real impl should validate + POST to `/api/contact` which routes by `about` field to the appropriate inbox.
- **Global** — All links have red-underline hover. Photos do not animate. Buttons have `translateY(-3px)` lift on hover with 150ms ease.

## Assets

All in `source/assets/`:

- **`logo-full.svg`** — Full walking-granny logo with picket sign. Use in footer, hero, About page CTA.
- **`logo-cropped.svg`** — Square-cropped logo for header and tight contexts.
- **`granny-photo-1.jpg`** — **Placeholder photo** used on Home, About, Herstory, FAQ, Contact, Press pages. The client will provide real photography — treat this as a position-only placeholder and swap everywhere.
- **`home-areamap.jpg`** — Reference image for map styling; production uses SVG (see `gaggle-map.jsx`).
- `granny-cream.png`, `granny-red.png`, `granny-walking.png`, `granny-walking-cream.png`, `granny-cropped.png` — PNG variants, prefer SVGs where available.

No icons from icon libraries — all icons are inline SVG strokes, 1.5px, `currentColor`.

## Notes on Copy

- Masthead line: *"The International Disorganization"* — keep exact capitalization.
- Tagline: *"Using creative and humorous protests for political education."*
- Herstory year: **1987**, Victoria, BC.
- Stats: **80+** gaggles, **1,493** songs, **17** issue categories, **39** years.
- Do **not** use the word "newsletter" anywhere — the client is explicit about this. Signup is for announcements/dispatches only.
- Press page auto-feeds from Google Alerts. Do not mention paywalls.
- There is no central "logos & wordmarks" press asset yet — press kit offers Photography (CC-BY), Fact sheet, Spokesperson directory only.

## Files

Everything lives in `source/`:

```
Raging Grannies Designs.html   # Top-level canvas with all artboards
styles.css                     # Global tokens + base styles
shared.jsx                     # SiteHeader, SiteFooter, icons, sample data
design-canvas.jsx              # Presentation shell (not needed in prod)
home-b.jsx                     # Homepage (selected — "The Bulletin")
home-a.jsx, home-c.jsx         # Alternate homepages (ARCHIVE — do not implement)
song-library.jsx               # /songs
song-detail.jsx                # /songs/[id] — accepts { hasVideo } prop
gaggle-map.jsx                 # /gaggles
press.jsx                      # /press
inner-pages.jsx                # About, Herstory, Philosophy, FAQ, Contact
assets/                        # Logos + placeholder photo + icons
```

Each JSX file ends with `Object.assign(window, { ... })` exporting its components — this is a sandbox convention, not something to port.

## Screenshots

Reference renders of every page at 1440px width are in `screenshots/`:

- `01-home.png` — Homepage (The Bulletin)
- `02-song-library.png` — Song Library
- `03-song-detail.png` — Song Detail (with video)
- `04-song-detail-novideo.png` — Song Detail (no video fallback)
- `05-gaggle-map.png` — Gaggle Map
- `06-about.png` — About
- `07-herstory.png` — Herstory
- `08-philosophy.png` — Philosophy
- `09-faq.png` — FAQ
- `10-contact.png` — Contact
- `11-press.png` — Press

## Outstanding Items for the Client

- Final photography (replace `granny-photo-1.jpg` everywhere)
- Real song data import (CSV/JSON from existing archive)
- Gaggle directory data (lat/lng for 54+ gaggles)
- Google Alerts → Press ingestion pipeline
- Form submission endpoint + email routing rules
