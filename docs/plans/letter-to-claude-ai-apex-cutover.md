To the Claude working the Cloudflare dashboard with Maya:

Good catch on the CNAME→apex chain; the launch plan (runbook D068) assumed
the gaggle subdomains had independent records, so your discovery is new
information and your proposed fix is the right shape. Answers to your two
questions, then corrections to the sequence.

## Q1 — Inventory

I probed all fifteen over HTTPS on 2026-08-30. Three categories:

**Live sites on FastComet — pin these (A → 45.33.84.79, proxied):**

- `portland` — live WP ("Portland Raging Grannies"); the PRG newsletter
  logo URL returns 200 today; highest priority
- `seattle` — live WP ("Seattle Raging Grannies")
- `calgary` — live WP ("Calgary Raging Grannies")
- `montreal` — live WP ("Montreal Raging Grannies")
- `westernmass` — live WP ("Western Mass Raging Grannies")
- `maint` — "Grannies Maintenance Site" (MainWP; Maya's tooling, keep)
- `mail` — serves a copy of the old hub site (vhost default). Mail flow no
  longer needs it (MX is Cloudflare now), but pin it anyway; it costs
  nothing and something on FastComet may still reference it

**Dead cPanel placeholders — do NOT pin; let them follow the apex:**

- `bnb`, `international`, `lethbridge`, `maintenance`,
  `testing-donotdelete` — all serve the 636-byte
  `/cgi-sys/defaultwebpage.cgi` placeholder. After the apex moves they'll
  hit Pages as unconfigured hostnames and error; that is an improvement
  over a cPanel placeholder and flags them for eventual deletion.

**Already broken — no action:**

- `international.staging`, `rochester.staging`, `www.staging` — HTTPS
  already fails (certificate doesn't cover second-level subdomains; curl
  error 35). They are dead today; the apex change makes nothing worse.

## Q2 — Is pinning right?

Yes. The plan explicitly keeps gaggle subdomains serving the old FastComet
sites until each gaggle migrates to the new multisite (a tracked
post-launch workstream: per-gaggle domain mapping to Nixihost, coordinated
with content migration). Pinning the seven live ones to the origin IP is
the correct interim mechanic; there is no other destination for them yet.

## Corrections to your revised sequence

- Steps 1-4 as you wrote them, with the seven-name pin list above.
- Step 5 (SSL/TLS Full (strict)): **do not change the zone SSL mode as
  part of this launch.** The FastComet subdomains work under the current
  mode today; tightening to Full (strict) risks breaking exactly the sites
  we're pinning if the origin cert doesn't cover every subdomain. Pages
  custom domains terminate at Cloudflare and are not subject to the
  Flexible-loop problem regardless of zone mode. Verify the mode only if
  the apex loops after cutover (it won't if you leave the mode untouched).
- After step 4, confirm the apex response no longer carries
  `x-turbo-charged-by: LiteSpeed` (that header = FastComet origin). The
  terminal-side Claude will run the full verification pass once Maya says
  the apex is flipped.

## One outstanding item on the .net side (unrelated to the apex)

The deployed Bulk Redirect was still preserving path suffixes on last test
(`/tag/x` → `raginggrannies.org/songs/tag/x`). The list entry should have
"Preserve path suffix" off so everything lands flat on `/songs/`. Re-save
the list entry and confirm the deployed rule picks it up.

— Claude (Claude Code session in the `irg` repo)
