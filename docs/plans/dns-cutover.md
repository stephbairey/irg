# DNS cutover runbook — launching raginggrannies.org

Written 2026-08-05 (D068). Executes the "Cut over DNS" item from the
original PoC plan. Decisions settled with Maya this date:

- The raginggrannies.org Cloudflare zone and the `irg` Pages project are in
  the **same Cloudflare account** (the easy path).
- Find a Gaggle links point at `cms.raginggrannies.international/<slug>/`
  for launch; the `<slug>.raginggrannies.org` subdomain pattern returns when
  the post-launch domain-mapping workstream lands. (Most of those subdomains
  have no DNS records today; a handful serve the old FastComet sites.)
- raginggrannies.net 301-redirects to `https://raginggrannies.org/songs/`
  (it was the song archive).
- raginggrannies.org MX moves to **Cloudflare Email Routing** at cutover,
  retiring FastComet mail + antispamcloud for this domain. This is also the
  fix for the mail outage: nothing forwarded through
  FastComet/antispamcloud has reached Gmail since 2026-05-08.

## What this cutover deliberately does NOT touch

- **The registrar / Kathleen Russell.** Nameservers stay
  `jobs`/`megan.ns.cloudflare.com`. Zero registrar action. (The deferred
  domain transfer is the only future item needing the owner.)
- **FastComet hosting.** Old gaggle sites, `maint.raginggrannies.org`
  (MainWP), and `staging.raginggrannies.org` keep their DNS records and keep
  working. FastComet just stops receiving hub traffic and mail. Retirement
  is gradual, per-gaggle, later.
- **The CMS domain.** WP admin stays at `cms.raginggrannies.international`.
  A `cms.raginggrannies.org` rename is cosmetic, risky (multisite
  search-replace), and indefinitely deferred.
- **Gaggle subdomain records** (`seattle.`, `portland.`, `calgary.`, …).
  They keep serving the old sites until each gaggle migrates. The hub no
  longer links to them.

## Step 0 — snapshot for rollback (before anything)

1. Cloudflare dashboard → raginggrannies.org zone → DNS → **Export zone
   file**. Save it. Do the same for raginggrannies.net.
2. Screenshot the Page Rules and any Rules/Redirects pages for both zones.

Rollback at any point = restore the apex/www records to their exported
values and re-enable the page rule. Propagation is instant (proxied records).

## Pre-flight (any time before launch day)

1. **Inventory FastComet forwarders.** cPanel (`nwpro4.fcomet.com:2083`) →
   Forwarders, for BOTH domains. Every alias found becomes an Email Routing
   route. Known so far: `connect@`, `songlibrarian@`, `webgranny@`,
   `portland@` (all @raginggrannies.org). Check for @raginggrannies.net
   aliases too.
2. **Turnstile hostnames.** Cloudflare dashboard → Turnstile → the IRG
   widget → add `raginggrannies.org` and `www.raginggrannies.org` to
   allowed hostnames. Forms (submit, edit, contact, feedback) break at
   launch if this is missed.
3. **Configure Email Routing without enabling it.** Zone → Email →
   Email Routing: create each route (alias → destination Gmail), and have
   each destination address confirm Cloudflare's verification email.
   Do not let it rewrite MX yet.
4. **SPF audit.** Current TXT is `v=spf1 include:spf.antispamcloud.com
   -all`. The old sites send via WPMail SMTP through Gmail/Sendinblue —
   check the zone for Sendinblue/Brevo DKIM or SPF includes and keep any
   that are in use. At cutover the SPF becomes
   `v=spf1 include:_spf.mx.cloudflare.net <keep-live-senders> ~all`.
5. Confirm the latest deploy is green on `irg-8vx.pages.dev` (it carries
   the cms-path gaggle links shipped with this runbook).

## Launch day (~30 minutes)

1. **Custom domains.** Workers & Pages → `irg` project → Custom domains →
   add `raginggrannies.org`, then `www.raginggrannies.org`. Same-account
   zone: Cloudflare replaces the existing A/CNAME records itself and issues
   certs. Wait for both to show Active.
2. **Delete the "Cache Everything" page rule** on raginggrannies.org (it
   would pin stale HTML on top of Pages' own caching). Auto Minify is
   already retired as a Cloudflare product; nothing to do there.
3. **Enable Email Routing** (this flips MX to Cloudflare and removes the
   FastComet MX). Update the SPF TXT per the pre-flight audit. Leave DKIM
   records for any still-active senders.
4. **.net redirect.** raginggrannies.net zone → Bulk Redirects (or a
   Redirect Rule): `*raginggrannies.net/*` → `https://raginggrannies.org/songs/`,
   301, preserve nothing. The old song site becomes unreachable by design;
   FastComet still hosts the files if anything needs retrieving.

## Verify (immediately after)

- `https://raginggrannies.org/` serves the Astro site (check header
  placeholder logo to be sure it's the new one), `www` redirects/serves,
  a song page and its songsheet PDF load.
- Submit the live contact form once. The email arriving at
  webgranny@gmail.com verifies Email Routing AND closes the mail-outage
  item in one shot. Then open a feedback widget and send one; same proof
  for Turnstile-on-the-new-hostname.
- `https://raginggrannies.net/anything` 301s to the song library.
- Find a Gaggle links open the new subsites at
  `cms.raginggrannies.international/<slug>/`.
- Search Console: submit `https://raginggrannies.org/sitemap-index.xml`.

## Post-launch workstreams (tracked, not launch-blocking)

- **Gaggle subdomain mapping**: `*.raginggrannies.org` → Nixihost with
  per-subsite domain mapping and certs; then switch Find a Gaggle links
  back to subdomains. Coordinate per-gaggle with old-site retirement.
- Old-infra retirement: per-gaggle FastComet sites, then MainWP, then the
  hosting plan itself. Mail is already off FastComet after this cutover.
- Deep-map old raginggrannies.net song URLs to new song slugs (nice-to-have
  over the blanket /songs/ redirect).
- Domain transfer away from Kathleen's registrar account (deferred; needs
  the owner).

## Execution log

**2026-08-30** — Step 0 + pre-flight done (Maya): FastComet full backup
downloaded; cPanel forwarder export in `\rollback` (six real aliases on
raginggrannies.org, all → webgranny@gmail.com; every other domain was
fail/blackhole); zone files exported; Turnstile hostnames added.

Email Routing brought live EARLY (ahead of the site cutover — mail had
been dead since May, so there was nothing to protect): active on BOTH
zones. No per-alias rules; single catch-all → webgranny@gmail.com covers
all six aliases identically (deliberate; not an outstanding task).
Gotcha: the wizard's "remove conflicting records in place" detects the
FastComet MX / antispamcloud SPF conflict but refuses to activate —
delete the records manually, then Activate. Sender audit: antispamcloud
was the only SPF include; no Brevo/Sendinblue records; wizard SPF
accepted as-is. Verified: test mail reaches webgranny@gmail.com.
Testing note: send from a non-Gmail, non-Nixihost account (Gmail drops
same-origin forwarded copies on duplicate Message-ID; bairey.com mail is
delivered locally by Nixihost and never reaches Cloudflare).

Deferred post-launch: Gmail never-spam filter for *@raginggrannies.org;
review old anti-WP-noise filters; outbound "Send mail as" via SMTP relay
(Email Routing is receive-only).

**2026-08-30/31 — cutover partially executed, PAUSED at the apex.**

Done:
- Turnstile hostnames added (org + www).
- Email Routing LIVE on both zones (see entry above): catch-all →
  webgranny@gmail.com, verified working.
- `www.raginggrannies.org` custom domain Active and serving the Astro
  site.
- "Cache Everything" page rule on www: toggled OFF (disabled, not
  deleted — delete at leisure).
- raginggrannies.net Bulk Redirect list + rule deployed and working
  (org, www, deep paths all 301). OPEN ITEM: the deployed rule was still
  PRESERVING path suffixes on last test (`/tag/x` →
  `raginggrannies.org/songs/tag/x`), against the intended flat →
  `/songs/`. Maya re-saved "Preserve path suffix" off; RE-VERIFY.
  Decision (Maya): no 1:1 song-URL mapping ever — old links renew via
  Google re-crawl.

NOT done — the apex, paused for a step-back on subsites:
- `raginggrannies.org` apex still serves the OLD FastComet site
  (`x-turbo-charged-by: LiteSpeed` header is the tell).
- Blocker found by Maya in the zone export: FIFTEEN subdomains are
  CNAME → apex (proxied) and would follow the apex to Pages and break.
  Plan agreed (full detail + probe inventory in
  `letter-to-claude-ai-apex-cutover.md` beside this file):
  1. Pin the 7 live ones as A → 45.33.84.79 proxied: portland, seattle,
     calgary, montreal, westernmass, maint, mail. (portland is the
     critical one: live PRG site + newsletter logo hotlink.)
  2. Leave dead placeholders (bnb, international, lethbridge,
     maintenance, testing-donotdelete) and already-broken
     *.staging.* unpinned — they follow the apex and error; fine.
  3. Delete the apex A 45.33.84.79 only.
  4. Add `raginggrannies.org` under the Pages project's custom domains.
  5. Do NOT change the zone SSL/TLS mode.
  Maya is executing this via a claude.ai session with the letter.

After the apex flips, the terminal Claude runs the verify pass:
- apex serves Astro (no LiteSpeed header), www ok, song page loads,
  .net redirect lands FLAT on /songs/, pinned subdomains still serve
  FastComet sites (esp. portland + its newsletter logo URL).
- Maya: contact form + feedback widget test from a NON-Gmail,
  non-Nixihost sender; Search Console: submit
  https://raginggrannies.org/sitemap-index.xml.

Post-launch punch list added during execution:
- NEW SITE HAS NO 404 PAGE: Cloudflare Pages serves the homepage with
  HTTP 200 for every unknown path (soft-404). Add `src/pages/404.astro`
  — matters for the Google renewal of old song URLs.
- Delete the disabled www page rule; delete dead subdomain DNS records
  when convenient.
- Mail deferred items (see entry above): never-spam filter, old filter
  review, outbound "Send mail as" via SMTP relay.
