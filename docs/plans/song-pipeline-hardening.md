# Plan: song pipeline hardening and push-to-deploy

Written 2026-08-04. Execution deferred roughly one week, until the song
curation meetings finish (see Sequencing).

## Why this exists

Three problems surfaced together while tracing what happens when someone
submits a song on the live site:

1. The public `submit-song` endpoint has no server-side protection at all.
2. A published song stays invisible on the public site until a human
   remembers to run `npm run snapshot`, commit, and push.
3. The submit form's autocomplete is a native `<datalist>`, which cannot be
   styled and cannot be gated to a minimum typed length, so typing one
   letter drops the entire songwriter list on the user.

## Decisions made

| # | Decision | Rationale |
|---|---|---|
| 1 | Keep both the PHP exporter and `scripts/snapshot-songs.mjs` for now | Local manual escape hatch stays available while the automated path proves itself. Retiring the script moves to Phase 2. |
| 2 | Fire the deploy push on every song publish and edit | Immediacy matters more than commit-history tidiness. Burst collapsing handles the noise (see C2). |
| 3 | The Worker rejects suspicious payloads | A silent partial export that clobbers 1,470 songs is the worst realistic failure mode. |
| 4 | Build one shared combobox component for both pages | Seven inputs across two pages; divergent behaviour between submit and edit would be its own bug. |
| 5 | Ship the whole submission workstream in one pass | Items A1 through A4 all live in the same two functions. Splitting them means touching the same code three times. |

These become D055 through D059 in `DECISIONS.md` when execution starts.

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
same order it uses:

- Honeypot `hp` param, returning a silent `{ ok: true }` when filled.
- `irg_verify_turnstile()` (`:1357`), which already fails closed when
  `IRG_TURNSTILE_SECRET` is unset.
- `hash_equals` against `IRG_SUBMIT_PASSWORD`, which is already defined in
  `wp-config.php` and already used by the edit endpoint.

Frontend work in `src/pages/submit.astro`:

- Add the Turnstile widget and script, mirroring `edit-song.astro:224,253`.
- Add the hidden honeypot input.
- Post `password` (the plaintext the user typed at the gate), `hp`, and
  `cf-turnstile-response` alongside the existing ten fields.

Note the sitekey/secret split: Cloudflare Pages env uses `TURNSTILE_*`,
`wp-config.php` uses `IRG_TURNSTILE_*`. Do not swap them.

Rate limiting is **not** part of this port, because the plugin has no
throttle anywhere. With a server-side password in place the endpoint is no
longer anonymous, so a throttle is lower priority. Revisit if abuse appears.

### A2. Comma-split contributor names

`irg_submit_attach_term` (`:1999`) does not split on commas, so a
submission crediting "Alice Smith, Bob Jones" creates one combined
songwriter term. That is exactly the mess `scripts/cleanup-songwriters.mjs`
exists to undo. `irg_edit_replace_terms` (`:1765`) already splits correctly.

Extract the splitting logic into one shared helper and call it from both,
rather than copying it. Also note `irg_submit_attach_term` uses
`wp_set_object_terms` in overwrite mode (`:2013`), which is harmless on a
fresh draft but is a footgun if the function is ever reused; make the
append/overwrite behaviour an explicit argument.

### A3. Real YouTube URL validation

`irg_is_youtube_url` (`:1992`) is a substring check, so
`https://evil.com/?x=youtube.com` passes. Replace with `wp_parse_url` plus
an exact host allowlist (`youtube.com`, `www.youtube.com`, `m.youtube.com`,
`youtu.be`). Applies to both `youtube_link` and `youtube_link_2`.

### A4. Surface dropped issue terms

Unknown issue names are written to `error_log` and otherwise discarded
(`:1597`). Neither the submitter nor the librarian learns anything. Include
them in the REST response and in the librarian notification email
(`irg_submit_send_notification`, `:2016`).

In practice the checkboxes are generated from the live term list so this
should never fire, which is precisely why a silent failure here would go
unnoticed for a long time.

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
- Panel is styled, anchored under the input, visually obvious as a
  suggestion list rather than a stray floating list.
- Keyboard support: up/down to move, Enter to select, Escape to dismiss.
- ARIA combobox pattern: `role="combobox"`, `aria-expanded`,
  `aria-controls`, `aria-activedescendant`, and `role="listbox"` /
  `role="option"` on the panel.
- Free text is always allowed, since submitting a genuinely new songwriter
  is a supported case. When nothing matches, say so explicitly ("No match.
  This will create a new songwriter."), which pairs with A2 by making
  term creation visible at the moment it happens.

Options data still comes from the build-time snapshot via `fetchAllSongs()`
(`submit.astro:20-38`), so no new data plumbing.

Verify keyboard-only operation, screen reader announcement, and mobile
behaviour before shipping. Confirm no interaction with the TipTap lyrics
editor or the password gate on the same page.

## Workstream C: push-to-deploy automation

Blocked on curation. See Sequencing.

The host has declined to whitelist our IPs in Imunify360, so nothing in CI
can read the WP origin. `scripts/fetch-press.mjs` is not a template for
this: it pulls from Google News RSS (`:76`) and never touches WP, which is
why it runs fine from a GitHub runner.

The way around it is to invert direction. Imunify360 blocks inbound
requests. WordPress can still make outbound ones, as the Turnstile
siteverify call at `irg-core.php:1365` demonstrates in production.

### C1. PHP exporter

New function in `irg-core` that builds the consolidated JSON directly from
the database (no GraphQL round trip needed, since it runs inside WP).

Output must match `toRecord()` in `scripts/snapshot-songs.mjs:104-133`
exactly, all 22 keys, including the migration-era artifacts that are
hard-coded (`source: "wp"`, `original_wp_id`, `duplicate_of: null`,
`needs_review: false`, `review_notes: ""`). `duplicate_of` is still filtered
on in `src/lib/songs.ts:155` and two scripts, so the key must be present.

Keep the legacy joined strings (`tune`, `songwriter`, `gaggle`) alongside
the arrays, with the same separators (`" / "`, `" and "`, `", "`).

### C2. Trigger

Hook `transition_post_status` for `post_type === 'song'`, firing on publish
and on updates to already-published songs.

Debounce with `wp_schedule_single_event` about 60 seconds out, so a burst
of edits collapses into one push. This still honours "fire on every edit"
(every edit schedules a push) while preventing a commit per keystroke
during a bulk pass. Yesterday's 185-song cleanup would have produced one
commit instead of 185.

### C3. Worker

New Cloudflare Worker, separate from the Pages project.

- Authenticate with an HMAC of the request body using a shared secret,
  not a bare token, so a leaked log line is not a credential.
- Validate and run the C4 safety check.
- Commit `data/songs-consolidated.json` via the GitHub contents API, which
  requires reading the current file SHA first.
- Commit as a bot identity, matching the `irg-press-bot` convention in
  `.github/workflows/fetch-press.yml`.
- The push triggers the existing Cloudflare Pages rebuild. No change to
  the build pipeline.

### C4. Safety check

Reject and do not commit when any of these hold:

- Payload is not valid JSON, or does not match the expected record shape.
- Song count is zero.
- Song count is below 95% of the currently committed count.

Support an explicit override flag in the payload for legitimate large
deletions, so a real bulk removal is possible without editing the Worker.

On rejection, return an error, log it WP-side, and email Maya. A rejected
push must never fail the WP publish itself; the librarian's save always
succeeds.

### C5. Secrets

- WP side: `IRG_DEPLOY_ENDPOINT` and `IRG_DEPLOY_SECRET` in
  `wp-config.php`, matching the existing `IRG_TURNSTILE_*` convention.
- Worker side: the same shared secret, plus a GitHub fine-grained PAT
  scoped to contents:write on the `irg` repo only, stored as a Worker
  secret.

### C6. Failure surface

If the push fails for any reason (Worker down, GitHub API error, safety
check rejection), email Maya. Silent failure here recreates the exact
problem this workstream exists to solve, except harder to notice.

## Workstream D: documentation

- `DECISIONS.md`: correct D018, which says "All 6 fields" and omits
  `feature_on_homepage`. There are seven.
- `DECISIONS.md`: record that `source_notes` was relabeled "Additional
  Notes" in the admin (commit 9e2a1cb) while the machine name, the JSON
  key, and the prose all still say source notes.
- `DECISIONS.md`: add D055 through D059 for the five decisions above.
- `CLAUDE.md:21` and `:36`: the claim of "auto-rebuild on content change
  via webhook from WP" is aspirational today. Workstream C makes it true;
  update the wording either way.
- `docs/HANDOFF.md:250`: says the log carries D001 through D050. It carries
  D054, and will carry more after this.
- `docs/HANDOFF.md` Phase 2: add retiring `scripts/snapshot-songs.mjs`
  once the pushed exporter has proven itself (decision 1).

## Sequencing

**A and B are not blocked** by curation and can go whenever there is time.
Both are self-contained and independently deployable. A needs a plugin
deploy plus a Pages build; B is frontend only.

**C waits until curation finishes.** Live curation generates a continuous
burst of song edits, and standing up the publish hook in the middle of that
means firing the deploy path hundreds of times before it has ever been
exercised once. Wait for quiet, then test against a single deliberate edit.

Within C: build C1 and verify its output byte-matches a fresh
`npm run snapshot` before wiring C2 through C6. That comparison is the
whole safety argument for keeping both implementations, so run it first
rather than treating it as a final check.

## Risks

- **Turnstile misconfiguration breaks the submit form.** The verify helper
  fails closed by design. Confirm `TURNSTILE_SITEKEY` is set in Pages env
  and `IRG_TURNSTILE_SECRET` in `wp-config.php` before deploying A1, and
  test an actual submission immediately after.
- **Two exporters drift.** Mitigated by the byte-match check in C, and
  bounded by keeping the local script only until the pushed path is
  trusted.
- **The combobox regresses a working page.** `edit-song.astro` works today.
  Verify the search-by-songwriter flow specifically, since that input
  drives which song loads into the form.
- **A leaked deploy secret allows arbitrary commits** to the data file.
  Mitigated by HMAC over the body, the C4 safety check, and a
  narrowly-scoped PAT.

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
- [ ] D docs and D055 to D059
