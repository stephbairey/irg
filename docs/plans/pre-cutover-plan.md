# Pre-cutover plan

Consolidated 2026-08-04. Supersedes `song-pipeline-hardening.md` (same file,
renamed) by folding in the July 28 Intergaggle Communications meeting items.

Execution deferred roughly one week, until song curation finishes. See
Sequencing for what is and is not blocked by that.

Six workstreams:

- **A** Submission endpoint hardening (security, do first)
- **B** Shared combobox component
- **C** WP push-to-deploy
- **D** Documentation
- **E** Committee UX items
- **F** News feed

## Decisions ledger

Everything settled across the 2026-08-04 sessions. These become D055 onward
in `DECISIONS.md` when execution starts.

| Decision | Rationale |
|---|---|
| Keep both the PHP exporter and `scripts/snapshot-songs.mjs` for now | Local manual escape hatch stays available while the automated path proves itself. Retiring the script is Phase 2. |
| Deploy push fires on every song publish and edit, burst-collapsed | Immediacy matters more than commit tidiness; debouncing keeps a bulk pass from producing hundreds of commits. |
| The Worker rejects suspicious payloads | A silent partial export that clobbers 1,470 songs is the worst realistic failure. |
| One shared combobox component for both song forms | Seven inputs across two pages; divergent behaviour would be its own bug. |
| Ship the whole submission workstream in one pass | A1 through A4 live in the same two functions. |
| One shared feedback component, page-configurable | E3's variants are the same affordance with different reasons. Config-driven so the launch-only variant can be switched off in one line. |
| "60+" applies to human copy only | JSON-LD `numberOfItems` needs an integer; structured-data consumers benefit from the real count. |
| Shuffle stays the song library default | Supersedes the June newest-first ask. Newest remains a selectable option. |
| Logo hidden on the hub only; JSON-LD `logo` property left as-is | Subsite JSON-LD has no logo property, so hiding is purely visual. Per-subsite logo settings are Phase 2. |
| Favicon removed with no replacement | Browser fallback is acceptable for the placeholder period. |
| Press exclusions hand-edited until C lands | Avoids blocking the fix on the deploy automation. The gated curation page follows C. |
| Photo submissions go to email, not an upload endpoint | A public upload path is a large new abuse surface; deferred to Phase 2. |

## Workstream A: submission hardening

All in `wp-plugin/irg-core/irg-core.php`. One deploy via
`node scripts/deploy-plugin.mjs`.

### A1. Close the open endpoint

`irg_handle_submit_song` (`:1476`) is registered with
`permission_callback => '__return_true'` (`:1480`) and has no honeypot, no
Turnstile, and no server-side password. Anyone can curl it and create
unlimited draft posts plus unlimited new taxonomy terms. The client-side
SHA-256 gate in `submit.astro:302-315` never reaches the server.

Port the three guards from `irg_handle_edit_song` (`:1661-1682`), in the
order it uses:

- Honeypot `hp` param, returning a silent `{ ok: true }` when filled.
- `irg_verify_turnstile()` (`:1357`), which already fails closed when
  `IRG_TURNSTILE_SECRET` is unset.
- `hash_equals` against `IRG_SUBMIT_PASSWORD`, already defined in
  `wp-config.php` and already used by the edit endpoint.

Frontend work in `src/pages/submit.astro`: add the Turnstile widget and
script (mirroring `edit-song.astro:224,253`), add the hidden honeypot, and
post `password`, `hp`, and `cf-turnstile-response` alongside the existing
ten fields. User-facing flow does not change; the password they already
type at the gate simply starts being checked server-side.

Sitekey/secret split: Cloudflare Pages env uses `TURNSTILE_*`,
`wp-config.php` uses `IRG_TURNSTILE_*`. Do not swap them.

Rate limiting is **not** in this port. The plugin has no throttle anywhere,
and with a server-side password the endpoint is no longer anonymous.
Revisit if abuse appears.

### A2. Comma-split contributor names

`irg_submit_attach_term` (`:1999`) does not split on commas, so a
submission crediting "Alice Smith, Bob Jones" creates one combined
songwriter term. That is the mess `scripts/cleanup-songwriters.mjs` exists
to undo. `irg_edit_replace_terms` (`:1765`) already splits correctly.

Extract the splitting logic into one shared helper called from both. Also
make the append/overwrite behaviour of `wp_set_object_terms` (`:2013`) an
explicit argument; overwrite is harmless on a fresh draft but is a footgun
if the function is reused.

### A3. Real YouTube URL validation

`irg_is_youtube_url` (`:1992`) is a substring check, so
`https://evil.com/?x=youtube.com` passes. Replace with `wp_parse_url` plus
an exact host allowlist (`youtube.com`, `www.youtube.com`, `m.youtube.com`,
`youtu.be`). Applies to both `youtube_link` and `youtube_link_2`.

### A4. Surface dropped issue terms

Unknown issue names go to `error_log` and are otherwise discarded
(`:1597`). Include them in the REST response and in the librarian email
(`irg_submit_send_notification`, `:2016`). In practice the checkboxes come
from the live term list so this should never fire, which is exactly why a
silent failure here would go unnoticed for a long time.

## Workstream B: shared combobox component

Native `<datalist>` cannot be styled (the dropdown is browser chrome, not
page DOM) and cannot be gated by typed length. Both requirements force a
custom control.

Replaces seven inputs:

- `src/pages/submit.astro`: title (`:94`), tune (`:103`), songwriter
  (`:125`). Gaggle is a `<select>` and stays as-is.
- `src/pages/edit-song.astro`: search-songwriters (`:120`), tune (`:155`),
  songwriter (`:177`), gaggle (`:186`).

Behaviour:

- No suggestion panel until 3 characters are typed.
- Styled panel anchored under the input, visually obvious as a suggestion
  list rather than a stray floating list.
- Keyboard support: up/down to move, Enter to select, Escape to dismiss.
- ARIA combobox pattern: `role="combobox"`, `aria-expanded`,
  `aria-controls`, `aria-activedescendant`, and `role="listbox"` /
  `role="option"` on the panel.
- Free text always allowed, since submitting a genuinely new songwriter is
  supported. When nothing matches, say so ("No match. This will create a
  new songwriter."), which pairs with A2 by making term creation visible.

Options data still comes from the build-time snapshot via `fetchAllSongs()`
(`submit.astro:20-38`). No new data plumbing.

Verify keyboard-only operation, screen reader announcement, and mobile
behaviour. Confirm no interaction with the TipTap lyrics editor or the
password gate on the same page.

## Workstream C: push-to-deploy automation

Blocked on curation.

The host has declined to whitelist our IPs in Imunify360, so nothing in CI
can read the WP origin. `scripts/fetch-press.mjs` is not a precedent: it
pulls from Google News RSS (`:76`) and never touches WP, which is why it
runs fine from a GitHub runner.

The way around it is to invert direction. Imunify360 blocks inbound
requests; WordPress can still make outbound ones, as the Turnstile
siteverify call at `irg-core.php:1365` demonstrates in production.

### C1. PHP exporter

New function in `irg-core` building the consolidated JSON directly from the
database (no GraphQL round trip, since it runs inside WP).

Output must match `toRecord()` in `scripts/snapshot-songs.mjs:104-133`
exactly, all 22 keys, including hard-coded migration artifacts (`source:
"wp"`, `original_wp_id`, `duplicate_of: null`, `needs_review: false`,
`review_notes: ""`). `duplicate_of` is still filtered on in
`src/lib/songs.ts:155` and two scripts, so the key must be present.

Keep the legacy joined strings (`tune`, `songwriter`, `gaggle`) alongside
the arrays, with the same separators (`" / "`, `" and "`, `", "`).

### C2. Trigger

Hook `transition_post_status` for `post_type === 'song'`, firing on publish
and on updates to already-published songs.

Debounce with `wp_schedule_single_event` about 60 seconds out so a burst
collapses into one push. This still honours "fire on every edit" (every
edit schedules a push) while preventing a commit per keystroke. The
2026-08-03 cleanup of 185 songs would have produced one commit instead of
185.

### C3. Worker

New Cloudflare Worker, separate from the Pages project.

- Authenticate with an HMAC of the request body using a shared secret, not
  a bare token, so a leaked log line is not a credential.
- Validate and run the C4 safety check.
- Commit `data/songs-consolidated.json` via the GitHub contents API, which
  requires reading the current file SHA first.
- Commit as a bot identity, matching the `irg-press-bot` convention in
  `.github/workflows/fetch-press.yml`.
- The push triggers the existing Pages rebuild. No build pipeline change.

This Worker later gains a second route for the news curation page (F3).

### C4. Safety check

Reject and do not commit when any of these hold:

- Payload is not valid JSON or does not match the expected record shape.
- Song count is zero.
- Song count is below 95% of the currently committed count.

Support an explicit override flag for legitimate bulk deletions.

On rejection, return an error, log it WP-side, and email Maya. A rejected
push must never fail the WP publish; the librarian's save always succeeds.

### C5. Secrets

- WP side: `IRG_DEPLOY_ENDPOINT` and `IRG_DEPLOY_SECRET` in
  `wp-config.php`, matching the `IRG_TURNSTILE_*` convention.
- Worker side: the same shared secret, plus a GitHub fine-grained PAT
  scoped to contents:write on the `irg` repo only, stored as a Worker
  secret.

### C6. Failure surface

If the push fails for any reason, email Maya. Silent failure recreates the
exact problem this workstream exists to solve, except harder to notice.

## Workstream D: documentation

- `DECISIONS.md`: correct D018, which says "All 6 fields" and omits
  `feature_on_homepage`. There are seven.
- `DECISIONS.md`: record that `source_notes` was relabeled "Additional
  Notes" in the admin (commit `9e2a1cb`) while the machine name, the JSON
  key, and the prose still say source notes. This is deliberate.
- `DECISIONS.md`: add the decisions ledger above as D055 onward.
- `DECISIONS.md`: record the shuffle-versus-newest resolution explicitly,
  since `2c70d0e` and `9e2a1cb` contradict each other one day apart and the
  June punch list asked for newest-first.
- **Verified, no action:** the submit/edit date param is not broken.
  `date_written` is the wire name; `irg-core.php:1563` writes it via the
  ACF field key `field_irg_date_written_or_updated`, which resolves to the
  `date_written_or_updated` meta key that GraphQL and the snapshot read.
  Recorded here so it stops being re-raised.
- `CLAUDE.md:21` and `:36`: the "auto-rebuild on content change via webhook
  from WP" claim is aspirational today. Workstream C makes it true; update
  the wording either way.
- `docs/HANDOFF.md:250`: says the log carries D001 through D050. It carries
  D054, and will carry more after this.

## Workstream E: committee UX items

From the July 28 Intergaggle Communications meeting unless noted. All
frontend, none blocked by curation.

### E1. Logo placeholder (hub only)

Assets are already staged, unreferenced, in `public/`:
`logo-placeholder-cropped.svg` and `logo-placeholder-full.svg`.

- Header (`BaseLayout.astro:80`): swap `logo-cropped.svg` for
  `logo-placeholder-cropped.svg`. Renders at 100x100 with `object-contain`.
- Footer (`BaseLayout.astro:351`): swap `logo-full.svg` for
  `logo-placeholder-full.svg` at 125px tall.
- Favicon (`BaseLayout.astro:60`): remove the link entirely. Browsers will
  request `/favicon.ico`, 404, and fall back to a generic tab icon. This is
  accepted for the placeholder period.
- JSON-LD `logo` property (`BaseLayout.astro:24`): **leave as-is**,
  pointing at `logo-cropped.svg`. Keep that file in `public/`.
- Subsites: **no change.** `wp-theme/the-bulletin-local` keeps the current
  mark. Its JSON-LD (`inc/jsonld.php:65-72`) declares an Organization with
  no `logo` property, so nothing structured is affected.

Watch the footer filter: `brightness-0 invert opacity-90` forces the image
to pure white, which turns a dashed placeholder outline into a white ghost
that may read as a rendering glitch. Expect to drop the filter for the
placeholder period; confirm visually on the built page.

Note both placeholder SVGs bake in `#422A69` rather than inheriting it, so
they will not follow a future token change. Acceptable for a temporary
asset.

Replaced when the ranked-choice logo vote concludes.

### E2. Copy corrections

- **Duplicate founding year and self-description.** Still live. The sticky
  header renders "International Disorganization · Est. 1987"
  (`BaseLayout.astro:83`) and the homepage masthead renders "The
  International Disorganization" and "Est. Victoria, BC · 1987" immediately
  below (`index.astro:123-124`). Both the year and the self-description
  appear twice, stacked. Resolve which one keeps them.
- **Homepage featured song label.** "From the song library" becomes "One of
  Our Songs". The featured song is chosen from the `feature_on_homepage`
  allowlist (D054), so the new label is also more accurate. Nothing else in
  the block moves.
- **Gaggle count on Find a Gaggle.** `find-a-gaggle.astro:56` computes the
  exact `gaggles.length` and renders it at `:137`. Switch that copy to
  `getActiveGaggleCountLabel()` from `src/lib/gaggles.ts:48`, which already
  floors to the nearest ten and appends "+". Leave the JSON-LD
  `numberOfItems` (`:105`) as the real integer, and leave
  `scripts/generate-llms-txt.mjs` emitting the real count.

The other three June copy corrections shipped in `994d047` and need no
work: the "over 50" age claim, the network self-description, and "songbook"
to "song library".

### E3. Shared feedback component

One component, one config module. Each variant is declared once with an
on/off flag; pages opt in by name. Turning off the launch-only variant
after a few months is then one line in one file.

- Initial state hidden behind an obvious call-to-action button; clicking
  reveals a textarea and submit, so the user never leaves the page.
- Posts to the existing contact endpoint,
  `${PUBLIC_WP_URL}/wp-json/irg/v1/contact` (`irg-core.php:1384`), as
  `application/x-www-form-urlencoded` to stay a simple CORS request with no
  preflight (D041). That constraint must be preserved.
- Needs Turnstile, since the endpoint verifies server-side and rejects
  unverified posts. Copy the `formAvailable` graceful-degradation pattern
  from `contact.astro:86-92`.
- The endpoint generates its own subject (`[Contact form] from {name}`,
  `:1453`), so the variant reason must be folded into the message body.
- **Not red.** Red is reserved for buttons, map pins, and data callouts.
  Pull from the existing token set in `src/styles/global.css`.

Variants:

| Variant | Placement | Lifespan |
|---|---|---|
| Launch feedback | Above the footer on every page type, including song detail | Temporary, first few months post-launch |
| Gaggle not listed | Find a Gaggle | Permanent |
| Send us photos | Photos page, above the fold on desktop | Permanent |

Because it mounts above the footer in `BaseLayout`, "every page type" comes
free; verify it on song detail pages specifically, which have their own
grid.

### E4. Footer restructure

Rename the "The Songs" column to "Actions" with four links: Join the Raging
Grannies (new page), Add a Song (existing `/submit/`), Send a Photo (FAQ
deep link, see E5), Get Help (existing `/contact/`).

The Join page is straight content, no new plumbing.

### E5. Photo submission via FAQ

No public upload path exists anywhere: no `<input type="file">` in `src/`,
and every public plugin endpoint is text-only. Real uploads are Phase 2.

For now, add an FAQ entry telling people to email photos to
`webgranny@raginggrannies.org`, and point the footer's Send a Photo link at
that entry, expanded.

This needs a small addition: `faq.astro` uses native `<details>` (`:200`)
grouped into sections, and **only the sections carry ids** (`:192`).
Individual questions have none, so nothing can target one answer. Add
per-question ids and a few lines of script to open the matching `<details>`
on load and scroll to it. Small, and it makes every FAQ answer
deep-linkable, which is worth having on its own.

### E6. Open question, not a task

The June ask for the lyrics column at tablet width was resolved by
correcting intrinsic sizing (`min-w-0` at `songs/[slug].astro:103,165,257`,
commit `699a8ab`) rather than by adding a tablet breakpoint. Columns still
go two-up from 768px. If the committee wanted the columns to *stack* on
tablet, that is unmet and needs a separate decision. Confirm intent before
scheduling work.

## Workstream F: news feed

### F1. Exclusion mechanism

There is no removal mechanism of any kind today. `fetch-press.mjs` has no
blocklist, allowlist, or domain filter, and hand-editing
`data/press-clippings.json` is undone by the bot for anything still inside
the ingest window.

Add `data/press-exclusions.json` (URLs and/or normalised titles), filtered
in **two** places:

- `scripts/fetch-press.mjs`, to skip on ingest.
- `src/pages/in-the-news.astro`, to filter at read so already-archived
  items disappear on the next build.

Exact precedent: `data/central-hidden-gaggles.json` filtered at consumption
(D052). Non-destructive and instantly reversible.

Records have no `id` or `guid`, so key on `url`. Post-D047 rows carry the
Google News redirect URL, pre-D047 rows carry the publisher URL; both are
stable strings.

**Maya hand-edits this file until workstream C lands.** No UI in this
round. The public reporting route already exists: `in-the-news.astro:98`
reads "If something's missing, send it our way" and links to `/contact/`.

### F2. Ingest diagnosis and health check

Investigate and report first; fix scoped afterward. What is already known:

- **The date window is self-sealing.** `cutoffMs` is the newest
  `published_at` in the archive minus 24 hours, so the accept window is
  roughly one day and it advances every time anything is ingested. Google
  News routinely surfaces local affiliate stories several days late, and
  once the cutoff passes a story's publication date it is permanently
  unreachable. This is the most likely cause of the missed CBS affiliate
  story. There is no backfill path.
- **Dedupe compares normalised titles only**, ignoring URL and source, so
  syndicated affiliate headlines collide and the second is silently
  dropped. The archive already contains a CBS affiliate row, proving they
  can pass, which makes a collision plausible for this specific miss.
- **A six-week gap exists between 2026-06-13 and 2026-07-29** despite daily
  runs. The cutoff does not explain this. It is consistent with repeated
  blocked or failed fetches; Google News rate-limits unusual user agents
  and the bot identifies as `irg-press-bot/1.0`.
- **Every failure is silent.** All four failure paths `console.warn` and
  return `[]` or `exit(0)`. The workflow's only signal is
  `git diff --quiet`, so a blocked fetch, a parse error, and a genuinely
  quiet news day produce an identical green run reading "No new clippings".
  Items dropped by the cutoff and by dedupe are counted and logged nowhere.

Add a health check regardless of what the diagnosis concludes: alert when N
days pass with no new clipping. Also clean up the dead `THENEWSAPI_KEY` env
var and the stale "The News API" comment in
`.github/workflows/fetch-press.yml`, both leftovers from D027.

### F3. Gated curation page (follows C)

A page gated like `/submit`, where a curating granny removes articles
directly. Blocked on workstream C, because the deletion has to reach the
repo: the Astro build reads `data/press-exclusions.json` at build time and
cannot read WordPress.

Path, reusing what will already exist: browser posts to a WP endpoint using
the proven password + Turnstile + honeypot pattern, WP stores the exclusion
list, WP pushes outbound to the C3 Worker, the Worker commits the file, and
Pages rebuilds.

Restore-a-deleted-item and manual article addition are Phase 2. Both are
the same write path with a different payload, so neither needs re-scoping
from zero once this exists.

## Sequencing

**A first, and soon.** It is the only item on this list that is an active
liability rather than an improvement, the guards already exist to copy, and
the endpoint currently allows unlimited taxonomy term creation during the
exact period the taxonomy is being curated by hand. It is not blocked by
curation.

**B, D, E, and F1/F2 are unblocked** and can go whenever there is time. E
is mostly copy and component work with no backend dependency.

**C waits until curation finishes.** Live curation generates a continuous
burst of song edits, and standing up the publish hook mid-curation means
firing the deploy path hundreds of times before it has ever been exercised
once. Wait for quiet, then test against a single deliberate edit.

**F3 follows C**, since it depends on the Worker.

Within C: build C1 and verify its output byte-matches a fresh
`npm run snapshot` before wiring C2 through C6. That comparison is the
whole safety argument for keeping both implementations, so run it first
rather than treating it as a final check.

## Risks

- **Turnstile misconfiguration breaks the submit form.** The verify helper
  fails closed by design. Confirm `TURNSTILE_SITEKEY` is set in Pages env
  and `IRG_TURNSTILE_SECRET` in `wp-config.php` before deploying A1, and
  test a real submission immediately after. The same risk applies to E3,
  which adds Turnstile to every page carrying the feedback component.
- **Two exporters drift.** Mitigated by the byte-match check in C, and
  bounded by keeping the local script only until the pushed path is
  trusted.
- **The combobox regresses a working page.** `edit-song.astro` works today.
  Verify the search-by-songwriter flow specifically, since that input
  drives which song loads into the form.
- **A leaked deploy secret allows arbitrary commits** to the data files.
  Mitigated by HMAC over the body, the C4 safety check, and a
  narrowly-scoped PAT.
- **The feedback component adds a form to every page.** That multiplies the
  contact endpoint's exposure. It already has a honeypot, Turnstile, and
  length caps, but watch the inbox volume after launch.

## Phase 2

Added by this plan, on top of the existing `docs/HANDOFF.md` Phase 2 list:

- Retire `scripts/snapshot-songs.mjs` once the pushed exporter is trusted.
- Per-subsite custom logo option in gaggle settings.
- Restore a deleted news item from the curation page.
- Manually add a news item from the curation page.
- Real photo uploads: a plugin endpoint using
  `wp_handle_upload`/`media_handle_sideload` with Turnstile, size and MIME
  limits, and a considered abuse surface.

## Resume checklist

- [ ] A1 close `submit-song` (honeypot, Turnstile, password) + frontend
- [ ] A2 shared comma-split helper
- [ ] A3 host-allowlist YouTube validation
- [ ] A4 surface dropped issue terms
- [ ] B shared combobox, 7 inputs, 3-char gate, ARIA
- [ ] C1 PHP exporter, byte-match against `npm run snapshot`
- [ ] C2 debounced publish hook
- [ ] C3 Worker with HMAC auth and GitHub commit
- [ ] C4 safety check with override
- [ ] C5 secrets in both places
- [ ] C6 failure email
- [ ] D docs, D055 onward, shuffle resolution, date-param no-action note
- [ ] E1 logo placeholder, favicon removal, footer filter check
- [ ] E2 three copy corrections
- [ ] E3 shared feedback component + 3 variants
- [ ] E4 footer restructure + Join page
- [ ] E5 photo FAQ entry + per-question ids and hash-open
- [ ] E6 confirm tablet intent with committee (decision, not code)
- [ ] F1 press exclusions, filtered in both places
- [ ] F2 ingest diagnosis, health check, workflow cleanup
- [ ] F3 gated curation page (after C)
