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

---

## Open decisions (not yet resolved)

- **Song taxonomy**: categories and tags TBD with song librarian before migration.
- **Brand colors and visual identity**: need to document from existing IRG materials.
- **Gallery plugin/approach**: needs to be granny-friendly in WP admin.
- **Contact form handling**: email routing, form service choice.
- **DNS cutover plan**: how to move raginggrannies.org without downtime.
- **Image hosting strategy**: WP media library vs. Cloudflare Images vs. other.
- **Song deduplication strategy**: handling overlapping archives from gaggle subsites.
