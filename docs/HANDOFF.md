# International Raging Grannies — Web Project Handoff

**Status as of 2026-05-05.** Phase 1 (rebuild and content migration) is complete. DNS cutover, gaggle feedback meeting, and Phase 2 enhancements remain.

## What this is

A headless rebuild of the IRG web ecosystem. Replaces ~15 scattered platforms (WordPress, Google Sites, Tumblr, static HTML, Homestead) with one consolidated stack: a WordPress multisite backend feeding a static Astro frontend.

**Two parallel goals:**

- **Functional.** A unified, maintainable web presence for ~80 gaggles, with a central song archive, consistent gaggle subsite templates, and content non-technical grannies can manage in WP admin.
- **Portfolio.** Demonstrate modern headless WP multisite architecture for roles like AMD Newsroom.

## Stack at a glance

| Layer | Tech | Domain |
|---|---|---|
| Public hub | Astro 6 + Tailwind 4 + TypeScript, deployed to Cloudflare Pages | `raginggrannies.org` (post-cutover); `irg-8vx.pages.dev` (current) |
| CMS | WordPress 6.9.4 multisite (subdirectory mode), 62 sites total | `cms.raginggrannies.international` (current); `cms.raginggrannies.org` (post-cutover) |
| Hosting (CMS) | Nixihost dedicated account, server `iah-s04.nixihost.com`, IP `23.187.248.21` | SSH alias: `nixihost-irg` |
| Hosting (hub) | Cloudflare Pages (auto-deploys on push to `main`) | — |
| Repo | GitHub `stephbairey/irg`, work on `main` | — |
| Content API | WPGraphQL (network-active) | `<subsite>/graphql` |
| Chatbot | Cloudflare Workers AI (embeddings) + Anthropic Claude Haiku 4.5 (chat) | `/api/ask` Pages Function |

## Repository structure

```
irg/
  src/                          Astro frontend
    pages/                      Hub pages (about, find-a-gaggle, songs, ask, privacy, etc.)
    layouts/BaseLayout.astro    Shared header, footer, nav
    components/                 Astro components (JsonLd, etc.)
    lib/                        Build-time data helpers (songs, subsites, actions, gaggles, public-filter)
    styles/                     Tailwind theme tokens
  data/                         Committed JSON snapshots (songs, subsites, actions, photos, locations)
  scripts/                      Build + ops scripts (snapshot, deploy, RAG index, bulk-create)
  public/                       Static assets (logos, favicon, embeddings.json, llms.txt, songsheets/)
  functions/                    Cloudflare Pages Functions (api/ask, admin/chatbot-status)
  wp-theme/the-bulletin-local/  Subsite theme (PHP + CSS + theme.json)
  wp-plugin/irg-core/           Custom WP plugin (CPTs, REST endpoints, multisite helpers)
  docs/                         Architecture, audit, design, infrastructure, runbooks
  CLAUDE.md                     Project context for AI assistants
  DECISIONS.md                  Decision log, D001 to D050
```

## Content model

### Main site (network primary)

- **Songs CPT** (~1,500 records): the central song library. Custom taxonomies: Issue, Songwriter, Gaggle, Tune. Custom fields via ACF: lyrics, tune, credits, performance notes, YouTube links.
- **Press Photo CPT** (D028): 4 high-resolution press photos curated separately from the media library so journalists get a clean kit, not every snapshot ever uploaded.
- **Pages**: About, Philosophy, Herstory, FAQ, Find a Gaggle, Start a Gaggle, Contact, Spokespeople, In the News, Submit, Fact Sheet, Ask, Privacy, Videos, Photos.

### Gaggle subsites (61 of them, all on Bulletin Local theme)

Standard pages seeded by the theme on first activation:

- Home (static front, custom front-page.php)
- About (boilerplate, gaggle-personalized at activation)
- Photos (`page-photos.php` template)
- Videos (`page-videos.php` template; pulls latest 6 uploads from a YouTube channel via RSS)
- Contact (`page-contact.php` template; per-gaggle deck override via page content)
- Actions (set as `page_for_posts`)

Standard category seeded by the theme:

- **Gaggle Notes** (D048) for evergreen reference posts. Surfaces in a dedicated front-page section above Recent Actions, excluded from the Actions archive and the cross-site aggregator. Hidden when empty.

Per-subsite settings (via Appearance → Gaggle Settings):

- Hero image
- YouTube channel URL (resolves to channel ID + RSS feed; cached)
- Tagline
- Show local songs toggle

## The Bulletin Local theme

Standalone newsprint-style theme (D034). Vanilla CSS + vanilla JS, no preprocessors, no JS frameworks. Brand tokens mirror the Astro hub exactly.

### Version log (current: 1.18.0)

| Version | Change |
|---|---|
| 1.10.0 | Baseline |
| 1.11.0 | Videos page renders latest YouTube uploads via channel-RSS |
| 1.12.0 | "Grannies Only" conditional nav item |
| 1.13.0 | `.tbl-callout` reusable purple-block class |
| 1.14.0 | Privacy footer link |
| 1.15.0 | Gaggle Notes category + front-page section |
| 1.16.0 | Details block accordion styling + single-open JS |
| 1.17.0 | `theme.json` native lightbox + gallery clear-float |
| 1.18.0 | Contact-page deck reads from page content |

### Notable theme features

- **Polaroid featured image** floats right at 50% width on `min-width: 768px`. Body content wraps left.
- **Native Details block accordions** (D049): styled to match the theme. JS in `footer.php` makes adjacent details siblings exclusive.
- **Native image lightbox** (D049): `theme.json` enables it site-wide. Galleries clear floats so they always render at full content width.
- **Conditional nav items**: Videos appears when YouTube URL is set; Grannies Only appears when a `/member-map/` page exists.
- **Per-gaggle defaults** seeded on activation; backfilled on version change via `tbl_maybe_flush_on_version_change`.

### Deploying theme changes

```
node scripts/deploy-theme.mjs
```

This zips `wp-theme/the-bulletin-local/`, uploads via `irg/v1/theme-upload` REST endpoint, and the network admin theme is replaced atomically. Bump `TBL_VERSION` in `functions.php` and `style.css` together to trigger the rewrite-rules + content backfill hook on every subsite.

## Astro hub

Built statically, deployed via push to `main` → Cloudflare Pages auto-build.

### Pages of note

- `/songs/` (1,471 songs from corpus)
- `/songs/by-issue/`, `/songs/by-tune/` (taxonomy archives)
- `/songs/[slug]/` (1,469 individual song pages)
- `/find-a-gaggle/` (Mapbox map + directory; gated link rendering by subsite existence)
- `/ask/` (chatbot UI, calls `/api/ask`)
- `/privacy/` (D050)
- Plus: about, philosophy, herstory, faq, start-a-gaggle, contact, spokespeople, in-the-news, photos, videos, submit, fact-sheet

### Build pipeline

`npm run build` runs (in order):

1. `scripts/fetch-press.mjs` (Google News RSS into `data/press-clippings.json`, D047)
2. `scripts/generate-songsheets.mjs` (PDF songsheet per song into `public/songsheets/`)
3. `scripts/generate-llms-txt.mjs` (writes `public/llms.txt` and `public/llms-full.txt`)
4. `astro build` (1,491 pages currently)

Node 22 required.

## Data pipeline

The Astro hub reads from committed JSON snapshots in `data/` rather than hitting WP at build time, because Imunify360 on Nixihost bot-blocks Cloudflare Pages build workers. Snapshots are pulled locally where the IP isn't blocked.

| Script | Output | Re-run when |
|---|---|---|
| `scripts/snapshot-songs.mjs` | `data/songs-consolidated.json` | Songs added/edited in WP admin |
| `scripts/snapshot-subsites.mjs` | `data/subsites.json`, `data/actions.json` | Gaggle subsites added; Action posts published; Gaggle Notes filter is applied here |
| `scripts/snapshot-photos.mjs` | `data/press-photos.json` | Press Photos added/edited |
| `scripts/build-rag-index.mjs` | `public/embeddings.json` | After any of the above (rebuilds embeddings; ~7 MB; uses CF Workers AI) |
| `scripts/fetch-press.mjs` | `data/press-clippings.json` | Daily via GitHub Actions; also runs on every build |

Standard refresh:

```bash
node scripts/snapshot-songs.mjs       # if songs changed
node scripts/snapshot-subsites.mjs    # if subsite Actions changed
node scripts/snapshot-photos.mjs      # if Press Photos changed
node scripts/build-rag-index.mjs      # rebuild embeddings (run last)
git add data/*.json public/embeddings.json
git commit -m "data: refresh corpus"
git push
```

## Bulk subsite operations

`scripts/bulk-create-subsites.mjs` is idempotent and SSH-driven. Provisions a fresh subsite end-to-end: site create, default-content cleanup, theme activation, seeder force-trigger, site icon upload, timezone (via `tz-lookup` from lat/lng), start-of-week. Driven by `data/gaggle-locations.json`.

```bash
node scripts/bulk-create-subsites.mjs              # all 61
node scripts/bulk-create-subsites.mjs portland     # one
```

`scripts/verify-subsite.mjs <slug>` probes a subsite's REST + GraphQL endpoints to confirm the seeder ran correctly. Use after each new gaggle.

Subsite creation runbook: `docs/infrastructure/subsite-creation-runbook.md`.

## The chatbot (L3, D041 / D045)

`/ask` page, backed by:

- **Embeddings prebuild**: `scripts/build-rag-index.mjs` runs locally, embeds 1,563 chunks (1,471 songs + 61 gaggles + 21 FAQs + 10 page summaries) using `@cf/baai/bge-small-en-v1.5`, writes `public/embeddings.json`.
- **Chat endpoint**: `functions/api/ask.ts` (CF Pages Function). Embeds the user query, top-K cosine over the in-memory embeddings, sends top results plus a strict system prompt to Claude Haiku 4.5 with prompt caching.
- **Cost guardrail**: KV-backed daily counter. Soft alert at $0.25/day, hard cutoff at $1/day. KV namespace: `BUDGET_KV`.
- **Transcript logging**: anonymized (hashed IP), 90-day rolling, KV-backed.
- **Admin status**: `/admin/chatbot-status?token=<ADMIN_TOKEN>` shows daily spend, recent transcripts, soft-alert state.
- **Voice**: granny activist voice, no em dashes (system prompt enforces). Imports `data/gaggle-locations.json` so the gaggle count in the prompt is dynamic.

## Press feed (D047)

Replaces D027's The News API. Google News RSS at `news.google.com/rss/search?q="raging+grannies"&hl=en-US&gl=US&ceid=US:en`. Free, no API key, ~100 results per call. Parsed with `fast-xml-parser`. Daily GitHub Actions cron at 13:17 UTC commits any new entries to `data/press-clippings.json`, which triggers a CF Pages rebuild.

## Privacy policy (D050)

`raginggrannies.org/privacy/`. Single canonical page on the hub. Footer link from Astro hub and from all 61 Bulletin Local subsites. Privacy contact: `webgranny@raginggrannies.org`.

## Custom WP plugin (`wp-plugin/irg-core/`)

Network-active. Provides:

- Songs CPT registration + ACF field group + WPGraphQL exposure
- Press Photo CPT
- `irg/v1/subsites` REST endpoint (used by the snapshot pipeline)
- `irg/v1/contact` REST endpoint (subsite contact form handler; ajax)
- `irg/v1/submit-song` REST endpoint (song submission gate)
- `irg/v1/plugin-upload` and `irg/v1/theme-upload` REST endpoints (used by deploy scripts)

## Network plugins

Lean by design. Currently network-activated:

- **WordPress Importer** (used for the Portland media migration; can leave installed)
- **WPGraphQL** + **WPGraphQL for ACF**
- **ACF** (Advanced Custom Fields)
- **Enable Media Replace** (Maya installed, useful for swapping images without breaking URLs)
- **Redirection** (Maya installed, manage 301s when content moves)
- **Converter for Media** (free WebP / AVIF generation for the media library)
- **IRG Core** (custom plugin, see above)

## Credentials and access

(Document references; secrets live in `.env.local` and Cloudflare Pages env vars, never committed.)

- **WP super admin user**: `webgranny`. Confirmed admin on all 61 subsites.
- **WP-CLI on server**: `php ~/cms.raginggrannies.international/wp-cli.phar`
- **SSH**: `ssh nixihost-irg` (alias to `raginggr@23.187.248.21`)
- **WP admin login URL**: `https://cms.raginggrannies.international/wp-admin/`
- **Network admin**: `https://cms.raginggrannies.international/wp-admin/network/`
- **CF Pages dashboard**: GitHub-connected; auto-deploys `main`
- **Astro hub admin (chatbot)**: `https://irg-8vx.pages.dev/admin/chatbot-status?token=<ADMIN_TOKEN>`
- **Email contacts**:
  - `connect@raginggrannies.org` (general inbound, press, contact form recipient)
  - `webgranny@raginggrannies.org` (privacy requests, technical contact)
  - `<slug>@raginggrannies.org` (per-gaggle admin email; Montreal and Portland have actual mailbox forwarders configured, the other 59 are placeholders)

Hosting infrastructure details: `docs/infrastructure/irg-hosting.md`.

## What's pending before cutover

1. **Gaggle feedback meeting** (~2026-05-20). Calendar event. Whatever surfaces becomes new tasks.
2. **DNS cutover plan and execution.** `raginggrannies.org` from FastComet to Cloudflare Pages; `cms.raginggrannies.org` set up to point at Nixihost. Plan needed to avoid downtime; only flip when ready.
3. **Email forwarders for the other 59 gaggles** in Nixihost cPanel. Logistical, not engineering. Can wait until each gaggle is claimed.

## Phase 2 (deferred)

- **L4 — MCP server** (D042 to D044). Separate Cloudflare Worker at `mcp.raginggrannies.org`. Design doc valid; pick up post-cutover.
- **Streaming responses on `/ask`** (SSE wiring for Anthropic).
- **Soft-alert email** when chatbot daily spend crosses $0.25 (the flag is set in code; no email sent).
- **Centralized join form**. Currently every gaggle uses their own (Portland: Google Form). Future option: HTML form on subsites POSTing to per-gaggle Google Apps Script bound to their roster Sheet.
- **Other gaggles' content migration**: most have no content; a handful (Calgary, Ottawa, Seattle) have local song archives that need merging into the central library.
- **Retiring old sites**: raginggrannies.net, individual gaggle WP installs.

## Decision log

`DECISIONS.md` carries 50 decision entries (D001 through D050). Notable ones:

- **D001 to D008**: stack and architecture (multisite, Astro, CF Pages, headless WP, GraphQL, custom theme)
- **D027 (superseded by D047)**: press feed
- **D028**: Press Photo CPT
- **D034**: The Bulletin Local theme
- **D038 to D045**: agent layer (JSON-LD, llms.txt, RAG, MCP design, chatbot UX)
- **D046**: public-filter rule for members-only content
- **D047**: Google News RSS press feed
- **D048**: Gaggle Notes category
- **D049**: Native WP disclosure UI (Details, lightbox)
- **D050**: Privacy policy on hub, linked from subsites

Whenever a meaningful decision changes, add a new entry. Stable IDs are referenced in commit messages.

## Common operations

**Add a song to the library:**
1. WP admin → Songs → Add New → fill in title, lyrics, taxonomies, ACF fields → Publish
2. Locally: `node scripts/snapshot-songs.mjs` then `node scripts/build-rag-index.mjs`
3. Commit + push `data/songs-consolidated.json` and `public/embeddings.json`

**Add a new gaggle (one-off):**
1. Add the gaggle entry to `data/gaggle-locations.json` (name, region, country, lat, lng, aka, slug)
2. Run `node scripts/bulk-create-subsites.mjs <slug>`
3. Run `node scripts/verify-subsite.mjs <slug>`
4. Run `node scripts/snapshot-subsites.mjs`, build, commit + push

**Push a theme update:**
1. Edit `wp-theme/the-bulletin-local/`
2. Bump `TBL_VERSION` in `functions.php` AND `Version:` in `style.css`
3. Run `node scripts/deploy-theme.mjs`
4. Commit + push the source

**Re-run the press feed manually:**
1. `node scripts/fetch-press.mjs` (or wait for the daily GitHub Actions cron)
2. Commits land via `press-bot` or your local commit + push

**Verify chatbot health:**
1. Visit `https://irg-8vx.pages.dev/admin/chatbot-status?token=<ADMIN_TOKEN>`
2. Check daily spend, soft-alert state, recent transcripts

## Project conventions

- Branching: work directly on `main`. Tag rollback points (`pre-mobile-pass` exists from the 2026-05-04 mobile sweep) when starting a multi-commit refactor.
- Commits: Conventional Commits style (`feat:`, `fix:`, `docs:`, `chore:`). Reference D-IDs when relevant.
- Branding voice: "warm, witty, irreverent grandmother." NEVER em dashes in user-facing copy. (Memory file `project_brand_voice.md` has the full spec.)
- Secrets: `.env.local` (never committed), CF Pages env vars (production).
