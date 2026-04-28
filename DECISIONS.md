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

- **Status**: Decided
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
- **CORS**: `rest_pre_serve_request` filter sets `Access-Control-Allow-Origin` only for `raginggrannies.org` (and `www.`), `*.pages.dev` previews, and `localhost`. Other origins get no header (browser blocks the response).
- **Destination**: hardcoded `IRG_CONTACT_TO = press@raginggrannies.org`. Prevents the endpoint from being repurposed as an open relay. When per-topic addresses arrive, the constant becomes a routing table.
- **Setup checklist** (one-time, by Maya):
  1. Cloudflare dashboard → Turnstile → Add site (domains: `raginggrannies.org`, plus the `*.pages.dev` preview and `localhost` for dev). Mode: Managed.
  2. Copy the **site key** into `PUBLIC_TURNSTILE_SITEKEY` in `.env.local` and Cloudflare Pages → project → Settings → Environment Variables.
  3. Copy the **secret** into `wp-config.php` on the IRG Nixihost: `define( 'IRG_TURNSTILE_SECRET', '...' );`. Add it under the existing constants, before the `ABSPATH` block.
  4. Redeploy (push triggers CF rebuild; WP picks up the constant on next request).
- **Graceful degradation**: if `PUBLIC_TURNSTILE_SITEKEY` is unset at build time, the page renders a friendly fallback ("the form is being set up — email us at press@") instead of a broken widget. Same fallback if the WP URL isn't configured. Once both are present, the form appears.
- **Revisit if**: spam volume punches through Turnstile (add rate-limiting per IP / Origin); OR we want delivery confirmation / queueing (move to Resend + Cloudflare Queues); OR we need separate destinations per topic (introduce a `category` field on the form and route in the WP endpoint).

---

## Open decisions (not yet resolved)

- **Song taxonomy structure**: 17 issue categories finalized (D016, split in D021). Song librarian may still refine E&D/G&P boundaries or request additions.
- **Brand colors and visual identity**: need to document from existing IRG materials.
- **Gallery plugin/approach**: needs to be granny-friendly in WP admin.
- **Contact form handling**: email routing, form service choice.
- **DNS cutover plan**: how to move raginggrannies.org without downtime.
- **Image hosting strategy**: WP media library vs. Cloudflare Images vs. other.
- **Song deduplication resolution**: 99 duplicate pairs identified. Song librarian decides which version to keep per pair.
- **Admin edit links**: see D025. Deferred pending a second use case.
