# Decisions Log — International Raging Grannies

A running record of meaningful technical and product decisions. Each entry captures what was considered, what was chosen, and why. New decisions append to the bottom.

Format: `Dxxx — Title` · status · date · context · options · choice · rationale · revisit conditions.

---

## D001 — Headless WordPress multisite over traditional WP

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: IRG's web ecosystem is fragmented across 15+ sites on different platforms (WordPress, Google Sites, Tumblr, static HTML, Homestead). Maya Bairey (Web Granny) has been tasked with consolidating and modernizing the ecosystem. The project also serves as a portfolio piece for headless WP roles.
- **Options considered**:
  - Traditional WP multisite with a unified theme (simpler, but doesn't demonstrate headless architecture)
  - Headless WP multisite + decoupled Astro frontend (modern, portfolio-relevant, better performance)
  - Static site generator only, no CMS (too technical for granny content editors)
  - Squarespace/Wix (would solve the "easy to edit" problem but no portfolio value and ongoing cost)
- **Choice**: Headless WP multisite + Astro frontend.
- **Rationale**: WP multisite gives each gaggle its own admin space with familiar editing tools. Headless architecture demonstrates exactly the skills AMD-style roles require. Astro generates a fast static site globally distributed via CDN. The grannies who edit content never need to know about the frontend stack.
- **Revisit if**: The headless approach proves too complex for the non-technical grannies to understand conceptually, or if build times become unmanageable with 80+ subsites.

## D002 — WPGraphQL over WP REST API

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: Astro needs to fetch content from multiple WP subsites at build time. Maya has full admin access and is building a new WP install from scratch, so any plugin can be installed.
- **Options considered**:
  - WP REST API (built into core, zero setup, works without admin access)
  - WPGraphQL (plugin, query-only-what-you-need, better DX)
- **Choice**: WPGraphQL.
- **Rationale**: With 80+ potential subsites and a song archive of 1000+ posts, the REST API's "fetch everything then filter" approach would be wasteful at build time. GraphQL lets Astro request exactly the fields needed for each component. Maya has full control of the WP install, so the plugin dependency is not a constraint. The REST API was considered as an alternative for reading from existing installs without modification, but since we're building a new multisite from scratch, GraphQL is the stronger choice.
- **Revisit if**: WPGraphQL multisite support proves buggy or poorly documented.

## D003 — Songs as a custom post type on the main site

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: The song archive is the most important shared resource in the IRG ecosystem. Currently lives on a separate WP install (raginggrannies.net) with ~1000+ songs organized by categories and tags. Some gaggles (Calgary, Ottawa, Seattle) also maintain local song archives.
- **Options considered**:
  - Songs as standard posts on the main site (simple, but "Posts = Songs" naming confusion in WP admin; standard categories/tags only)
  - Songs as a custom post type on the main site (clear admin labeling, custom taxonomies and fields, room to grow)
  - Songs as a separate WP subsite within the multisite
  - Songs as a shared CPT at the network level (complex multisite plugin architecture)
  - Songs remain on a separate WP install (raginggrannies.net)
- **Choice**: Songs as a custom post type on the main site.
- **Rationale**: A dedicated CPT means the WP admin sidebar shows "Songs" — no confusion for grannies about what "Posts" means. Custom taxonomies (Issue, Songwriter, Gaggle, Tune) can be registered specifically for the Songs CPT rather than overloading the default categories/tags. Custom fields (lyrics, tune name, credits, performance notes) can be structured via ACF. The main site's standard Posts remain available if the hub ever needs a news/announcements blog. Songs are a network-level resource; placing them on the main site reflects their shared status. WPGraphQL exposes CPTs natively when registered with `show_in_graphql => true`.
- **Trade-off**: Slightly more setup work than using standard posts. Song migration from raginggrannies.net (which uses standard posts) will need to map old posts → new CPT entries and remap categories/tags → custom taxonomies. Worth it for the clarity and extensibility.
- **Revisit if**: Song data model proves simpler than expected and the CPT overhead isn't justified. (Unlikely given 1000+ songs with structured metadata.)

## D004 — Client-side password gate for members-only content

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: Each gaggle subsite needs a members-only section for internal information (meeting schedules, contact lists, internal docs). The site is statically generated via Astro on Cloudflare Pages.
- **Options considered**:
  - Members-only content stays on WP, accessed via WP admin login (simplest, no frontend work)
  - Client-side password gate in Astro (shared gaggle password, JS prompt, content in static HTML)
  - Cloudflare Access (email-based auth on specific URL paths, genuinely secure, free tier)
  - Server-side rendering in Astro via Cloudflare Workers (adds SSR complexity)
- **Choice**: Client-side password gate.
- **Rationale**: The content is low-sensitivity (meeting notes, contact lists). A shared gaggle password is familiar to the grannies and requires no individual account setup. The static site stays fully static — no SSR, no server-side auth. A determined person could view source and find the content, but this is acceptable for IRG's threat model. Cloudflare Access is the Phase 2 upgrade path if stronger auth is ever needed.
- **Revisit if**: Members-only content becomes more sensitive (financial info, legal docs), or if grannies find the password gate UX confusing.

## D005 — Cloudflare Pages for frontend hosting

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: Static frontend needs a build + hosting platform with auto-deploy from git.
- **Options considered**:
  - Netlify (free tier: 100GB/month, good DX)
  - Vercel (free Hobby tier: commercial-use restriction in ToS)
  - Cloudflare Pages (free tier: unlimited bandwidth, fastest CDN)
- **Choice**: Cloudflare Pages.
- **Rationale**: IRG is a nonprofit with potential for traffic spikes (viral protest coverage, media attention). Unlimited bandwidth eliminates throttling risk. Cloudflare's CDN is fastest globally. No commercial-use restrictions.
- **Revisit if**: Cloudflare's free tier terms tighten.

## D006 — Separate Nixihost account for IRG

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: Maya manages IRG web infrastructure but may hand it off to another Web Granny someday.
- **Choice**: Dedicated Nixihost account for IRG, separate from Maya's personal hosting (linguaink.com/bairey.com).
- **Rationale**: Clean handoff boundary. If Maya stops being Web Granny, she transfers the Nixihost account credentials. Her personal hosting is unaffected. IRG's hosting is self-contained.
- **Revisit if**: Never.

## D007 — raginggrannies.international as CMS domain

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: Need a domain for the WP multisite during development and potentially long-term as the CMS URL.
- **Choice**: `raginggrannies.international` on the dedicated Nixihost account. Eventually, `raginggrannies.org` points to CF Pages (public) and either `raginggrannies.international` or `cms.raginggrannies.org` serves as the WP admin URL.
- **Rationale**: Keeps the CMS domain completely separate from the public-facing domain. Works immediately for development without needing to touch raginggrannies.org's DNS. The `.international` TLD is a nice fit for an international organization.
- **Revisit if**: DNS cutover plan determines a different CMS URL is preferable.

## D008 — Fresh repo, not forking lila-anwell

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: Maya previously scaffolded an Astro 6 + Tailwind 4 + TypeScript project for a different site (Lila Anwell). The tooling decisions are the same but the project is entirely different.
- **Choice**: Fresh repo at `github.com/stephbairey/irg`.
- **Rationale**: Different content model, different brand, different multi-site architecture. Forking would carry Lila-specific config and brand tokens that would need to be stripped. Starting fresh is cleaner and avoids any confusion between projects. The tooling knowledge (Astro 6, Tailwind 4, TypeScript, CF Pages) transfers as expertise, not as code.
- **Revisit if**: Never.

## D009 — Node 22 LTS, pinned via .nvmrc and engines field

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: Astro 6 requires Node >=22.12.0. The previous project (lila-anwell) initially used Node 20, which caused issues when Astro 6 dropped support for it.
- **Options considered**:
  - Node 20 LTS (broader compatibility, but Astro 6 requires >=22.12.0)
  - Node 22 LTS (required by Astro 6, current LTS)
- **Choice**: Node 22 LTS, pinned via `.nvmrc` (for nvm users) and `engines` field in `package.json` (for CI/deployment).
- **Rationale**: Astro 6 hard-requires Node 22. No choice here — just documenting the pin and the two enforcement mechanisms.
- **Revisit if**: Node 24 becomes LTS and Astro supports it.

## D010 — Tailwind 4 via @tailwindcss/vite plugin, not @astrojs/tailwind

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: Tailwind CSS 4 changed its integration model. The old `@astrojs/tailwind` integration is deprecated and incompatible with Tailwind 4. Learned from the lila-anwell project where this caused initial confusion.
- **Options considered**:
  - `@astrojs/tailwind` integration (deprecated, Tailwind 3 only)
  - `@tailwindcss/vite` as a Vite plugin in `astro.config.ts` (official Tailwind 4 approach)
- **Choice**: `@tailwindcss/vite` registered as a Vite plugin.
- **Rationale**: This is the only supported path for Tailwind 4. Configuration lives in `src/styles/global.css` via `@theme` directive, not in a separate `tailwind.config` file. Vite 7 pinned via `overrides` in `package.json` because Tailwind 4's vite plugin pulls Vite 8 transitively, but Astro 6 requires Vite 7.
- **Revisit if**: Astro adds a first-party Tailwind 4 integration, or Astro upgrades to Vite 8.

## D011 — Astro integrations: sitemap, RSS, astro-icon

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: Choosing the initial set of Astro integrations for the project scaffold.
- **Options considered**:
  - Minimal (no integrations, add as needed)
  - Standard set: `@astrojs/sitemap`, `@astrojs/rss`, `astro-icon`
- **Choice**: `@astrojs/sitemap`, `@astrojs/rss`, `astro-icon`.
- **Rationale**: Sitemap is essential for SEO from day one. RSS will serve the song archive and gaggle action feeds. `astro-icon` provides a clean SVG icon system. All three are low-overhead and won't need to be removed. Additional integrations (MDX, image optimization) can be added later as needed.
- **Revisit if**: Any of these integrations become unmaintained or incompatible with Astro 6+.

## D012 — Custom WP plugin (irg-core) for content model

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: The Songs CPT and its custom taxonomies need to be registered in WordPress with WPGraphQL exposure. This logic could live in the theme's `functions.php`, in a mu-plugin, or in a standalone plugin.
- **Options considered**:
  - Theme `functions.php` (couples content model to theme; lost if theme changes)
  - Must-use plugin (auto-activated, no UI to disable — good for infra, but harder to install via WP admin)
  - Standard plugin with `Network: true` header (installable via zip upload in WP admin, network-activatable)
- **Choice**: Standard plugin (`irg-core`) with `Network: true`.
- **Rationale**: Content model is site infrastructure, not theme presentation — it should survive theme changes. A standard plugin is the easiest to install (zip upload via WP admin) and manage (network activate/deactivate). The `Network: true` header ensures it loads on all subsites. The plugin registers Songs CPT + taxonomies on the main site only (`is_main_site()` guard) and relabels Posts → Actions on subsites.
- **Revisit if**: The plugin grows complex enough to warrant splitting into separate plugins, or if mu-plugin auto-activation becomes preferable.

## D013 — Relabel "Posts" to "Actions" on gaggle subsites

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: Gaggle subsites use standard WP Posts for documenting protests, demonstrations, and community actions. "Posts" is a generic label that doesn't communicate the content purpose to granny editors.
- **Options considered**:
  - Keep default "Posts" label (no code needed, but confusing in context)
  - Relabel to "Actions" via the irg-core plugin (matches how gaggles talk about their activities)
  - Create a custom "Actions" CPT (unnecessary complexity; standard posts work fine, just need a label change)
- **Choice**: Relabel Posts → Actions on non-main subsites via `irg-core`.
- **Rationale**: Zero structural change — still standard posts with all built-in WP features (categories, tags, REST/GraphQL). Just changes the admin UI labels so grannies see "Add New Action" instead of "Add New Post." The relabeling only applies to subsites (`!is_main_site()`), leaving the main site's Posts untouched for potential hub news.
- **Revisit if**: Gaggles need genuinely different post types for different content (unlikely).

## D014 — GraphQL client as a thin fetch wrapper

- **Status**: Decided
- **Date**: 2026-04-21
- **Context**: Astro needs to fetch data from WPGraphQL endpoints at build time. Options range from raw `fetch` calls to full GraphQL client libraries.
- **Options considered**:
  - Raw `fetch` in each page (duplicated boilerplate)
  - `graphql-request` library (lightweight, but an npm dependency for a thin wrapper)
  - Custom `wpQuery()` wrapper around `fetch` (no dependency, typed, handles errors)
  - `urql` or `apollo-client` (heavy, designed for client-side apps with caching)
- **Choice**: Custom `wpQuery<T>()` function in `src/lib/graphql.ts`.
- **Rationale**: At build time, Astro makes one-shot requests — no caching, no subscriptions, no client-side state. A typed wrapper around `fetch` is all that's needed. The generic `<T>` parameter gives per-query type safety. The `endpoint` parameter supports querying different subsites. Adding a dependency for this would be overhead without benefit.
- **Revisit if**: Query complexity grows to need fragments, persisted queries, or code generation (e.g., `graphql-codegen`).

## D015 — Song archive consolidation approach

- **Status**: Decided
- **Date**: 2026-04-22
- **Context**: Two WP XML exports need to be consolidated: the main song site (raginggrannies.net, 1057 songs) and the Seattle gaggle site (534 songs). These overlap (99 potential duplicates). The main site has rich custom fields (tune, lyrics_by, gaggle, youtube_link, key_or_starting_note, date_written_or_updated). Seattle has songwriter names in tags and metadata embedded in content body HTML.
- **Options considered**:
  - Import directly into WP and sort it out there (fast, but no QA before import)
  - Parse to intermediate JSON, generate review spreadsheet, get song librarian approval, then import (slower, but data quality is verified before anything touches WP)
- **Choice**: Intermediate JSON consolidation with review spreadsheet.
- **Rationale**: 1591 songs with inconsistent metadata, 99 duplicates, and 129 variant gaggle names need human review before import. The consolidated JSON normalizes gaggles, extracts embedded metadata from content, detects duplicates, and preserves musical formatting tags in lyrics. The review spreadsheet gives the song librarian a single artifact to audit. Seattle category mapping is held separate pending Maya's approval. Nothing imports to WP until the data is clean.
- **Revisit if**: The song librarian wants to work directly in WP admin instead of a spreadsheet.

## D016 — Issue taxonomy overhaul (approved 2026-04-22)

- **Status**: Decided (applied)
- **Date**: 2026-04-22
- **Context**: Seattle uses 38 categories vs. the main site's original 13 issue taxonomy. During review, Maya decided to restructure the entire taxonomy — not just map Seattle into the existing system.
- **Changes applied**:
  - **Renamed**: "Women's Issues" → "Gender Equity", "Health Care/Healthcare" → "Healthcare"
  - **New categories**: Guns & Violence, Immigration, Racism & Social Justice, Reproductive Rights
  - **Eliminated**: "World Issues" — 228 songs had other categories and simply dropped WI; 9 songs were World Issues-only and were manually redistributed (7 → Human & Civil Rights, 2 → War & Peace, 1 → Healthcare). 1 ambiguous song flagged for review.
  - **Discarded**: Grannies, Self-care, Uncategorized, older- revamp? (meta-categories, not issues)
  - **Seattle mapping**: 38 Seattle categories consolidated into the 16 issue categories
- **Final taxonomy (17 categories)**: Business & Economy, Education, Environment & Energy, Gender Equity, Government & Politics, Granny Life, Guns & Violence, Healthcare, Holiday & Celebrations, Human & Civil Rights, Immigration, Labor & Worker Rights, Local Issues, Racism & Social Justice, Reproductive Rights, Soldiers & Veterans, War & Peace
- **Rationale**: The original 13-category system was too coarse. "World Issues" was a catch-all that diluted specificity. Renaming "Women's Issues" to "Gender Equity" better reflects the scope. Splitting out Guns & Violence, Immigration, Racism & Social Justice, and Reproductive Rights from Human & Civil Rights gives songs more precise classification. "Granny Life" was added for the 44 meta-songs (intro songs, birthday songs, recruitment songs) that aren't about a political issue but about being a granny. All 1591 songs now have at least one issue category.
- **Revisit if**: The song librarian identifies additional categories needed, or finds the 17-category system too granular.

## D017 — Main site tags discarded, not mapped to taxonomy

- **Status**: Decided
- **Date**: 2026-04-22
- **Context**: The main song site has 678 unique tags, mostly topic keywords that duplicate the category system (e.g., "fracking" alongside the "Environment & Energy" category).
- **Choice**: Store in `original_tags` for reference. Do not map to any taxonomy during import.
- **Rationale**: The tags add no information beyond what the Issue taxonomy already covers. Importing them would create a junk Songwriter or Tune taxonomy. The actual songwriter and tune data is already captured in custom fields. Seattle tags are different — those are songwriter names and are extracted to the `songwriter` field.
- **Revisit if**: The song librarian identifies tags that carry unique information worth preserving.

## D018 — ACF field group for Songs CPT, registered in plugin code

- **Status**: Decided
- **Date**: 2026-04-22
- **Context**: The Songs CPT needs structured fields for lyrics, tune, songwriter, and other metadata. ACF and WPGraphQL for ACF are both installed on the multisite. Fields can be registered via the ACF GUI (stored in the database) or via `acf_add_local_field_group()` in PHP (stored in code).
- **Options considered**:
  - ACF GUI (easy to edit in WP admin, but field config lives in the database — not version-controlled, lost if database is reset, not portable)
  - `acf_add_local_field_group()` in `irg-core.php` (version-controlled, portable, deploys with the plugin, but requires code changes to modify fields)
- **Choice**: Register via `acf_add_local_field_group()` in the irg-core plugin.
- **Rationale**: The song data model is finalized. Keeping field definitions in code means they're version-controlled, deploy automatically with the plugin, and survive database resets. The ACF GUI still shows them as read-only for reference. All 6 fields have `show_in_graphql => true` for WPGraphQL for ACF exposure. The field group's `graphql_field_name` is `songDetails`, so queries use `song { songDetails { lyrics keyOrStartingNote ... } }`.
- **Fields**: lyrics (wysiwyg), key_or_starting_note (text), youtube_link (url), youtube_link_2 (url), date_written_or_updated (date_picker), source_notes (text).
- **Removed in v2.1.0**: `tune` and `songwriter` ACF text fields. These duplicated the Tune and Songwriter taxonomies already registered on the Songs CPT. Taxonomies are the correct model — they allow filtering/grouping songs by tune or songwriter across the archive. Text fields would have been flat strings with no relational capability. Since fields registered via `acf_add_local_field_group()` can't be removed from the ACF admin UI (they're read-only), the code change was required.
- **Note**: The default WP `editor` was removed from the CPT `supports` array since lyrics now live in the ACF WYSIWYG field. The standard editor would be redundant and confusing for granny editors.
- **Revisit if**: The song librarian needs additional fields, or if ACF GUI editing becomes necessary for non-developer contributors.

## D019 — Issue taxonomy seeded with 17 default terms on activation

- **Status**: Decided
- **Date**: 2026-04-22
- **Context**: The 17 issue categories need to exist in WordPress as taxonomy terms before songs can be imported. Manually creating 17 terms is error-prone.
- **Choice**: The irg-core plugin seeds the 17 Issue terms on first activation via `wp_insert_term()`, guarded by an `irg_issue_terms_seeded` option flag so it only runs once.
- **Terms**: Business & Economy, Education, Elections & Democracy, Environment & Energy, Gender Equity, Government & Power, Granny Life, Guns & Violence, Healthcare, Holiday & Celebrations, Human & Civil Rights, Immigration, Labor & Worker Rights, Local Issues, Racism & Social Justice, Reproductive Rights, Soldiers & Veterans, War & Peace. (Originally seeded with a single "Government & Politics" term; split into "Elections & Democracy" + "Government & Power" per D021.)
- **Rationale**: Seeding from code ensures exact spelling and completeness. The option flag prevents duplicate insertion on subsequent page loads. Terms can still be edited or added via WP admin after seeding.
- **Revisit if**: The taxonomy changes and new terms need to be added (update the array and delete the option flag to re-seed).

## D020 — Temporary song import tool in irg-core plugin

- **Status**: Active (temporary — remove after migration)
- **Date**: 2026-04-22
- **Context**: 1493 songs (1591 minus 98 flagged duplicates) need to be imported from `songs-consolidated.json` into the Songs CPT on the WP multisite. WP's built-in importer can't target a CPT with ACF fields and custom taxonomies.
- **Choice**: Add a temporary admin page (Songs → Import Songs) to irg-core that accepts a JSON file upload and creates Song posts with all fields and taxonomy assignments.
- **Implementation**: The importer reads `songs-consolidated.json`, skips entries where `duplicate_of` is not null, creates each song as a published Song CPT post, sets ACF fields via `update_field()`, and assigns Issue/Songwriter/Gaggle/Tune taxonomy terms (creating new terms as needed). Shows progress during import and a summary at the end. Warns if songs already exist in the database to prevent accidental double-import.
- **Rationale**: A one-time admin tool is simpler and more auditable than a WP-CLI script or direct database manipulation. It runs inside the WP context so all hooks, sanitization, and ACF field registration work correctly. It will be removed from the plugin after migration is verified.
- **Revisit if**: Import fails or needs to be re-run — the safety check warns but allows re-import with a confirmation checkbox.

## D021 — Split "Government & Politics" into "Elections & Democracy" and "Government & Power"

- **Status**: Decided
- **Date**: 2026-04-24
- **Context**: The seeded Issue term "Government & Politics" accumulated 685 songs — by far the largest bucket and too broad to be useful for browsing. The songs split cleanly into two distinct themes: electoral process (voting, voter suppression, gerrymandering, GOTV) and power/accountability (specific politicians, corruption, executive overreach, corporate influence).
- **Choice**: Replace the single "Government & Politics" term with two narrower terms — "Elections & Democracy" and "Government & Power" — and reclassify every song.
- **Method**: Node migration script (`scripts/reclassify-gov-politics.mjs`) using the WP REST API with an Application Password. Keyword-based heuristic over title + lyrics: elections keywords (vote, election, ballot, poll, democracy, register, gerrymander, suffrage) route to E&D; power keywords (politician names, corruption, Congress, Senate, White House, president, impeach, executive order, capitol, oligarch, dictator) route to G&P. Songs matching both get both terms. Songs matching neither default to G&P (broader catch-all for systemic critique).
- **Results**: 688 songs reclassified — 576 in G&P, 181 in E&D (73 in both). Old term deleted. Classification is a quick heuristic; the song librarian can refine assignments later.
- **REST access model**: WP Application Password on Maya's super-admin user, stored in `.env.local` as `WP_USERNAME` / `WP_APP_PASSWORD`, used with HTTP Basic Auth. This is the canonical path for one-off data migrations going forward — no more plugin-reinstall dance for maintenance tasks. Revocable per-app from WP admin → Users → Profile → Application Passwords.
- **Plugin seed list updated**: `irg_seed_issue_terms()` in `irg-core.php` now lists the two new terms in place of the old one. Harmless on existing installs (guarded by the `irg_issue_terms_seeded` option), but correct for any fresh activation.
- **Revisit if**: The song librarian reviews classifications and wants a re-split, or the E&D/G&P boundary needs further subdivision (e.g. separating "specific politicians" from "systemic critique").

## D022 — Plugin self-deploy via REST endpoint

- **Status**: Decided
- **Date**: 2026-04-24
- **Context**: Before v3.2.0, updating the irg-core plugin meant deactivate → delete → reinstall from WP admin. Even after D021 established the REST + App Password pattern for data ops, plugin code updates were still manual. With active development on the plugin (admin columns, subsites endpoint, future features), that friction slowed iteration.
- **Options considered**:
  - Keep manual zip upload in WP admin (status quo — friction).
  - SFTP/SSH deploy (requires server access; varies by host).
  - WP-CLI (requires CLI install on the server).
  - Custom REST endpoint that accepts a zip upload and runs WP's `Plugin_Upgrader`.
- **Choice**: `POST /wp-json/irg/v1/plugin-upload`. Paired with `scripts/deploy-plugin.mjs`, which builds a fresh zip and POSTs it using Basic Auth (the same Application Password from D021).
- **Safeguards**: filename must start with `irg-core` and end in `.zip` (rejects uploads of arbitrary plugins); permission_callback requires `is_super_admin()` on multisite, `install_plugins` otherwise; uses core's `Plugin_Upgrader` with `overwrite_package` so the install is atomic and the plugin is reactivated network-wide afterward.
- **Bootstrap**: v3.2.0 itself had to be uploaded manually once to install the endpoint. Every update after that uses the script. Same story for any future plugin that wants this capability: ship the endpoint in v1, deploy via script from v2.
- **Revisit if**: We need to deploy other plugins or themes, or ship multiple plugin packages. At that point the endpoint should become generic (accept plugin slug parameter) or live in a separate "ops" plugin.

## D023 — Cross-subsite aggregation via per-site GraphQL endpoints

- **Status**: Decided
- **Date**: 2026-04-24
- **Context**: The homepage "On the Streets" section shows the N most-recent Actions (Posts, relabeled per D013) across all gaggle subsites. Subsites are separate WP installs within the multisite; each has its own GraphQL endpoint at `{base}/{slug}/graphql`.
- **Options considered**:
  - Single aggregated GraphQL query via the main site (WPGraphQL does not natively expose other subsites' content in one query; would require custom schema additions with `switch_to_blog()`).
  - WP REST federation plugin (extra dependency, another moving piece).
  - N parallel GraphQL calls, one per subsite, merged and sorted in Astro.
- **Choice**: N parallel calls at build time. `src/lib/actions.ts` uses `Promise.all()` over the subsite list (D024), tags each post with the source gaggle's name, merges, sorts by date, and slices the top N.
- **Rationale**: Simple, transparent, and resilient — any subsite that fails or is offline is logged and skipped (one gaggle's outage never breaks the homepage build). Cost scales linearly with gaggle count, but at 80 subsites × sub-second per request, still fine for static builds.
- **Revisit if**: Parallel fan-out becomes slow (e.g. 200+ subsites, or if we move to incremental rebuilds where each call matters more). At that point, a precomputed aggregation endpoint on the main site would be worth the complexity.

## D024 — Subsite list via auto-discovery endpoint (replaces env var)

- **Status**: Decided
- **Date**: 2026-04-24
- **Context**: Initial implementation of D023 read the subsite list from an env var (`PUBLIC_WP_SUBSITES=portland:Portland,seattle:Seattle`). With ~80 gaggles planned over time, every new gaggle would have required a code/config change and a redeploy — friction that scales badly and duplicates information already in the WP network.
- **Options considered**:
  - Continue with env var / hardcoded list (friction).
  - GraphQL multisite query (WPGraphQL does not natively expose the sites table; would need custom schema additions).
  - Custom REST endpoint that enumerates the WP network.
- **Choice**: `GET /wp-json/irg/v1/subsites` in irg-core v3.3.0, fetched by `src/lib/subsites.ts` at build time. Returns `{id, slug, name, url}` for every non-main, public, non-archived, non-spam, non-deleted site in the network.
- **Rationale**: New gaggle created in Network Admin → appears in the next build automatically. Zero code or config change. Public endpoint — site membership is already discoverable by URL probing, so no new info is exposed. Astro falls back to `[]` (and the UI renders empty-state copy) if the endpoint 404s, so a plugin downgrade or outage never hard-fails the build.
- **Revisit if**: We want to exclude specific subsites from the frontend (e.g. inactive gaggles, internal-only sites) — could add a site-meta flag consulted by the endpoint, or an opt-out via site option.

## D025 — Admin edit links on the frontend (deferred nice-to-have)

- **Status**: Deferred
- **Date**: 2026-04-24
- **Context**: Admins (webgranny, songlibrarian) would benefit from "Edit" links rendered alongside content on the frontend — e.g. below "Read full lyrics →" on the featured song — so they can jump directly to the WP edit screen for whatever they're browsing. The frontend is static (Cloudflare Pages) at a different origin from WP (`cms.raginggrannies.international`), so visibility can't be keyed to WP session cookies without non-trivial glue.
- **Options considered**:
  - **A. Client-side WP session check via CORS.** Add `/wp-json/irg/v1/me` that returns the current user; frontend fetches it with `credentials: "include"` and reveals the edit link if username matches. **Cost**: cookies need `SameSite=None; Secure` to be sent cross-site (today they're `Lax`), which broadens CSRF surface. WP nonces already protect write actions, so impact is small but non-zero.
  - **B. Separate app-password login on the frontend.** UI collects WP username + app password once, stored in `sessionStorage` or `localStorage`. No cookie changes; authenticated via HTTP Basic to `/wp/v2/users/me`. **Cost**: a second "login" UX to maintain, credentials in browser storage.
  - **C. Always-visible edit link.** Everyone sees "Edit"; WP login gates the actual edit page. Functionally safe but defeats the "hide from public" intent.
- **Choice**: Deferred. All three paths work; none feels right for a single edit link in isolation. Revisit when a second admin-only surface appears so the cost of the chosen mechanism is amortized.
- **Revisit if**: The song librarian starts using the frontend heavily and wants inline edit affordances; OR we add another admin-only UI (gaggle page editing, inline action updates); OR Maya's workflow changes such that jumping from public page → edit screen becomes a bottleneck.

## D026 — Songsheet PDFs generated at build time with pdf-lib

- **Status**: Decided
- **Date**: 2026-04-27
- **Context**: Grannies want a clean printable handout for each song — like the photocopied lyric sheets passed around at a singalong. Browser print is fine for a single page someone is already looking at, but a downloadable PDF that survives email forwarding, Google Drive, and Dropbox is the actual artifact a chapter wants to keep.
- **Options considered**:
  - **Browser-side print only** — relies on each granny's browser print dialog and the page's print stylesheet. Inconsistent output, no shareable file.
  - **Print-CSS + "Save as PDF"** — same UX problem. Output varies by browser.
  - **Server-side rendering via headless Chrome** (Puppeteer / Playwright) — high-fidelity HTML→PDF, but heavyweight: native dependencies, slow per-page, fragile in CI (CF Pages can install Chromium but it's flaky).
  - **wkhtmltopdf** — requires native binary; deprecated and unmaintained.
  - **pdf-lib + manual layout** — pure JS, no native deps, deterministic output, embeds custom fonts, works on any platform Astro runs on.
- **Choice**: pdf-lib + `@pdf-lib/fontkit`, with Crimson Text (open-source serif from Google Fonts) embedded as Regular/Bold/Italic/BoldItalic. One PDF per song, written to `public/songsheets/<slug>.pdf` by a prebuild script (`scripts/generate-songsheets.mjs`). Astro copies the directory into `dist/` automatically.
- **Layout**: US-Letter, 1-inch margins, left-aligned. Title 18pt bold, optional `Tune: …` line 11pt italic, blank line, then lyrics 13pt with 18pt line-height. Bold/italic/underline preserved from the WYSIWYG HTML (these are performance marks — strong beats, stress, etc.). Multi-page when needed; metadata block (songwriter · gaggle · issues · date, 9pt gray, middot-separated) at the bottom of the last page. No site branding — clean utility document.
- **HTML parsing**: small bespoke tokenizer in the script. Tracks bold/italic/underline via a tag-depth counter (handles nesting), treats `<p>`/`<div>`/etc. as line breaks, collapses runs of `<br>` to at most two, decodes named + numeric entities. No DOM parser dependency.
- **Performance**: 1490 PDFs in ~145s on a laptop. Under the 60s target the spec asked for, but acceptable — fonts are subset per document (`subset: true`) so each PDF is ~35KB instead of >100KB. Progress logged every 100 songs so a slow run doesn't look stuck.
- **Storage / git**: PDFs (~53MB total) are gitignored via `public/songsheets/`. Regenerated on every build. Fonts (~450KB total) are committed in `src/assets/fonts/` — they're build inputs and should be reproducible without a network fetch.
- **Build hook**: `prebuild` script in package.json runs the generator before `astro build`. Cloudflare Pages picks it up automatically.
- **UI**: song detail page gains a `Download songsheet (PDF)` button in the header CTA cluster, hidden when the song has no lyrics. The pre-existing browser-print button is now labeled "Print page" to disambiguate.
- **Revisit if**: build time on Cloudflare Pages becomes a problem (then: cache PDFs across builds keyed by lyrics hash); OR a granny wants pretty PDFs with branding (then: separate "branded songsheet" output, keep this one as the utility format); OR we want musical notation in PDFs beyond bold/italic/underline.

## D027 — Press clippings via The News API + committed JSON archive

- **Status**: Superseded by D047 (2026-05-04)
- **Date**: 2026-04-27
- **Context**: The Press page ("In the News") shows third-party coverage of the Raging Grannies. Coverage trickles in unpredictably across many small outlets, so manual curation isn't viable; an automated feed is. The page itself is read-mostly and benefits from being part of the static build (fast, cacheable, no runtime API dependency).
- **Options considered**:
  - **WordPress CPT** — would put the data in the multisite admin, but it's third-party content not authored by the Grannies and the value of WP's editorial workflow is low here.
  - **Runtime API call from the browser** — exposes the API key, costs latency, and ties uptime to the third-party.
  - **Runtime API call from a Cloudflare Pages Function** — solves the key-exposure problem but still couples reads to the third-party's uptime.
  - **Build-time fetch into a committed JSON archive** — fast, cacheable, transparent, survives API outages.
- **Choice**: A prebuild script (`scripts/fetch-press.mjs`) hits The News API (`/v1/news/all?search=raging+grannies`), dedupes by normalised title against `data/press-clippings.json` (lowercase + strip punctuation/whitespace), merges, sorts newest-first, and writes back. The Press page (`src/pages/press.astro`) reads the JSON at build time and renders a year-grouped list. Both are wired into npm's `prebuild` chain ahead of the songsheet generator.
- **Failure semantics**: missing API key, network error, non-2xx response, or malformed payload → log a warning and exit 0. The page renders from whatever's already on file. The build never breaks because of a third-party.
- **Archive shape**: `{ title, source, url, published_at (YYYY-MM-DD), snippet, image_url, fetched_at }`. `source` is whatever The News API returns (currently a domain like `cbc.ca`); we may map to friendly names later.
- **Storage**: `data/press-clippings.json` is committed. A daily GitHub Actions workflow (`.github/workflows/fetch-press.yml`) runs the fetch script at 13:17 UTC, commits any new entries via a `press-bot` identity, and pushes — which then triggers Cloudflare Pages to rebuild. Quiet days are no-ops (no diff → no commit). Local runs and ad-hoc `workflow_dispatch` triggers still work the same way.
- **Privacy / cost**: only the public title/URL/snippet are stored. Rate limits and quota are managed by the API key in `THENEWSAPI_KEY` (env var, never committed).
- **UI**: page title "In the News", subtitle "What they're saying about us", year-grouped list when the archive spans multiple years (otherwise a flat list). Each row links to the original article in a new tab; thumbnails render only when `image_url` is present, with `onerror` collapsing the slot if the image 404s. Bulletin design language preserved (clippings-desk top bar, live-feed pill, dark Press Kit aside, foot note). Header nav now reads "In the News" instead of "Press".
- **Revisit if**: rate limits or article volume push us off The News API's free tier (then evaluate NewsAPI.org / GDELT / a custom scraper); OR the build-time fetch starts adding noticeable latency to CF Pages builds (cache by `etag` or `if-modified-since` and only re-fetch when changed); OR we want to add per-source friendly names (build a `domain → publication` map alongside the archive).

## D028 — Press Photos as a dedicated CPT (separate from media library)

- **Status**: Decided
- **Date**: 2026-04-27
- **Context**: Journalists need a curated set of high-resolution photos with consistent metadata (caption, photographer credit, usage rights, category). The WP media library holds *every* image ever uploaded — granny phone snapshots, scanned songbook pages, social-media exports, ACF preview attachments. Surfacing the media library as a "press kit gallery" would dump all of that on visitors.
- **Options considered**:
  - **Tag/category on the media library** — re-use core attachments. Cheap to set up, but every other plugin and editor touches the same pool, so the "press" filter would constantly drift. Also no place for structured fields like usage rights without per-attachment ACF.
  - **Block-based gallery on a single page** — a Gutenberg gallery block handcrafted by an editor. Manual to maintain, lossy on filtering, hard to expose to GraphQL.
  - **Dedicated `press_photo` CPT with ACF fields and its own taxonomy** — clean admin surface (Press Photos sidebar item), structured GraphQL schema, image picker still pulls from the media library so authors aren't re-uploading.
- **Choice**: New CPT `press_photo` registered in irg-core (`graphql_single_name: pressPhoto`, plural `pressPhotos`), gated to the main site. ACF field group "Press Photo Details" with: `photo` (image, return-format `array`, exposes the WP media node + `mediaDetails.sizes`), `photographer_credit` (text), `caption` (textarea), `usage_rights` (text, default copy: "Free for editorial use with credit to the International Raging Grannies"). Hierarchical taxonomy `photo_category` seeded with **Rally · Performance · Portrait · Historical · Media**.
- **GraphQL shape**: each photo exposes `pressPhotoDetails.photo.node` with `sourceUrl`, `altText`, and `mediaDetails.sizes[]`. The Astro page picks the smallest registered size ≥ 600px wide as the grid thumbnail and links to the full `sourceUrl` for download. Categories (with `count`) come from `photoCategories(first:100, where:{hideEmpty:true})`.
- **UI**: `src/pages/photos.astro` — hero with kicker/title/dek, single-select category chip bar (computed from `photoCategories`), 3/2/1 column grid with explicit `aspect-ratio: 3/2` so cards don't reflow as images load, lightbox with the full image, caption, credit, usage rights, and a prominent "Download high-res" button (`<a download>` to the original URL). `loading="lazy" decoding="async"` on every thumb so the grid stays cheap. Build is resilient — a GraphQL failure or zero-photo archive renders the empty state instead of breaking. Header nav: "Photos" sits next to "In the News".
- **Why CPT, not media library taxonomy**: the editorial workflow is "select from the media library and add metadata", not "tag every upload". The CPT post is the curation; the image is just an attachment it points at. This keeps the admin sidebar tidy and the GraphQL surface small.
- **Revisit if**: the gallery exceeds ~50 photos (then add pagination on the page) or ~200 (then move to a virtualised grid); OR usage-rights variants proliferate (then promote `usage_rights` to a taxonomy or enum); OR we want per-photo licence URLs.

## D029 — Find a Gaggle: Leaflet + CartoDB Positron + committed JSON

- **Status**: Decided
- **Date**: 2026-04-27
- **Context**: The "Find a Gaggle" page needs a map of the ~80 gaggles across North America (and a handful elsewhere), plus a scannable directory below it. Data is curated by hand — Maya pulls coordinates from a sourced list rather than querying a third-party geocoder at build time. The page is a destination but isn't a critical performance path; clean visuals and zero ongoing cost matter more than slick vendor features.
- **Options considered**:
  - **Google Maps / Mapbox** — slick tiles, geocoder, clustering. Both want an API key, both meter usage, both add a vendor dependency. Overkill for ~80 static markers.
  - **Leaflet + OpenStreetMap default tiles** — no key, free, fine, but the default OSM colour scheme competes with markers.
  - **Leaflet + CartoDB Positron** — same engine as above, muted/desaturated tile theme that lets red markers pop. Free, no key, OSM data.
- **Choice**: **Leaflet** (npm dep, page-scoped — only loaded on `/find-a-gaggle/`, not site-wide) with **CartoDB Positron** tiles. Markers are `L.circleMarker`s in the site's red (`#E22A2C`) — avoids the bundled-asset hassle of Leaflet's PNG marker icons and keeps every gaggle visually equal (no special "founding gaggle" treatment for Victoria; nicknames not displayed even when present in the JSON).
- **Data source**: `data/gaggle-locations.json`. Shape: `{ name, region, country, lat, lng, founding?, aka? }`. The two optional fields exist in the data but are intentionally ignored by the page so the map stays uniform. `country` and `region` drive the directory grouping below the map (USA first, Canada second, others alphabetical; regions A→Z within each).
- **Page composition**: Bulletin-style hero with kicker / display title / dynamic count, full-bleed map (560px desktop / 340px mobile, scroll-wheel zoom on, world-copy-jump, popups themed in the site palette), directory grid (3/2/1 cols by viewport), dark CTA card linking to `/start-a-gaggle/`. Header nav: "Find a Gaggle" and "Start One" links wired up.
- **Privacy**: popups never embed contact info — they point at `/contact/` instead. Per-gaggle emails/phone numbers stay out of the static bundle.
- **Empty-state behaviour**: missing/invalid `gaggle-locations.json` → hero subtitle softens, directory shows a "loading" placeholder, map renders an empty world view. Build never fails.
- **Revisit if**: marker count grows past ~150 and visual overlap forces clustering (add `leaflet.markercluster`); OR Maya wants editor-managed locations (promote to a `gaggle` CPT in irg-core with a location ACF field — already on the open-questions list); OR we add per-gaggle pages/links and the popup needs an outbound URL.

## D030 — Contact form via WP endpoint + Cloudflare Turnstile

- **Status**: Decided
- **Date**: 2026-04-27
- **Context**: The Contact page needed a form (name / email / message) that visitors can use without their own email client. Spam protection is non-negotiable — public web forms attract bots within hours. The site is static (Cloudflare Pages), so the form needs a server-side handler somewhere.
- **Options considered**:
  - **Cloudflare Pages Function → transactional email service (Resend / Mailgun)**. Clean and modern. Adds a second vendor (email API) with sending-domain verification, DMARC config, free-tier limits.
  - **Pages Function → WP endpoint**. A double hop with no real benefit since CORS lets the form talk to WP directly.
  - **Direct form → WP REST endpoint** (the `wp_mail()` path). Single hop. Reuses Nixihost's existing outbound mail. No new vendor.
  - **Third-party form host (Formspree / Web3Forms)**. Branded "Powered by" footers; vendor lock-in; less control over the message body and sender.
- **Choice**: form posts directly to `POST /wp-json/irg/v1/contact` (irg-core v3.7.0) with `Content-Type: application/x-www-form-urlencoded` (a "simple" CORS request, no preflight). The plugin endpoint validates length / email shape, runs Cloudflare Turnstile server-side via the siteverify API, sanitises input, and forwards to `press@raginggrannies.org` via `wp_mail()` with the visitor's address as `Reply-To`. Returns JSON; the page handles success / error inline.
- **Spam protection** (belt + suspenders):
  - **Cloudflare Turnstile** widget renders client-side; visitor solves the (usually invisible) challenge; Turnstile returns a token; WP verifies the token server-side against `https://challenges.cloudflare.com/turnstile/v0/siteverify` using `IRG_TURNSTILE_SECRET` (defined in wp-config.php). Free, replaces reCAPTCHA, native to the CF account we already have.
  - **Honeypot field** (visually hidden, screen-reader hidden, `tabindex=-1`) — bots that fill every input get caught. The endpoint silently returns `{ ok: true }` so they don't learn which field tripped them.
  - **Hard limits**: name ≤ 200 chars, message ≤ 8000 chars; `is_email()` validation; `sanitize_text_field()` on name; `wp_strip_all_tags()` on subject; trimmed message body.
- **CORS**: `rest_pre_serve_request` filter sets `Access-Control-Allow-Origin` only for the three eventual public domains (`raginggrannies.org`, `raginggrannies.net`, `raginggrannies.international`, with and without `www.`), `*.pages.dev` previews, and `localhost`. Other origins get no header (browser blocks the response).
- **Destination**: hardcoded `IRG_CONTACT_TO = press@raginggrannies.org`. Prevents the endpoint from being repurposed as an open relay. When per-topic addresses arrive, the constant becomes a routing table.
- **Setup checklist** (one-time, by Maya):
  1. Cloudflare dashboard → Turnstile → Add site (domains: `raginggrannies.org`, plus the `*.pages.dev` preview and `localhost` for dev). Mode: Managed.
  2. Copy the **site key** into `PUBLIC_TURNSTILE_SITEKEY` in `.env.local` and Cloudflare Pages → project → Settings → Environment Variables.
  3. Copy the **secret** into `wp-config.php` on the IRG Nixihost: `define( 'IRG_TURNSTILE_SECRET', '...' );`. Add it under the existing constants, before the `ABSPATH` block.
  4. Redeploy (push triggers CF rebuild; WP picks up the constant on next request).
- **Graceful degradation**: if `PUBLIC_TURNSTILE_SITEKEY` is unset at build time, the page renders a friendly fallback ("the form is being set up — email us at press@") instead of a broken widget. Same fallback if the WP URL isn't configured. Once both are present, the form appears.
- **Revisit if**: spam volume punches through Turnstile (add rate-limiting per IP / Origin); OR we want delivery confirmation / queueing (move to Resend + Cloudflare Queues); OR we need separate destinations per topic (introduce a `category` field on the form and route in the WP endpoint).

## D031 — The Bulletin Local: WP theme for gaggle subsites

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: Each gaggle subsite on the multisite needed a frontend. Per the project framing, WP is primarily a backend (Astro is the public face), but subsites still render via WP — they're admin-managed by individual gaggles, and the public hits them at `<gaggle>.raginggrannies.org` (eventually) or `cms.raginggrannies.international/<gaggle>` (now). A theme is required even if the public never sees the WP frontend on the main site.
- **Options considered**:
  - **Existing third-party theme** (Astra / Twenty Twenty-Four). Faster to ship; bloated, design-incoherent with the Astro main site, hard to lock down.
  - **Child theme of an existing theme**. Smaller surface than full custom, but still tied to the parent's update cadence and design vocabulary.
  - **Standalone custom theme** mirroring the Astro design tokens. Full control; design coherence with the public site; small surface to maintain.
- **Choice**: Standalone custom theme called **The Bulletin Local**. Authored by Lingua Ink Media. Vanilla CSS + vanilla JS (no preprocessors, no JS frameworks). Tokens mirror `src/styles/global.css` exactly: paper `#FAF3E3`, ink `#2A1847`, ink-soft `#57228C`, red `#E22A2C`, on-dark `#F5F4E6`, plus Rum Raisin (display) and Nunito Sans (body) Google Fonts. 1400px outer header / 1200px footer container width matches BaseLayout. Theme registers no widgets, no Customizer panel, no admin chrome — a single Appearance → Gaggle Settings page with three knobs (hero image, YouTube channel URL, tagline) plus the toggle from D034.
- **Templates**: `front-page.php` (two-column polaroid hero + Recent Actions grid), `home.php` and `archive.php` (Actions list with placeholder fallback for posts without featured images), `single.php` (Action with floated polaroid feature), `page.php` (generic), `page-photos.php` (auto-gallery from inline + featured images), `page-videos.php` (YouTube channel CTA), `page-contact.php` (slug-derived recipient), `404.php`, plus the songs templates added in D034.
- **WP page-content support**: alignment classes (`alignright`, `alignleft`, `aligncenter`, `alignnone`) styled per Classic Editor expectations; `.wp-caption` / `.wp-caption-text`; a user-friendly `.polaroid` image class so editors can wrap any embedded image in the polaroid frame just by typing "polaroid" into the Image CSS Class field.
- **Activation seeder** (`tbl_seed_default_content`): creates Home / About / Photos / Videos / Contact / Actions pages with templates assigned, sets static-front + posts-page, sets `/%postname%/` permalinks, seeds one sample Action post. Idempotent — re-activation doesn't duplicate.
- **Brand block**: header shows the gaggle locator (subsite WP title) on top in Rum Raisin 22px and "Raging Grannies" below in Rum Raisin 22px; the inverse of the Astro main site (where "Raging Grannies" leads). The flip reflects identity primacy on subsites.
- **Inline-SVG logos**: `logo-cropped.svg` and `logo-full.svg` embedded inline (no `fill` attribute on the root) so CSS controls colour per location — ink in the header, on-dark in the footer.
- **Cache-busting on bundled images**: `tbl_hero_image_url()` and `tbl_action_feature_url()` append `?v=<TBL_VERSION>` to default image URLs. LiteSpeed serves bundled assets with a 7-day public cache; without versioning, swapping the bundled image leaves browsers stuck on the old copy until expiry. Theme version bump invalidates.
- **Revisit if**: subsites need richer admin tooling (e.g. a member directory, event calendar) that doesn't fit in three theme options — promote to a separate plugin or a per-feature CPT in irg-core; OR a gaggle wants visual customization beyond the hero image and tagline (introduce a Customizer panel keyed on `theme_mod`); OR Cloudflare Pages takes over subsite rendering too (then the theme becomes a per-route SSR target instead of a public-facing theme).

## D032 — Theme self-deploy via REST endpoint

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: Iterating on The Bulletin Local theme through the WP admin's "Upload Theme" flow is slow — package, browse, upload, install, activate, four clicks per cycle. The plugin self-deploy pattern (D022) already exists. Theme deployment should mirror it.
- **Options considered**:
  - **Continue uploading via WP admin Themes → Add New**. Works for every WP install; manual per iteration.
  - **rsync / SSH directly to the Nixihost theme directory**. Bypasses WP entirely; no activation, no version-aware update; requires SSH config we don't otherwise rely on.
  - **REST endpoint paralleling the plugin one** (`POST /wp-json/irg/v1/theme-upload`). Reuses the application-password auth already in `.env.local`; reuses `WP_Upgrader` so installs go through WP's normal lifecycle (zip extract, file copy, version registration, network-enable for multisite).
- **Choice**: Add `irg_register_theme_deploy_endpoint()` to irg-core (3.9.0). The endpoint:
  - Accepts a multipart `theme` field; rejects any zip whose filename doesn't start with `the-bulletin-local`
  - Permission gate: `is_super_admin()` on multisite, otherwise `current_user_can('install_themes')`
  - Uses `Theme_Upgrader::install` with `overwrite_package: true` so re-deploys replace the installed theme cleanly
  - On multisite, network-enables the theme by adding it to the `allowedthemes` site option — does NOT activate it on any subsite (active theme stays as set)
  - Returns `{ ok, name, stylesheet, version, network_enabled }` for the deploy script to log
- **Client**: `scripts/deploy-theme.mjs` mirrors `scripts/deploy-plugin.mjs`. Reads `.env.local`, zips `wp-theme/the-bulletin-local`, POSTs to the endpoint. Single command per iteration: `node scripts/deploy-theme.mjs`.
- **First-install caveat**: the endpoint can't bootstrap itself. The very first theme install needs a manual upload via Network Admin → Themes → Add New. Same chicken-and-egg as D022.
- **Auto-flush on version change**: WP's `after_switch_theme` doesn't fire on a theme *update*, only first activation. Without this hook, a deploy that adds a new rewrite rule (e.g. D035's `/songs/<slug>/`) wouldn't take effect until something else flushed (Settings → Permalinks → Save). The theme stores its active version in a regular option (`tbl_active_version`); when `init` runs and the stored version differs, rewrite rules are flushed and the option is updated. One-shot per version bump.
- **Revisit if**: we need staging/preview environments for theme changes (then add a `?dry-run` mode that extracts to a sibling directory); OR the upload zip exceeds Nixihost's PHP `upload_max_filesize` (split assets out, or move large media to Cloudflare R2).

## D033 — Subsite WP site title = locator only; AKA assembled in code

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: A gaggle's identity has two parts: a locator (e.g. "San Jose & Santa Clara County") and the network mark ("Raging Grannies"). Both surface in the subsite's chrome — the header brand, the hero title, the footer wordmark, the canonical URL on the central library, the contact-email derivation. WordPress only stores one `blogname` per subsite. We could store the full AKA there (and split off "Raging Grannies" wherever the locator alone is needed), or store just the locator (and append "Raging Grannies" wherever the AKA is needed).
- **Options considered**:
  - **`blogname` = full AKA** (e.g. "San Jose & Santa Clara County Raging Grannies"). Some references to the gaggle naturally read as the AKA; storing it that way makes those reads trivial. But splitting off the suffix for header sub-lines, song-library filter URLs, etc. requires a string-strip that breaks if any gaggle's title doesn't include "Raging Grannies".
  - **`blogname` = locator only** (e.g. "San Jose & Santa Clara County"). The "Raging Grannies" suffix is constant network typography that the theme controls. No string parsing. WP admin chrome (browser tab, Network Admin sidebar) shows the locator alone — slightly terser but clearer-than-truncated.
- **Choice**: locator only. `tbl_gaggle_name()` returns the bare site title; `tbl_gaggle_aka()` appends " Raging Grannies" wherever the AKA is needed (hero title with the suffix coloured red, footer wordmark, copyright, central-library filter URL).
- **Slug match for cross-site queries**: the gaggle taxonomy term slug (`seattle`) auto-generated by WP from the term name (`Seattle`) is canonically the same as the subsite's URL path slug. The theme's `tbl_gaggle_slug()` derives from `get_blog_details()->path`. The cross-site song query (D034) matches on this slug. If a gaggle's term name is later edited and the slug diverges from the subsite path, Gaggle Settings shows "Detected: 0 songs" — surfacing the mismatch immediately rather than failing silently.
- **Revisit if**: a gaggle wants a display name that isn't `<locator> Raging Grannies` exactly (some chapters use "RG&lt;Locator&gt;" or other compositions) — then add an explicit "display AKA" field to Gaggle Settings and have `tbl_gaggle_aka()` prefer it.

## D034 — Subsite-local song archive: cross-site cached via site option

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: Songs live exclusively on the multisite's main site as a `song` CPT (D003), gated `is_main_site()`. Some gaggles (Seattle first) used songs as their primary content on their old WordPress sites and want a list of "their" songs on the subsite — not a search portal, but a browsable archive of songs tagged with their gaggle term. The architecture's default is to send subsite users to the central Astro library at `raginggrannies.org/songs/?gaggle=<slug>`, but Seattle's grannies expect songs on their own site.
- **Options considered**:
  - **No subsite list; Songs pill always sends to the central library**. Architecturally cleanest — one place for songs, no duplication. Mismatched with Seattle's expectation; deters opt-in gaggles.
  - **Replicate the song CPT and sync to subsites**. WordPress doesn't natively share post types across sites, so this would mean nightly imports or live cross-site writes. Heavy, fragile, and duplicates the canonical source.
  - **Cross-site query at runtime, cached on the subsite** (per-blog transient). Subsite reads use `switch_to_blog( get_main_site_id() )`, query, cache as a transient. Works, but transients are per-blog — busting on a song save (which fires in main-site context) requires switching to every opted-in subsite to delete its transient.
  - **Cross-site query at runtime, cached as a network site option** (option 4). Site options are network-wide. Subsite reads with `get_site_option()` skip `switch_to_blog` entirely on cache hits. Bust path runs in main-site context (where the save hooks fire) and writes the same site option — no switching needed in either direction.
- **Choice**: option 4. `irg_get_subsite_songs( $gaggle_slug )` in irg-core checks the site option `irg_subsite_songs_<slug>_v7`. Miss → switch to main site, force-register the CPT and gaggle taxonomy if they aren't (init fired earlier in subsite context where the guards returned early), build the array, write to the site option, restore. Build returns plain arrays (no `WP_Post`s leaked across blog context): title, slug, year, songwriters[], tunes[], issues[], lyrics, lyrics_excerpt, youtube_link, detail_url. **Empty results are NOT cached** — a transient registration glitch becomes a one-call surprise rather than a sticky-empty state until something invalidates.
- **Cache invalidation** (all hooks fire in main-site context): `save_post_song`, `before_delete_post` (when post type is `song`), `set_object_terms` (when taxonomy is `gaggle` — covers Quick Edit term reassignment), `transition_post_status` (publish/draft/trash). The term-change buster walks every gaggle slug and clears each (~80 site options, all small) since the hook only knows the new terms, not the old.
- **Per-subsite opt-in**: `show_local_songs` boolean in `tbl_options`. Renders a Gaggle Settings checkbox that displays the detected song count for the subsite's slug — instant feedback that the slug match is working. When the toggle is on, `tbl_songs_url()` (which the header pill uses) returns `home_url('/songs/')` instead of the central-library URL; otherwise the pill behaves as before.
- **Page lifecycle**: when the toggle is on at any settings save, `tbl_ensure_page('songs', 'Songs', '', 'page-songs.php')` runs. Idempotent. Toggling off does NOT delete the page — admins who customised the intro shouldn't lose it.
- **Cache key version**: bumping the suffix (`_v1` → `_v7` over the lifetime of this feature) is the canonical way to invalidate the entire cache surface. Old keys orphan in `wp_sitemeta`; small, harmless.
- **Revisit if**: opted-in gaggle count grows past ~10 (the term-change broad invalidation walks all gaggles; consider tracking which slugs are actually subscribed and only busting those); OR a gaggle wants live filtering / search on its local list (the cache delivers full content; build it as a client-side filter UI in `page-songs.php`); OR site-option size becomes a concern at 1000+ songs per gaggle (move to a custom DB table).

## D035 — Subsite single-song page: cross-site detail without duplicate Astro

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: Once a gaggle opts into D034, clicking a song row needs to land somewhere. The first-cut implementation pointed each row at the canonical Astro library URL (`raginggrannies.org/songs/<slug>/`). Seattle's mental model — songs live on their own site — meant they expected a song detail page on the subsite, not an outbound jump.
- **Options considered**:
  - **Link out to the Astro library** (initial implementation). One detail rendering on the network. No duplication. Mismatched with Seattle's expectation.
  - **Build a full-feature single-song template on the subsite** mirroring everything Astro's `/songs/[slug].astro` does (lyrics, related songs, YouTube embed, songsheet PDF download, share links). Maintenance burden doubles; SEO duplication.
  - **Render a focused single-song page on the subsite** with the basics, and link out to the Astro library for the features Astro is canonical for (songsheet PDF, taxonomy filter exploration). Best of both: subsite stays the surface, Astro stays canonical for ancillary features.
- **Choice**: option 3. New rewrite rule on every subsite for `^songs/([^/]+)/?$` → query var `tbl_song_slug` → `single-song.php` template (via `template_include` filter). The rule is registered unconditionally; the template falls back to a "song not found / browse central library" CTA when the toggle is off or the slug doesn't resolve.
- **Single-song renders**: title, full lyrics (cached in D034), metadata block — Year (display only), Songwriter (each linked to `raginggrannies.org/songs/?songwriter=<name>`), Tune (linked to `?tune=`), Categories (linked chips → `?issue=`). YouTube embed if `youtube_link` ACF field is set. Bottom aside has three links: "Printable songsheet available on the international site →" (`/songsheets/<slug>.pdf`), "View this song in the central library →" (the canonical detail URL), and "← Back to all songs" (subsite-local list).
- **Songsheet PDFs stay on Astro**: D026's build-time PDF generation already runs there; replicating it on the subsite would mean either bundling pdf-lib into the WP plugin (a Node dependency in PHP space) or re-uploading PDFs to each subsite's media library on every regeneration. Linking out is the right granularity.
- **Songwriter URL filter on Astro**: D034's metadata links promised `?songwriter=` filtering, which the Astro library didn't have. Added it as part of this work — case-insensitive canonicalization (D036 pattern), removable chip in the active filters, included in the reset-all behaviour. No songwriter dropdown is added to the library UI; only URL-driven filtering for now.
- **Lyrics cache shape**: the by-slug helper (`irg_get_subsite_song_by_slug`) walks the cached array — no extra cross-site call. Cost: one O(n) array scan per detail-page hit, where n is the gaggle's song count. Cheap at Seattle's 454.
- **No canonical link tag** on the subsite single-song. Letting Google decide between the subsite version and the central library version means subsite pages can rank for "song lyrics" queries (which Seattle wants), without an explicit duplicate-content suppression.
- **Revisit if**: SEO duplicate-content turns out to dilute either side's ranking (then add `<link rel="canonical">` pointing at the Astro version); OR a gaggle wants the songsheet PDF rendered locally (then either bundle pdf-lib via PHP or proxy the Astro PDF through a subsite endpoint); OR songs need richer detail features (related songs, comments, history) — at that point the full Astro template should ship locally as well.

## D036 — Astro song library: case-insensitive URL-param canonicalization

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: The Astro library at `/songs/` exposes filterable URL params: `?gaggle=`, `?issue=`, `?tune=`, `?songwriter=`. The original implementation stored the param value verbatim and compared it strictly against the song's term name (`s.g === filters.gaggle`). Term names are canonical-cased (e.g. "Portland", "War & Peace"). Subsite Songs pills pass slug-form params (e.g. `?gaggle=portland`), and humans hand-typing URLs can't be expected to match casing exactly. Strict equality returned 0 results for any non-exact param value, while `rebuildDropdown` prepended the unmatched value as if it had selected something — confusing UX.
- **Options considered**:
  - **Make every link build its URL from the canonical term name**. Works only if every link site has access to the term-name list. Subsite pills only know the gaggle slug.
  - **Lowercase normalize on both sides**. `s.g.toLowerCase() === filters.gaggle.toLowerCase()`. Easy, but `select.value` setting (which drives the dropdown) wouldn't match an option unless the option's value also lowercases — which would break the dropdown's display label.
  - **Canonicalize on init**: read the URL param, look it up case-insensitively against the actual term names in the songs data, replace the filter state with the canonical-cased term. From then on, strict equality and `select.value` behave correctly.
- **Choice**: canonicalize on init. A small `canonicalize(rawValues, requested)` helper does the lookup. Applied to all four URL params (`issue`, `tune`, `gaggle`, `songwriter`). If the requested value matches no term name, the filter state keeps the requested value verbatim — UI then shows the unmatched term as an active chip, surfacing the typo to the user rather than silently failing.
- **Subsite implications**: `tbl_songs_url()` passes the lowercase slug (`?gaggle=portland`); the Astro page resolves to "Portland" automatically. No coordination needed between the slug naming and the term-name casing.
- **Revisit if**: term names start having genuine case-significant variations (unlikely for English taxonomy terms); OR we add a fifth filterable param (then refactor the four near-identical canonicalize blocks into a loop).

## D037 — Migrated lyrics sanitization deferred to content level

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: The migrated `lyrics` ACF field for songs carries several classes of broken markup from older WordPress installs: orphan tag-fragments like `br>` and `em>` (the leading `<` was lost in a prior sanitization), malformed pseudo-tags like `<Chorus:</` (a section label that got angle-bracketed by mistake), and mixed entity encoding where `>` is sometimes `&gt;` while surrounding markup is literal. These render as visible junk on the subsite single-song template (D035), e.g. `<em>br>By Jo-Hanna Read</em>` showing "br>By Jo-Hanna Read" italicised.
- **Options considered**:
  - **Display-time regex sanitization** in `irg_build_subsite_songs_cache`. Cheap to ship; tried multiple iterations (`\b/?(em|...)>` → `(?<!<)/?(em|...)>` → `(?<![</])(em|...)(?:>|&gt;)` plus several companion passes for malformed `<Chorus:</`). Each pass surfaced new edge cases — over-stripping tag names inside valid `</em>` tags (consumed lyrics until the next `>`), missing entity-encoded trailers, etc.
  - **DOM-based parse and rebuild**. Use `DOMDocument` to parse, walk, rewrite. Heavier; still requires deciding what malformed input means. Doesn't help if the source field itself has lost information.
  - **Defer to content-level cleanup**. Display the lyrics field as-stored; let the song librarian (Jo-Hanna) clean up the source field over time. Subsite template uses `white-space: pre-wrap` on `.tbl-song-lyrics` so the plain-text `\n` breaks render as line breaks; tags that survive (`<em>`, `<strong>`) format normally; orphan fragments display as visible text.
- **Choice**: defer. The cache builder no longer attempts any lyric sanitization. `irg_clean_lyrics_fragments()` was removed entirely. Cache key bumped to `_v7` to force a clean rebuild. The subsite single-song template renders the lyrics field via `wp_kses_post()` for safety, with `white-space: pre-wrap` preserving the original line structure.
- **Why deferred**: every regex pass had a counter-example. The migrated content is heterogeneous (different songs went through different historical migrations) and the only path to clean lyrics is per-song manual cleanup in the WP admin's ACF rich-text editor. Jo-Hanna has agreed to take on the Song Librarian role and will edit the field directly. Display-time fixes added complexity and bugs while papering over the real problem.
- **Revisit if**: Jo-Hanna's content cleanup stalls and a large fraction of songs still have visible orphan fragments after several months (then ship a one-off CLI / WP-CLI migration that cleans the field in-place rather than at display-time); OR a content-level "clean lyrics" indicator gets added (an ACF field flag that says "this song's lyrics have been cleaned") so we can stage the cutover by song.

## D038 — Adopt JSON-LD strategy across both Astro and the Bulletin Local theme

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: AI agents (Google AI Overviews, Bing, ChatGPT, Perplexity) interpret structured data via JSON-LD `<script type="application/ld+json">` blocks. The IRG ecosystem renders content on two surfaces: the Astro central library (raginggrannies.org) and per-gaggle subsites running The Bulletin Local theme (D031). Schema must be emitted on both for consistent agent interpretation, since both surfaces get indexed by Google. Part of the agent-layer architecture (full design in `docs/architecture/agent-layer.md`, gitignored).
- **Options considered**:
  - **Microdata or RDFa instead of JSON-LD** — Google explicitly prefers JSON-LD; harder to maintain; no benefit.
  - **Server-side schema injection via WP plugin** (e.g. Yoast) — would only help the WP frontend, which isn't the public surface for the central library and adds plugin sprawl.
  - **JSON-LD on Astro only** — leaves subsite content (gaggle pages, Seattle's local song archive from D034) without structured data. Subsite-rendered pages still get indexed by Google.
  - **JSON-LD on both Astro and the Bulletin Local theme**.
- **Choice**: emit per-page-type JSON-LD on both surfaces.
  - **Astro**: new `<JsonLd>` component injected through `BaseLayout.astro` via a `structuredData?: object | object[]` prop. Schema types per page: `Organization` (root) + `WebSite` with `SearchAction` on all pages; `MusicComposition` on `songs/[slug].astro`; `FAQPage` on `faq.astro` and `start-a-gaggle.astro`; `ItemList` of `Organization` on `find-a-gaggle.astro`; `Event` / `Article` / `NewsArticle` on action pages depending on whether the page is an upcoming event vs a dispatch.
  - **Bulletin Local theme**: new `tbl_emit_jsonld()` helper in `functions.php`. Called from `front-page.php` (Organization for the local gaggle as a chapter of the parent IRG Organization, plus ItemList of recent Actions), `single.php` (NewsArticle/Article), and `single-song.php` (MusicComposition with `mainEntityOfPage` pointing at the central library canonical URL — D042).
- **Trade-off**: schema generation logic exists in two places (Astro TypeScript + WP PHP) and must stay in sync. Mirroring the shape of `<JsonLd>` and `tbl_emit_jsonld()` keeps drift visible; theme version bumps catch missed updates.
- **WP-side delivery**: theme bumps a minor version; ships via existing `node scripts/deploy-theme.mjs` (D032).
- **Revisit if**: a third-party plugin lands that handles JSON-LD across multisite cleanly; OR Google deprecates JSON-LD (unlikely — schema.org evolves slowly and JSON-LD is mature).

## D039 — Publish llms.txt despite low adoption

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: `llms.txt` is a proposed convention for sites to declare a curated agent-readable index. A 90-day study of AI bot traffic in 2025 found roughly 0.1% of crawls actually fetch `llms.txt` — Anthropic, OpenAI, and Perplexity all host their own for dev docs but don't aggressively crawl others'. Low adoption raises the question of whether shipping it is worth the complexity at all.
- **Options considered**:
  - **Skip `llms.txt` entirely** — 0.1% adoption suggests it's a dead letter. JSON-LD (D038) and the L2 markdown twins (D040) do the heavy lifting for agent discovery anyway.
  - **Ship a single monolithic `llms-full.txt` with all lyrics** — creates an effortless bulk-extraction surface for the entire 1,500-song corpus. Lyrics are better served per-page via L2 content negotiation or MCP (D042) where rate-limiting applies.
  - **Ship `llms.txt` only** (curated index, no full corpus).
  - **Ship both**: `llms.txt` (~5–8 KB curated dispatcher) AND `llms-full.txt` (~80–100 KB, organizational pages full text + song metadata only — not lyrics).
- **Choice**: ship both. Generated by `scripts/generate-llms-txt.mjs` at prebuild, reading `data/songs-consolidated.json` and walking `src/pages/*.astro` frontmatter. `llms.txt` excludes individual song links (1,493 entries is noise), archive pages, admin routes; includes a pointer to the MCP endpoint. `llms-full.txt` excludes lyrics — agents fetch individual song pages via L2 when they need them.
- **Rationale**: cost is one prebuild script + two static files. The real value sits elsewhere (D038, D040, D042); `llms.txt` is a marker of intent. If adoption picks up, we're already there. Excluding lyrics from `llms-full.txt` denies bulk-corpus extraction without rate limits.
- **Revisit if**: `llms.txt` gets formal IETF / W3C adoption (then likely add more curation effort); OR it quietly deprecates (then remove the prebuild step — neither outcome breaks anything).

## D040 — Static-twin markdown over per-request SSR for content negotiation

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: AI agents interpret markdown roughly 3× more token-efficiently than HTML. The `Accept: text/markdown` HTTP header is the spec-compliant signal for agents to request markdown over HTML. Astro is configured for static output; adding global SSR is out of scope (loses the Cloudflare Pages static-asset cache, broadens attack surface, breaks the zero-runtime-cost model).
- **Options considered**:
  - **Switch Astro to SSR globally and content-negotiate per request** — loses static-asset caching for everyone; large architectural shift for one feature.
  - **Cloudflare "Markdown for Agents"** (built-in HTML→MD conversion) — requires Cloudflare Pro plan ($20/mo). Recurring cost that doesn't fit the nonprofit budget.
  - **Workers AI `toMarkdown()` runtime conversion** — adds latency, requires Workers Paid plan ($5/mo), HTML→markdown conversion is lossy compared to generating from source data.
  - **Build-time `.md` twins for every public route + a thin Cloudflare Pages Function that 302s `Accept: text/markdown` requests to the `.md` URL**.
- **Choice**: build-time `.md` twins. `scripts/generate-md-twins.mjs` writes `public/songs/<slug>.md`, `public/about.md`, etc., generated **from the WPGraphQL response directly** (not by converting rendered HTML — avoids the lossy round-trip). Single Pages Function at `functions/_middleware.ts` does only the `Accept` sniff; failure mode falls through to static HTML. Each `.md` file is also directly addressable via URL fallback (`/songs/frack-attack.md`) — as of early 2026, only ~50% of tested AI agents request `text/markdown` by default, so the URL fallback covers the rest.
- **Scope**: central Astro library only in v1. Subsite content rendered by The Bulletin Local theme (per-gaggle pages, subsite-local song archives from D034) is excluded from the twin pattern — twins for WP-rendered pages would need a separate generation pipeline. Agents wanting subsite content fetch the HTML directly. Revisit if subsites ever move to Astro.
- **Cost**: ~1,500 .md files × ~5 KB ≈ 8 MB extra static asset storage; well under Cloudflare Pages 20k-file / 25 MB-asset limits. Pages Function invocations free under 100k req/day.
- **Revisit if**: Cloudflare drops the Pro plan requirement on built-in markdown conversion, OR a sufficiently-good free runtime alternative ships; OR subsites move to Astro and the central-library scope expands; OR the corpus crosses the 20k-file Pages limit (push twins to R2).

## D041 — Build-time RAG with in-memory vectors over runtime vector DB; embedding prebuild ships at L4 time

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: Both the MCP server (D042) and the "Ask the website" chatbot (D045) need semantic search over IRG's content. The corpus is small: ~1,493 songs (full lyrics + metadata) + ~60 gaggle pages once the multisite is fully populated + a dozen organizational pages — call it ~2,000 chunks at full rollout. Chunk count drives the search infrastructure decision.
- **Options considered**:
  - **Full vector database** (Pinecone, Cloudflare Vectorize, Weaviate). Adds a dependency, sync requirement, ongoing cost. Pinecone's free tier auto-deletes after 7 days inactive — risky for a low-traffic site.
  - **In-memory cosine similarity** in the Pages Function / Worker, embeddings file committed to repo. Trivially fast at ~2,000 vectors.
  - **Pure LLM with no RAG, entire corpus in context** — 2.7 MB JSON ≈ 700k tokens, way over Haiku's 200k context window and ~$0.70/query. Non-starter.
- **Choice**: in-memory cosine similarity. Embeddings stored in `data/embeddings.json` (~2,000 chunks × 384 dims × 4 bytes ≈ 3 MB) and committed to the repo. Generated by `scripts/build-rag-index.mjs` at prebuild. Provider TBD at implementation time: Cloudflare Workers AI `@cf/baai/bge-small-en-v1.5` or Voyage `voyage-3.5-lite`, both ~$0.02/M tokens, both free at IRG's volumes — pick whichever has the simpler integration path from Cloudflare.
- **Sequencing**: the embedding prebuild script ships at **L4 time** (with the MCP server), NOT at L3 time (with the chatbot). MCP needs the same `data/embeddings.json` for its `search_songs` tool, and L4 ships before L3 in the agent-layer rollout. L3 reuses the file unchanged — no new prebuild work.
- **Cost model**: re-embedding the full corpus on each rebuild is ~4M tokens × $0.02/M ≈ $0.08/mo at typical rebuild cadence. Operational cost is dominated by the L3 chatbot model calls (D045), not embedding generation.
- **Revisit if**: corpus grows past ~10K chunks (rough threshold where in-memory similarity stops being trivially fast in a Worker); OR an embedding provider's Cloudflare integration story changes materially (e.g. Vectorize gets a sufficiently-generous free tier).

## D042 — MCP tool surface and scope; central library URLs canonical

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: An MCP (Model Context Protocol) server lets agents query IRG content via a structured protocol rather than scraping HTML or guessing from training data. The corpus is public read-only content (~1,500 songs + gaggle directory + organizational pages). The architectural questions: which tools to expose, what data each returns, and how subsite-local song duplicates (D034) are handled.
- **Options considered**:
  - **WordPress MCP Adapter plugin** — designed for "help me operate WordPress" not "help the public query content"; only practical for WP.com-hosted sites, not self-hosted multisite.
  - **Expose raw WPGraphQL** — no tool-level scoping, no per-tool rate limiting, GraphQL's flexibility is a liability (agents could construct expensive recursive queries).
  - **Third-party "WPGraphQL → MCP" wrappers** — couples MCP availability to WP uptime; less control over tool descriptions (which are a critical anti-tool-poisoning surface per OWASP MCP Top 10 #3).
  - **Custom MCP server with a curated tool surface, reading the consolidated JSON corpora**.
- **Choice**: 8 read-only tools — `search_songs(query, limit?)`, `get_song(slug)` (full lyrics + metadata), `find_by_tune(tune_name)`, `list_issues()`, `list_tunes()`, `search_gaggles(country?, region?, near?)`, `get_started_guide()`, `song_submission_guidelines()`. Plus 2 resources: `songs://all`, `gaggles://all`. Tool descriptions are static in code, never derived from user-generated content, so adversarial WP edits can't poison the tool surface.
- **Canonical URLs**: song results return central library URLs (`raginggrannies.org/songs/<slug>`) regardless of whether the song's gaggle has a subsite-local archive. Subsite-local song pages are convenience duplicates (D034, D035), not authoritative; MCP does not surface them. Mirrors the canonical-URL stance from D035.
- **Rate limit**: per-IP via Cloudflare's built-in rules — 60 req/min, 1,000 req/day. Makes bulk-corpus extraction impractical without making it impossible (acceptable trade-off for a nonprofit whose mission benefits from broad song distribution).
- **Output wrapping**: retrieved content wrapped in static `<song>...</song>` / `<gaggle>...</gaggle>` tags with a fixed disclaimer prefix that retrieved content is data, not instructions. Mitigates OWASP MCP Top 10 #6 (Intent Flow Subversion) and #10 (Context Injection / Over-Sharing).
- **Revisit if**: agents start needing tools not in the surface (e.g. "find songs by tempo" — would need new metadata in the song CPT); OR rate-limit thresholds prove too tight or loose in practice; OR a future member-only data layer ships (D043 then needs revisiting too).

## D043 — Anonymous MCP, no OAuth (reserve for future member-only data)

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: The MCP spec (March 2026) classifies servers as OAuth 2.1 resource servers and explicitly allows unauthenticated public-data servers — the client just sees no `WWW-Authenticate: Bearer` challenge and proceeds anonymously. IRG's MCP server (D042) exposes only public read-only content. Members-only content is excluded at the corpus level via the public-filter (D046), not gated at the MCP layer.
- **Options considered**:
  - **OAuth 2.1 with PKCE + RFC 8707 resource indicators** (full spec compliance; matches the configuration used by member-only MCP servers).
  - **Anonymous** (no auth challenge — clients proceed unauthenticated; matches the spec's explicit public-data lane).
- **Choice**: anonymous. No OAuth.
- **Rationale**: real-world OAuth-enabled MCP servers had multiple high-profile auth bugs through 2025. Adding auth you don't need adds attack surface for no security gain when the data is already public. Building OAuth infrastructure for content anyone can fetch via `curl` is overkill. If/when IRG ever exposes member-only data (rosters, internal docs), implement OAuth 2.1 then — not before.
- **Revisit if**: IRG decides to expose member-only data via MCP (then build OAuth 2.1 with PKCE + RFC 8707 per the current spec at that point — and re-examine whether MCP is even the right protocol for that data); OR an MCP spec revision deprecates anonymous public servers.

## D044 — MCP as a separate Cloudflare Worker, not a Pages Function

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: The MCP server (D042) needs an HTTP endpoint with the Streamable HTTP transport (per the March 2025 MCP spec, which replaces SSE). Two natural Cloudflare placements: a Pages Function in the same project as raginggrannies.org, or a separate Worker at a dedicated subdomain.
- **Options considered**:
  - **Pages Function** in the main project at `functions/api/mcp.ts` — shares deploy lifecycle with the site, simpler ops surface, fewer config files.
  - **Separate Cloudflare Worker** at `workers/mcp/` deployed to `mcp.raginggrannies.org` — own `wrangler.toml`, decoupled uptime, isolated logs.
- **Choice**: separate Worker. `workers/mcp/` lives in-repo with its own `wrangler.toml`, `package.json`, `tsconfig.json`. Uses `@cloudflare/agents` `McpAgent` helper with `createMcpHandler`. The Worker is a thin protocol-translation layer over `data/embeddings.json`, `data/songs-consolidated.json`, and `data/gaggles-consolidated.json` — the data files get bundled into the Worker at build time so MCP works even if WordPress is down.
- **Rationale**: site uptime and MCP uptime should be independent. A bad Pages deploy shouldn't break agents reading from MCP, and vice versa. Worker logs stay separate from the site's, simplifying anomaly investigation. Custom subdomain (`mcp.raginggrannies.org`) plus disabling the default `workers.dev` hostname makes the canonical endpoint discoverable and lookalikes harder to spin up (mitigates OWASP MCP Top 10 #9 — Shadow MCP Servers).
- **Revisit if**: Cloudflare ships meaningfully better Pages-Function support for long-running streaming connections (currently Workers are the better fit); OR MCP usage stays tiny long-term and consolidating ops surface area becomes more valuable than uptime decoupling.

## D045 — Chatbot UX: dedicated /ask page, no floating widget, nav link

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: The "Ask the website" chatbot (L3 of the agent layer) needs a UX that fits IRG's primary demographic — grannies aged 65–85, many on smaller phones or low-vision adapters. Standard SaaS chatbot UX is a floating widget that pops over content. W3C WCAG-AGE guidance and Nielsen Norman Group research on users 65+ both flag floating chat as a problem for older audiences (covers content, moves unexpectedly, tap targets too small, expects multi-turn conversation).
- **Options considered**:
  - **Floating chat widget on all pages** — standard SaaS pattern, immediately visible, but accessibility issues for older users; violates the demographic guidance above.
  - **Slide-over panel triggered by a button on every page** — milder than a floating widget but same fundamental issue (covers content, expects multi-turn).
  - **Dedicated `/ask` page linked from main navigation** — stable, addressable, large UI elements, "ask a question" framing instead of "chat".
- **Choice**: dedicated `/ask` page. Linked as "Ask a Question" in the main navigation (controlled by `CHATBOT_ENABLED` env var so the link disappears instantly via Cloudflare Pages dashboard if the feature needs to go dark). The page looks more like a search box with a conversational answer than ChatGPT — large input (default 18px), 4–6 visible example questions as clickable chips, big tap targets, WCAG AA contrast. No floating widget, no slide-over panel, no auto-popup. Contextual callouts on `songs/index`, `find-a-gaggle`, and `start-a-gaggle` invite users to try it.
- **Tone**: warm, encouraging, community-oriented. Uses "we" / "our" — the chatbot is part of the community, not a helpdesk bot. Cites source pages by title with links. When uncertain, says so honestly and offers `mailto:webgranny@gmail.com` as a first-class outcome (not a failure mode). Refusal boundary for partisan-electoral questions — IRG stands for issues, not candidates.
- **Cost guardrail**: two-stage daily ceiling — soft email alert at $0.25/day (~$7.50/mo), hard breaker at $1/day (~$30/mo) where the endpoint short-circuits to the email fallback. Default planning volume is ~$0.05/day, so the soft alert sits ~5× above normal — quiet on weekdays, vocal on anomalies. Both thresholds env-var configurable (`CHATBOT_DAILY_SOFT_USD`, `CHATBOT_DAILY_HARD_USD`).
- **Model**: configurable via `CHAT_MODEL` env var (default `claude-haiku-4-5-20251001`); not hardcoded so it can be swapped to Sonnet or any future model without code changes.
- **Revisit if**: a younger audience joins (post-DNS cutover, broader reach) and the floating-widget pattern becomes worth supporting as an alternate surface; OR the email-fallback rate exceeds 10× planning estimate (then add per-gaggle routing — currently webgranny@gmail.com handles all escalations); OR a future Anthropic / OpenAI model deprecation requires re-evaluating cost.

## D046 — Public-filter excludes members-only from consolidated JSONs entirely; JS gate is courtesy, not boundary

- **Status**: Decided
- **Date**: 2026-04-30
- **Context**: D004 established a client-side password gate for members-only content on subsites — content is rendered into the static HTML and hidden by a JavaScript prompt at view time. The JS gate is a courtesy barrier: sufficient for casual visitors who view the rendered site, but trivially defeated by any agent or scraper that reads raw HTML. The agent layer (L1–L4) creates new aggregated surfaces — consolidated JSONs (`data/gaggles-consolidated.json`), markdown twins, embeddings, MCP responses — that an attacker could harvest with no JS execution. The architectural question: is it sufficient to ship members-only content into those surfaces and rely on the JS gate, or must we exclude members-only content from the corpus entirely?
- **Options considered**:
  - **Trust the JS gate** — render members-only HTML, generate `.md` twins / embeddings / MCP responses from it, let the gate hide it on screen. Minimum implementation cost. Fails the threat model: any RAG, MCP query, or scraper trivially defeats the gate by reading the unfiltered output.
  - **Exclude members-only content from consolidated JSONs entirely**. JS gate stays as the courtesy barrier on the rendered subsite; the public-filter is the real boundary.
- **Choice**: a single shared `src/lib/public-filter.ts` module gates content on `status === 'publish'` AND excludes denylisted categories (`members-only`, `draft-public`). All four agent layers (L1–L4) consume only filtered content. Members-only content never reaches `data/songs-consolidated.json`, `data/gaggles-consolidated.json`, embeddings, markdown twins, `llms-full.txt`, or MCP responses.
- **Why "the most important security boundary"**: all four agent layers depend on this filter being correct. A bug here is a silent leak across every agent surface simultaneously. Implementing it as one module with one place to audit (rather than re-implementing publish-status checks in every consumer) is the only sustainable approach. PR review for any new agent-layer consumer must verify it routes through `public-filter.ts`.
- **Relationship to D004**: D004's JS password gate continues to function as before — it's the courtesy barrier for the rendered subsite HTML. D046 supplements it with a hard boundary for the agent layer. Defense in depth, where each layer has its own threat model and audience.
- **Revisit if**: WordPress changes how members-only content is represented (currently denylisted by category — could become a `meta_key`, a custom post status, or a paid-membership plugin's flag — the filter needs to follow); OR a new agent surface lands that doesn't go through `public-filter.ts` (then either route it through, or audit-document why it's exempt — never both); OR Cloudflare Access (D004's Phase 2 path) replaces the JS gate (the public-filter would still apply).

---

## D047 — Press clippings via Google News RSS (supersedes D027)

- **Status**: Decided
- **Date**: 2026-05-04
- **Context**: D027 picked The News API as the press feed. In practice it had two problems for /in-the-news/: (1) the free tier returned only 3 articles per call and defaulted to relevance-sort, so every build re-fetched the same handful of 2022 stories already in the archive and reported "0 new" for weeks; (2) coverage was thin — it indexed major outlets but missed the regional/local press where most gaggle activity actually shows up (Mad River Union, Lethbridge News Now, Sacramento News & Review, Wednesday Journal of Oak Park, etc.). Maya raised the concern after a real OregonLive article from 2026-04-26 didn't surface in the API window.
- **Options considered**:
  - **Stay on The News API and add `sort=published_at` + `published_after`** — fixed the "same 3 stories every call" symptom but didn't help the underlying coverage gap.
  - **Add a second source alongside The News API and dedupe** — more code, marginal redundancy benefit (everything The News API has, Google News has).
  - **Switch to Google News RSS** — `news.google.com/rss/search?q="raging+grannies"` returns ~100 results per call, no API key, broad coverage of small outlets, stable feed format that has existed for ~20 years. Earlier hesitation about "Google News API was deprecated" conflated the official deprecated developer API with these search RSS feeds; they're separate and the RSS feeds remain in active service.
- **Choice**: Google News RSS replaces The News API in `scripts/fetch-press.mjs`. Same file, same archive shape (`{ title, source, url, published_at, snippet, image_url, fetched_at }`), same dedupe-by-normalised-title, same failure-tolerant behaviour. Parsed with `fast-xml-parser` (already installed as a transitive of `@astrojs/rss`). Title cleanup strips the trailing " - Source Name" suffix Google appends. URL is the Google News redirect URL (clicks pass through Google then land on the original article — slight UX cost, no per-article HTTP overhead at fetch time). Snippet is empty (Google News description is just a wrapped link); the page already renders title-only when snippet is missing.
- **Verified at swap**: 4 new articles surfaced on first run (Jefferson City News Tribune 2026-05-02, Indybay 2026-05-01, Mad River Union 2026-04-30, Redheaded Blackbelt 2026-04-28). All previously invisible to The News API.
- **Cleanup**: `THENEWSAPI_KEY` env var is no longer read. Maya can remove it from `.env.local` and Cloudflare Pages env. The daily GitHub Actions workflow at 13:17 UTC continues unchanged; it just runs against the new fetcher.
- **Revisit if**: Google changes the RSS format or stops serving these feeds (then evaluate Bing News RSS, NewsAPI.org, GDELT, or a per-outlet RSS allowlist); OR we want canonical article URLs instead of Google redirect URLs (then add a one-time URL resolution step that follows the redirect and caches the canonical, accepting the per-article HTTP cost on new entries only).

## Open decisions (not yet resolved)

- **Song taxonomy structure**: 17 issue categories finalized (D016, split in D021). Song librarian may still refine E&D/G&P boundaries or request additions.
- **Brand colors and visual identity**: need to document from existing IRG materials.
- **Gallery plugin/approach**: needs to be granny-friendly in WP admin.
- **Contact form handling**: email routing, form service choice.
- **DNS cutover plan**: how to move raginggrannies.org without downtime.
- **Image hosting strategy**: WP media library vs. Cloudflare Images vs. other.
- **Song deduplication resolution**: 99 duplicate pairs identified. Song librarian decides which version to keep per pair.
- **Admin edit links**: see D025. Deferred pending a second use case.
