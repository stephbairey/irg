# Homepage songs refresh (IRGC, August 2026)

Written 2026-08-28. Replaces the plan lost with the previous session.

## The ask

IRGC supplied two Word docs (`SONGS FOR WEBSITE HOME PAGE For July 27
ZOOM.docx`, 14 songs; `Songs for Website Front Page.docx`, 7 songs, all
Seattle). The songs currently featured on the homepage should stop showing
there; the 21 songs in the docs should be in the library and be the ones
that show.

## What the audit found (2026-08-28)

**All 21 titles already exist in the library**, but the docs are edited
versions in about half the cases. Nothing needs importing from scratch
except one variant; the rest is lyrics updates plus metadata fixes.
Full line-by-line diff: `docs/plans/homepage-songs-refresh-diff.txt`.

**Identical lyrics, metadata only (7):** `do-you-hear-the-women-sing`,
`to-save-the-earth`, `hey-look-us-over`, `when-we-see-injustice-we-show-up`,
`criminal-grans`, `peace-peace` (tune missing), `grab-your-hat-little-granny`.

**Cosmetic only (4):** `the-grannies-twist` (chorus markers, "Tells us"
typo), `cheer-for-choice` (`[Verse n]` markers), `wont-know-much`
(`[bridge:]`), `gaggle-make-good-trouble` (stray credit line; tune missing).

**Real lyric edits, doc is the revision (8):**
- `one-human-family`: 3 lines, drops the Memorial Day reference
- `the-raging-grannies-handy-dandy-...`: 3 lines updated to current issues
- `when-raging-grans-come-marching-in`: 4 lines polished
- `raging-grannies-strong`: "poor folks" edit; "REPEAT CHORUS #1 or #2"
- `were-rising-up`: "Seattle" → "[name your town]"; credits Vicki Ryder
  (Triangle) vs lib Unlisted/Seattle
- `people-power`: ~10 lines; "Moral March" verse removed; chorus #1/#2
- `were-not-giving-up`: substantially rewritten, two new verses, adds
  Vicki Ryder as co-writer
- `granny-with-an-attitude`: 3 wording edits, drops "from the E-Vine"

**New version of a song family (1):** Radical Environmentalists. Kay
Thode original, Vicki Ryder + Triangle revision. None of the four library
variants match (closest shares 7 of 23 lines). Create as a new song.

**Doc shorter than library (1):** `hokus-pokus`, library has an extra
fashion/high-heels verse the doc dropped.

## Three things the ask collides with

### 1. Nine of the 21 are Seattle songs, and Seattle is hidden from central (D052)

`data/central-hidden-gaggles.json` excludes Seattle from every Astro song
surface. The homepage picks from `fetchAllSongs()`, so a Seattle song can
never be featured today, and if it were, its `/songs/<slug>/` link would
404. The second doc is Seattle's own submission, so Seattle evidently
consents to these specific songs being public.

Options:
- **(a) Per-song override: `feature_on_homepage` also exempts the song from
  the hidden-gaggle filter.** The 9 songs get central `/songs/` pages and
  show on the homepage; the other ~439 Seattle songs stay hidden. Small
  change in `src/lib/songs.ts` `loadFromJson()` + `generate-llms-txt.mjs`
  + theme mirror comment. This is D052's stated "per-song control" revisit
  condition. New decision D069.
- **(b) Retag those 9 songs** to a non-hidden gaggle. Wrong: they are
  Seattle songs.
- **(c) Drop the 9 Seattle songs** from the homepage pool. Contradicts the
  committee.

Recommendation: (a).

### 2. The length window excludes 17 of the 21

`pickFeatured()` requires 175-195 words (fallback 165-205). The committee's
list runs 59-264 words; only #6, #7, #10, #14 pass. Keeping the window
would silently feature four songs and ignore the rest.

Options:
- **(a) Drop the word-count filter; allowlist only.** Cap the excerpt
  (already 32 lines via `lyricExcerpt()`); short songs just render short.
  Update D054 wording.
- **(b) Keep the window as a soft preference** (tight pool first, fall back
  to the whole allowlist). Still biases toward the four, which is not what
  the committee asked for.

Recommendation: (a). The window existed to keep the column tidy when the
pool was ~1400 songs; with a curated pool of 21 it has no job.

### 3. Ten songs have revised lyrics in the docs

The 8 real edits above plus the 4 cosmetic ones (worth pushing while we
are there) and the new Radical Environmentalists. Hokus Pokus differs the
other way (lib has a verse the doc lacks). Copy normalization
is needed: convert doc text to the lyrics HTML convention the library uses
(`<p>` per stanza, `<br>` per line, chorus indentation, "REPEAT CHORUS"
markers), then push via `admin-bulk-edit-songs` (`lyrics_set`). The
"italics = change for your gaggle" note on #3 and #6 needs an HTML `<em>`
or a `source_notes` line, since the docx italics were lost in extraction.

Decision: which text wins when doc and library disagree? Assume the doc
(it is the committee's approved copy) unless Maya says otherwise. For #18
Hokus Pokus, assume the doc (drop the extra verse) for the same reason.

## Metadata fixes surfaced by the audit (do regardless)

- #6 `raging-grannies-strong`: gaggle "Unknown" → "UnCon" or leave as
  collective? Songwriter "Unknown" → "UnCon Grannies 2016"; keep
  `source_notes` chorus credit. Maya's call on the gaggle term.
- #8 `were-rising-up`: writer "Unlisted Songwriter" → "Vicki Ryder"; gaggle
  Seattle vs doc's Triangle. Add Triangle (`gaggle_add`), keep Seattle.
- #14 `were-not-giving-up`: add Vicki Ryder as co-writer.
- #17 `criminal-grans`: writer stays Unlisted (doc has no credit).
- #19, #20, #21: set tune ("Side by Side", "Rose, Rose, Rose Red", "Rap").
  The bulk endpoint has no `tune` key; use `edit-song` (needs Turnstile +
  password) or add `tune_set` to the bulk endpoint (plugin bump). Prefer
  adding `tune_set`; it is three lines next to `gaggle_add`.
- #12: 10 issue terms is over-tagging; leave, out of scope.
- #2: create the Triangle revision as a new song `radical-environmentalists`
  (gaggle Triangle, writers Kay Thode + Vicki Ryder, tune "She'll Be Comin'
  'Round the Mountain", source_notes "Original by Kay Thode (Seattle);
  revised by Vicki Ryder and Triangle Raging Grannies"). Create by hand in
  WP admin (one song) or via `edit-song` without `post_id` if it supports
  create. Hand entry is fine.

## Execution order

1. **Decide** items 1-3 above and the #6 gaggle term. Log as D069 (Seattle
   per-song override) and D070 (length window dropped) in `DECISIONS.md`.
2. **Normalize copy** for the 12 changed songs + Radical Environmentalists into lyrics HTML.
   Cowork or Claude; output lands in `data/homepage-refresh/lyrics/<slug>.html`
   for review before pushing. (Scratch, gitignored, or committed as an
   audit trail; committed is better.)
3. **Plugin**: add `tune_set` (and `songwriters_set`? `to_songwriter`
   already exists) to `admin-bulk-edit-songs`. Bump version, `node
   scripts/deploy-plugin.mjs`.
4. **Push metadata + lyrics** with a one-off `scripts/homepage-refresh.mjs`
   driven by a committed `data/homepage-refresh/changes.json` (post_id,
   lyrics_set, to_songwriter, gaggle_add, tune_set, source_notes). Plan
   mode first, then `--apply`.
5. **Create #2** in WP admin.
6. **Flip flags**: `node scripts/approve-homepage-songs.mjs --file
   data/homepage-refresh/old-featured.txt --unapprove --apply` (the 36
   current slugs, captured 2026-08-28 in that file), then `--file
   data/homepage-refresh/new-featured.txt --apply` (the 21).
7. **Frontend**: `src/lib/songs.ts` per-song override of the hidden filter;
   `src/pages/index.astro` drop the word-count filter; mirror both in
   `scripts/list-homepage-candidates.mjs` and `scripts/generate-llms-txt.mjs`.
   Theme `tbl_hidden_from_central()` comment updated (behavior unchanged:
   subsite still shows everything).
8. `npm run snapshot`, verify 21 featured / 0 old in the JSON, `npm run
   build`, spot-check that a Seattle song renders at `/songs/<slug>/` and
   that non-featured Seattle songs still 404.
9. Commit, push, confirm on `irg-8vx.pages.dev` (or `raginggrannies.org`
   if the cutover has landed by then).

## Out of scope

The DNS cutover (D068) and workstream C are separate. This refresh works
on whichever domain is live.

## Status: shipped 2026-08-28

Decisions (Maya, 2026-08-28): Seattle songs on the list are published
(per-song override, D069); all 36 previous flags cleared; length window
dropped (D070); doc text wins including the Hokus Pokus verse; Claude did
the normalization. Bulk endpoint extensions logged as D071 (plugin 3.19.0).

Executed: plugin 3.19.0 deployed → 36 unapproved → 21 applied (14 lyrics,
1 created: "Radical Environmentalists" #6390, Triangle) → snapshot → build
verified (21 in pool, matches `new-featured.txt`; Seattle featured songs
render at `/songs/<slug>/`, other Seattle songs still absent; llms corpus
includes the new song).

Gotcha found: `tune_set` splits on commas (same helper as submit-song), so
"Rose, Rose, Rose Red" became three terms. Re-set as "Rose Rose Rose Red".
The orphan `Rose` and `Rose Red` tune terms are empty and can be deleted in
WP admin (Songs → Tunes) at leisure; nothing renders them.

Unrelated drift picked up by the snapshot: the librarian renamed the
"Gender Equity" issue to "Gender Issues" in WP (140+ songs) and one song
was deleted (1470 → 1469) since the 2026-08-05 snapshot.

Not done: `raging-grannies-strong` keeps gaggle "Unknown" (it is a
collective UnCon song; no decision taken). `one-human-family` keeps
Rosalia Haduch as co-writer although the doc credits Vicki Ryder alone.
