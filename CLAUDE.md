# International Raging Grannies — Project Context

## What this is

A headless rebuild of the International Raging Grannies (IRG) web ecosystem. The current state is platform chaos: the international hub and song archive live on separate WP installs, gaggle sites are scattered across WordPress, Google Sites, Tumblr, static HTML, and Homestead. This project consolidates everything into a single WordPress multisite backend with a modern Astro static frontend.

Two parallel goals:

1. **Functional**: deliver a unified, maintainable web presence for ~80 gaggles, with a central song archive, consistent gaggle site templates, and content that non-technical grannies can manage through WP admin.
2. **Portfolio**: demonstrate modern headless WordPress multisite architecture — content migration, multi-source API consumption, static frontend, deploy automation — targeted at roles like AMD Newsroom.

Both goals matter. Don't sacrifice one for the other.

Maya Bairey (developer, `stephbairey` on GitHub) is the IRG "Web Granny" — she has full admin access to all existing IRG sites and authority to make technical decisions.

## Stack

- **CMS**: WordPress Multisite at `raginggrannies.international`, hosted on a dedicated Nixihost account (separate from Maya's personal hosting)
- **Content API**: WPGraphQL (installed on the multisite)
- **Frontend**: Astro at `raginggrannies.org` (eventually; during dev, on Cloudflare Pages default URL)
- **Deploy**: Cloudflare Pages, auto-rebuild on content change via webhook from WP
- **Repo**: `github.com/stephbairey/irg`

No commerce. No email marketing integration (for now). The E-Vine members-only listserv remains a separate system.

## Architecture

```
raginggrannies.international     →  WordPress Multisite on Nixihost (admin/CMS only)
  ├── main site                      Songs (as posts), hub pages, shared taxonomies
  ├── /portland/                     Portland gaggle subsite
  ├── /seattle/                      Seattle gaggle subsite
  ├── /calgary/                      Calgary gaggle subsite
  └── ... (one subsite per gaggle)
                                     ↓ WPGraphQL (one endpoint per subsite)
                                     ↓ deploy webhook on publish/update
                                     ↓
raginggrannies.org               →  Astro static build on Cloudflare Pages
                                     Hub pages, song archive, gaggle pages
                                     Members-only sections use client-side password gate
```

WP is primarily a backend. Grannies use WP admin to manage content. The public never sees the WP frontend, EXCEPT for members-only content in Phase 1 (see "Members-only" section below).

## Content model

### Main site (network primary site)

**Pages** — static informational content:
- About / Philosophy / Herstory
- FAQ
- Locations (gaggle directory with map)
- Start a Gaggle (guide for new gaggles)
- Contact
- unConventions (info about gatherings)

**Songs** (custom post type) — the entire song archive lives here on the main site:
- ~1000+ songs migrated from raginggrannies.net
- Additional songs from gaggle subsites that maintain their own archives
- **Custom taxonomies** (registered with the Songs CPT):
  - **Issue** (hierarchical, like categories): Environment, Healthcare, War & Peace, Reproductive Rights, etc. — taxonomy TBD with song librarian
  - **Songwriter** (flat, like tags): individual granny names
  - **Gaggle** (flat, like tags): gaggle of origin
  - **Tune** (flat, like tags): the melody the song is sung to
- **Custom fields** (ACF or native): lyrics (rich text), tune name (text), songwriter credit (text), gaggle credit (text), performance notes (optional text)
- Registered with `has_archive => true` and a custom admin label so the WP admin sidebar shows "Songs" not "Posts"

**Posts** on the main site are reserved for hub-level news/announcements if ever needed. Currently unused — keeping them available avoids painting ourselves into a corner.

Songs are a **network-level resource**. They live on the main site, not on individual gaggle subsites. Astro renders them as a browsable, searchable, filterable song library. WPGraphQL exposes the Songs CPT and its custom taxonomies via the GraphQL schema (requires WPGraphQL registration in the CPT definition).

### Gaggle subsites (consistent template, local content)

Every gaggle subsite has the same available page/post structure. Not all gaggles will fill all sections — empty sections don't render on the Astro frontend.

**Pages** (standard template for every gaggle):
- About — local gaggle history, story, who we are
- Contact / Join Us — contact form + prospective granny interest form
- Gallery — photos and videos from actions and events
- Members Only — password-protected page for gaggle-internal info (meeting schedules, contact lists, internal docs)

**Posts** — local news/actions/events:
- Blog-style posts about actions the gaggle has taken
- Each post has: title, content, featured image, date, categories (local, not shared with song taxonomy)

### Members-only sections

Each gaggle has a members-only page protected by a **client-side password gate**. All grannies in that gaggle share one password. Content is rendered in the static HTML but hidden behind a JavaScript password prompt.

**Security model**: this is "keep casual visitors out" security, not bank-grade. The content (meeting notes, contact lists) is low-sensitivity. A technically motivated person could view source and find it. This is acceptable for IRG's needs.

**Implementation**: Astro component that wraps members-only content in a password check. Password stored as an env variable per gaggle (or in a config), checked client-side. No server-side rendering needed. Astro stays fully static.

## Key decisions already made (and why)

Full reasoning will live in `DECISIONS.md` at the repo root.

- **Headless WP multisite, not traditional WP.** Unified architecture for 80+ sites, modern frontend, portfolio demonstration.
- **WPGraphQL over REST API.** Maya has full admin access to the new WP install; no constraint preventing plugin installation. GraphQL's query-only-what-you-need matters when fetching from multiple subsites at build time.
- **Songs as a custom post type on the main site, not standard posts or a separate subsite.** Dedicated CPT with custom taxonomies (Issue, Songwriter, Gaggle, Tune) and custom fields (lyrics, credits, performance notes). Clear admin labeling — WP sidebar shows "Songs." Main site's standard Posts remain available for hub news if ever needed.
- **Client-side password gate for members-only, not WP auth or Cloudflare Access.** Simplest approach that meets security needs. No SSR required. Cloudflare Access is the Phase 2 upgrade path if stronger auth is ever needed.
- **Cloudflare Pages for frontend hosting.** Same rationale as previous project — unlimited bandwidth, fastest CDN, no commercial-use restrictions.
- **Separate Nixihost account for IRG.** Clean boundary for potential handoff. If Maya stops being Web Granny, the hosting account transfers independently of her personal infrastructure.
- **Fresh repo, not forking lila-anwell.** Different project, different content model, different brand. Tooling decisions (Astro 6, Tailwind 4, TypeScript) carry over as knowledge, not as code.
- **raginggrannies.international as CMS domain during dev.** Eventually `raginggrannies.org` points to CF Pages (public site) and `cms.raginggrannies.org` points to Nixihost (WP admin). During development, `raginggrannies.international` serves as the CMS URL.

## Brand

IRG has existing brand colors that should be followed. Brand documentation needs to be created (equivalent to Lila Anwell's `docs/brand/visual-identity.md`). Key visual elements from the existing staging site (`staging.raginggrannies.org`) that appear intentional:

- Hero imagery of grannies in action
- Purple/magenta map of North America for gaggle locations
- FAQ section with accordion-style Q&A
- Song library with category filtering

The overall tone should be: bold, joyful, irreverent, accessible, activist. Not corporate, not precious, not somber. These are women who wear flowered hats and sing satirical songs at protests — the site should feel like that.

UX direction: new design, informed by but not copying the staging site's layout. See audit document (`docs/audit/`) for detailed analysis of what works and doesn't across the current ecosystem.

## Content migration plan

### Songs (~1000+ from raginggrannies.net)
- Source: standard WP export (posts with categories/tags) from raginggrannies.net
- Destination: Songs CPT on the main site of the new multisite
- Migration: WP export, then scripted import that maps old posts → Songs CPT entries and remaps old categories → Issue taxonomy, old tags → Songwriter/Gaggle/Tune taxonomies. Standard WP import won't work directly because the destination is a CPT, not posts — will need a custom import script or WP All Import Pro.
- Song librarian meeting must happen before migration to finalize taxonomy mapping
- Some gaggle subsites (Calgary, Ottawa, Seattle) also have local song archives — these need to be deduplicated and merged into the central archive

### Portland gaggle (72 posts, 21 pages)
- Source: portland.raginggrannies.org (WP)
- Destination: `/portland/` subsite on the new multisite
- Migration: WP export/import, content review for outdated material

### Other gaggles
- Phase 2+ (after the PoC month)
- Each gaggle gets an empty subsite with the standard template
- Content migrated gaggle by gaggle, prioritized by which gaggles are most active

### Hub content (raginggrannies.org)
- Source: current raginggrannies.org (WP, mostly static pages)
- Destination: main site pages on the new multisite
- Migration: manual — small number of pages, worth reviewing and rewriting during migration

## PoC scope (Month 1)

The first month delivers a working demonstration of the full architecture with real content:

**Week 1 — Infrastructure & content modeling**
- Set up WP multisite on Nixihost (raginggrannies.international)
- Install plugins: WPGraphQL, WPGraphQL for ACF (if using ACF), ACF (if using), security plugin
- Define content model: song taxonomy (with song librarian), gaggle subsite template
- Scaffold Astro project, connect to Cloudflare Pages
- Create `irg` repo, CLAUDE.md, DECISIONS.md

**Week 2 — Content migration & core components**
- Migrate song archive from raginggrannies.net into main site
- Migrate hub content (pages) into main site
- Build Astro layouts: base layout, navigation, footer
- Build song library components: list, search/filter, single song view
- Get hub + songs rendering on CF Pages staging URL

**Week 3 — Portland subsite**
- Migrate Portland content (72 posts, 21 pages)
- Build gaggle subsite templates: about, actions/blog, gallery, contact/join, members-only
- Prove the multisite-to-Astro pattern works for one gaggle
- Create empty subsites for 3-5 other gaggles with placeholder content

**Week 4 — Polish & documentation**
- Webhook-triggered rebuilds from WP
- Responsive design pass
- Accessibility check
- Contact/join forms working
- Members-only password gate working
- DECISIONS.md fully updated
- README.md written for portfolio
- End state: live staging URL demonstrating hub + songs + Portland + empty gaggle templates

**Post-PoC (ongoing as Web Granny)**
- Migrate remaining gaggles one by one
- Cut over DNS: raginggrannies.org → CF Pages, cms.raginggrannies.org → Nixihost
- Retire old sites (raginggrannies.net, individual gaggle sites)
- Cloudflare Access for members-only sections (Phase 2 upgrade)

## Conventions

- **`DECISIONS.md` at repo root.** Every meaningful decision logged with date, options, choice, rationale, and revisit conditions. Stable IDs (D001, D002...) for cross-referencing in commits.
- **Commit messages**: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`). Reference decision IDs when relevant.
- **Branching**: work on `main` for now.
- **Secrets**: never commit. `.env.local` for dev, Cloudflare environment variables for prod. WPGraphQL endpoint URLs, gaggle members-only passwords all live in env vars.

## What NOT to do

- Don't build a traditional WP theme for the public site. WP is a backend.
- Don't hardcode WP URLs — env variables always.
- Don't try to migrate all 80 gaggles in Month 1. Portland is the proof; the rest follows.
- Don't build server-side rendering for members-only sections. Client-side password gate is the v1 solution.
- Don't duplicate songs across gaggle subsites. Songs live on the main site only.
- Don't over-engineer the gaggle template. Start simple (about, actions, gallery, contact, members). Gaggles that need more can request it later.

## Open questions (resolve as we go)

- **Song taxonomy structure**: categories and tags TBD with song librarian. Schedule meeting before Week 2 migration.
- **Brand colors and visual identity**: need to document. Check existing staging site and any other IRG brand materials.
- **Gallery implementation**: what plugin/approach for photo/video galleries in WP? Needs to be granny-friendly in the admin UI.
- **Contact form handling**: where do form submissions go? Email to gaggle coordinator? WP admin? Third-party form service?
- **DNS cutover plan**: when and how to move raginggrannies.org from FastComet to CF Pages, and set up cms.raginggrannies.org on Nixihost. Needs a migration plan to avoid downtime.
- **Subsites for inactive gaggles**: do gaggles with no web presence (Pittsburgh, Milwaukee, etc.) still get a subsite? If so, what's the minimum content — just a contact page?
- **Image handling**: where do images live? WP media library on the multisite? Cloudflare Images? Local to each subsite?
- **Song deduplication**: some gaggles (Calgary, Ottawa, Seattle) have their own song archives that may overlap with raginggrannies.net. How to handle duplicates during migration.
