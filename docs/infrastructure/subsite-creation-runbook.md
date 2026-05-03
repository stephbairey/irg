# Subsite Creation Runbook

How to spin up a new gaggle subsite end-to-end on the IRG multisite, activate The Bulletin Local theme, verify the seeder ran, and surface the new gaggle on the main Astro site. **Montreal is the dry run** for this runbook; once we've used it to create one subsite cleanly, the same steps will apply to the remaining ~58.

This document supersedes any earlier ad-hoc instructions. If a step here disagrees with another doc or a chat suggestion, this is the source of truth — update it if reality changes.

## Prerequisites

- SSH access to Nixihost with WP-CLI available
- A WP super admin username (referred to below as `<super_admin>`)
- This repo cloned locally on a machine running Node 22 (`nvm use 22`)
- `.env.local` populated with `PUBLIC_WP_URL`, `WP_USERNAME`, `WP_APP_PASSWORD`
- A multisite admin email forwarder set up for the gaggle (e.g. `montreal@raginggrannies.org` forwarding to the Web Granny until the gaggle takes ownership)

## Step 1: Create the subsite

On the server, via WP-CLI:

```bash
wp site create --slug=<slug> --title="<Gaggle Name> Raging Grannies" --email=<slug>@raginggrannies.org
```

Replace `<slug>` and `<Gaggle Name>` (e.g. `montreal` and `Montreal`).

The `--email` flag sets the per-subsite admin email. If you forget it, you can set it afterwards in network admin → Sites → `<slug>` → Settings → Admin Email.

## Step 2: Activate The Bulletin Local theme

```bash
wp theme activate the-bulletin-local --url=cms.raginggrannies.international/<slug> --user=<super_admin>
```

**The `--user` flag is not optional.** The theme's default-content seeder (`inc/default-content.php`) gates on `current_user_can('manage_options')`. WP-CLI runs without a logged-in user by default, which silently fails the check and no-ops the seeder. Always pass `--user=<super_admin>`.

## Step 3: Trigger the seeder if needed

`wp theme activate` fires `after_switch_theme`, which runs the seeder. If you ever need to re-trigger it (e.g. after deploying a theme update that adds new default pages), use:

```bash
wp eval 'do_action("after_switch_theme");' --url=cms.raginggrannies.international/<slug> --user=<super_admin>
```

The seeder is idempotent: it checks for existing slugs before creating anything, so re-running won't duplicate. It also won't insert the sample Action post if the gaggle has already published any posts.

## Step 4: Verify the seeder ran

From your local repo:

```bash
nvm use 22
node scripts/verify-subsite.mjs <slug>
```

Expected on a freshly seeded subsite: **13 PASS, 1 WARN** (the admin email check WARNs because of a WP multisite permission quirk — see "Known caveats" below). If anything FAILs, do not proceed: the seeder didn't run correctly. Re-run Step 3 with `--user=<super_admin>` and verify again.

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

## Step 5: Visual check

Visit `https://cms.raginggrannies.international/<slug>/` and confirm:

1. Homepage renders with hero area showing the gaggle name and tagline. The default tagline is the long one in `inc/template-functions.php:73`: *"Older women in flowered hats, singing truth to power and joy to the streets. We do not retire quietly."* If you'd prefer a different tagline (or a per-gaggle one), set it in WP admin → Appearance → Theme Options.
2. The sample "Welcome to Our Corner of the Movement" Action post appears in the Recent Actions section.
3. Nav shows: Home, About, Actions, Photos, Contact. **Videos appears only if a YouTube channel URL is set in Theme Options** — empty by default, which is fine.
4. The Songs pill in the nav links to `https://raginggrannies.international/songs/?gaggle=<Gaggle>`.
5. Footer "From the Network" links point to the main Astro site.
6. About page renders the seeded boilerplate.
7. Photos page renders empty without errors.
8. 404 page works (visit a nonexistent URL like `/<slug>/asdf/`).

## Step 6: Snapshot + push to update the main site

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

## Step 7: Verify on the CF Pages preview

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

Once Montreal is fully shipped (Steps 1-7 all green) and the runbook is updated with anything we learned, the same steps apply to the remaining gaggles. Bulk creation can be scripted by wrapping Steps 1-3 in a loop driven by `data/gaggle-locations.json`, then running Step 6 once at the end.

Decide before bulk creation: do we want all ~58 remaining gaggles created at once with `welcome-to-our-corner-of-the-movement` placeholder content, or only those whose Web Granny contact has been confirmed?
