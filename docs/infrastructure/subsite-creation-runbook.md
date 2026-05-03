# Subsite Creation Runbook

How to spin up a new gaggle subsite end-to-end on the IRG multisite, activate The Bulletin Local theme, verify the seeder ran, and surface the new gaggle on the main Astro site. **Montreal is the dry run** for this runbook; once we've used it to create one subsite cleanly, the same steps will apply to the remaining ~58.

This document supersedes any earlier ad-hoc instructions. If a step here disagrees with another doc or a chat suggestion, this is the source of truth — update it if reality changes.

## Prerequisites

- SSH access to Nixihost (`ssh nixihost-irg`)
- WP-CLI phar installed at `~/cms.raginggrannies.international/wp-cli.phar`. If not present, install once:
  ```bash
  ssh nixihost-irg "cd ~/cms.raginggrannies.international && curl -sO https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && chmod +x wp-cli.phar"
  ```
- A WP super admin username — currently `webgranny`. Confirm with `php wp-cli.phar super-admin list` from the WP install dir.
- This repo cloned locally on a machine running Node 22 (`nvm use 22`)
- `.env.local` populated with `PUBLIC_WP_URL`, `WP_USERNAME`, `WP_APP_PASSWORD`
- A multisite admin email forwarder set up for the gaggle (e.g. `montreal@raginggrannies.org` forwarding to the Web Granny until the gaggle takes ownership)

> **All `wp` commands below assume you are in `~/cms.raginggrannies.international` on the server, and that you invoke WP-CLI as `php wp-cli.phar`.** A handy shell alias is `alias wp='php ~/cms.raginggrannies.international/wp-cli.phar'`.

## Step 1: Create the subsite

If the subsite does not already exist, create it via WP-CLI on the server:

```bash
php wp-cli.phar site create --slug=<slug> --title="<Gaggle Name> Raging Grannies" --email=<slug>@raginggrannies.org
```

Replace `<slug>` and `<Gaggle Name>` (e.g. `montreal` and `Montreal`).

If the subsite was already created via the network admin UI, **skip this step**. Maya created Montreal that way — it works the same as far as Steps 2-3 are concerned.

The `--email` flag sets the per-subsite admin email. If you forget it (or used the UI without setting it), set it afterwards in network admin → Sites → `<slug>` → Settings → Admin Email.

## Step 2: Delete WP's default content

WP creates a `Hello world!` post and a `Sample Page` on every new subsite, regardless of whether it was created via WP-CLI or the UI. **You must delete these before activating the theme.** Otherwise:

- The seeder skips inserting the welcome Action post (it bails when any post is already published — see `inc/default-content.php:46-52`).
- You're left with WP's "Welcome to WordPress…" placeholder content showing on the gaggle's Actions list and a useless Sample Page in the menu.

```bash
# List to confirm IDs (typically 1 = Hello world!, 2 = Sample Page)
php wp-cli.phar post list --post_type=post,page --format=table \
  --url=cms.raginggrannies.international/<slug> --user=webgranny

# Delete (force = skip trash)
php wp-cli.phar post delete 1 2 --force \
  --url=cms.raginggrannies.international/<slug> --user=webgranny
```

If `wp post list` returns more than two rows, adjust the IDs.

## Step 3: Activate The Bulletin Local theme

```bash
php wp-cli.phar theme activate the-bulletin-local \
  --url=cms.raginggrannies.international/<slug> --user=webgranny
```

`wp theme activate` fires `after_switch_theme`, which is supposed to run the seeder. **In practice it doesn't** — the seeder gates on `current_user_can('manage_options')`, and WP-CLI's `--user` flag does not satisfy that check during `after_switch_theme`. The theme switches successfully but the seeder no-ops silently. Verified on Montreal 2026-05-03.

So Step 4 is **required**, not optional.

## Step 4: Force the seeder to run

```bash
php wp-cli.phar eval 'do_action("after_switch_theme");' \
  --url=cms.raginggrannies.international/<slug> --user=webgranny
```

When `do_action` is invoked from `wp eval` with `--user`, the user context is set up correctly and the seeder runs. The seeder is idempotent: it checks for existing slugs before creating anything, so re-running won't duplicate. It also won't insert the sample Action post if the gaggle has already published any posts (which is why Step 2 matters).

## Step 5: Verify the seeder ran

From your local repo:

```bash
nvm use 22
node scripts/verify-subsite.mjs <slug>
```

Expected on a freshly seeded subsite: **14 PASS, 1 WARN** (the admin email check WARNs because of a WP multisite permission quirk — see "Known caveats" below). If anything FAILs, do not proceed: the seeder didn't run correctly. Re-run Step 4 and verify again.

The script checks:

- REST root reachable + site name
- Listed in `/wp-json/irg/v1/subsites` (i.e. `public=1`)
- Active theme is `the-bulletin-local`
- All six seeded pages exist with correct templates (home, about, photos, videos, contact, actions)
- About page has the seeded boilerplate (>200 chars)
- Static front page is `home`, posts page is `actions`
- Permalink structure is `/%postname%/` (inferred from a post link)
- Sample "Welcome to Our Corner of the Movement" post is published
- `/graphql` endpoint responds with post data

## Step 6: Visual check

Visit `https://cms.raginggrannies.international/<slug>/` and confirm:

1. Homepage renders with hero area showing the gaggle name and tagline. The default tagline is the long one in `inc/template-functions.php:73`: *"Older women in flowered hats, singing truth to power and joy to the streets. We do not retire quietly."* If you'd prefer a different tagline (or a per-gaggle one), set it in WP admin → Appearance → Theme Options.
2. The sample "Welcome to Our Corner of the Movement" Action post appears in the Recent Actions section.
3. Nav shows: Home, About, Actions, Photos, Contact. **Videos appears only if a YouTube channel URL is set in Theme Options** — empty by default, which is fine.
4. The Songs pill in the nav links to `https://raginggrannies.international/songs/?gaggle=<Gaggle>`.
5. Footer "From the Network" links point to the main Astro site.
6. About page renders the seeded boilerplate.
7. Photos page renders empty without errors.
8. 404 page works (visit a nonexistent URL like `/<slug>/asdf/`).

## Step 7: Snapshot + push to update the main site

The main Astro site reads gaggle data from committed JSON snapshots, not from live WP at build time (the WP origin is bot-blocked from CF Pages by Imunify360). Re-running the snapshot is what makes the new gaggle visible on `raginggrannies.org`.

From the local repo:

```bash
nvm use 22
node scripts/snapshot-subsites.mjs
```

Expected output for Montreal as the third subsite:

```
[snapshot] received 3 subsites
  montreal             1 posts
  portland             25 posts
  seattle              1 posts
[snapshot] wrote 3 subsites to data/subsites.json
[snapshot] wrote 27 actions to data/actions.json
```

If the new subsite doesn't appear, it means `/wp-json/irg/v1/subsites` doesn't see it as public. Check network admin → Sites → `<slug>` → Settings → Public = Yes.

Then build, commit, push:

```bash
npm run build   # confirms the homepage compiles cleanly with the new data
git add data/subsites.json data/actions.json
git commit -m "data: snapshot subsites — add <Gaggle>"
git push
```

## Step 8: Verify on the CF Pages preview

After the deploy finishes (~1-2 minutes):

1. Visit `https://irg-8vx.pages.dev/`
2. Confirm the Recent Actions section now includes the new gaggle's "Welcome" post
3. The card should link to `https://cms.raginggrannies.international/<slug>/welcome-to-our-corner-of-the-movement/` and show the gaggle name as the label

## Known caveats

- **Admin email verify WARN.** `verify-subsite.mjs` will WARN that the admin email "is not exposed to this user." This is a WP multisite quirk: `/wp/v2/settings` filters out the `email` field for users who aren't explicit admins of that subsite, even for super admins. It's not a real failure. Verify the address in network admin → Sites → `<slug>` → Settings if you want to be sure.
- **Theme options start blank.** Tagline, hero image, and YouTube URL are all empty by default. The frontend uses template-level fallbacks for tagline (the long one above) and hero image (a bundled default), and hides the Videos nav item entirely when YouTube URL is empty. This is intentional — set them per-gaggle as needed.
- **The gaggle count on the main site does NOT change** when a subsite is created. The "active gaggles" number on the homepage reads from `data/gaggle-locations.json`, which is the canonical list of 61 gaggles in the world. Subsites count is a separate concern (number of gaggles with a site on the new system) and is exposed only via the snapshot.
- **No content migration.** This runbook assumes a clean-slate subsite. Migrating posts from old gaggle sites (especially Elementor-based ones like Montreal's old site, or the 72 Portland posts) is a separate workflow that doesn't exist yet.

## What NOT to do

- DO NOT modify The Bulletin Local theme as part of subsite creation. Theme changes happen in the repo (`wp-theme/the-bulletin-local/`) and ship via `node scripts/deploy-theme.mjs`.
- DO NOT touch `data/gaggle-locations.json` when creating a subsite. That file is the canonical world-list and is unrelated to which gaggles have sites.
- DO NOT rebuild the RAG embeddings (`build-rag-index.mjs`) just because you added a subsite. Actions data is not part of the chatbot corpus.
- DO NOT bulk-create the remaining ~58 subsites until Montreal has been through this runbook end-to-end and we've revised the doc with anything we learned.

## After Montreal

Montreal shipped 2026-05-03. The runbook above reflects what actually worked end-to-end (vs. the original plan, which assumed `wp theme activate` alone would seed and didn't account for WP's default Hello world! / Sample Page).

For bulk creation of the remaining ~58 gaggles, wrap Steps 1, 2, 3, 4 in a loop driven by `data/gaggle-locations.json`, then run Step 7 once at the end. A `scripts/bulk-create-subsites.mjs` could SSH each command in sequence; check Step 5 verify output before moving to the next gaggle.

Decision (claude.ai weighed in 2026-05-03): create all ~58 at once with the welcome placeholder content. The theme falls back gracefully on every page, the placeholder content is harmless, and having all subsites ready means when a gaggle contact responds you hand them a login instead of making them wait.
