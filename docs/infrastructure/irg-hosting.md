# IRG Hosting Infrastructure

Reference for infrastructure details. **No credentials in this file.** Passwords and secrets live in `.env.local` (local dev) and hosting dashboards (production).

## WordPress Multisite (CMS)

- **URL**: https://cms.raginggrannies.international
- **WP Version**: 6.9.4
- **Configuration**: WordPress Multisite (subdirectory mode)
- **Host**: Nixihost (dedicated IRG account, separate from Maya's personal hosting)
- **Server**: iah-s04.nixihost.com
- **Server IP**: 23.187.248.21
- **cPanel**: https://iah-s04.nixihost.com:2083/
- **Hosting plan**: Mini Shared
- **Nameservers**: ns121.nixihost.com, ns122.nixihost.com
- **Database name**: raginggr_cms
- **Database user**: raginggr_cms
- **Database host**: localhost
- **PHP version**: (check cPanel → MultiPHP Manager)

## WPGraphQL endpoint (once installed)

- **Main site**: https://cms.raginggrannies.international/graphql
- **Portland subsite**: https://cms.raginggrannies.international/portland/graphql
- **Pattern**: https://cms.raginggrannies.international/{gaggle-slug}/graphql

## Frontend (Astro on Cloudflare Pages)

- **Production URL (eventual)**: https://raginggrannies.org
- **Staging URL**: (Cloudflare Pages default, e.g. irg.pages.dev — created when CF Pages is connected)
- **Repo**: github.com/stephbairey/irg

## Existing sites (migration sources)

- **International hub**: https://raginggrannies.org (FastComet, WP)
- **Song archive**: https://raginggrannies.net (FastComet, WP)
- **Portland gaggle**: https://portland.raginggrannies.org (FastComet, WP multisite subsite)
- **Seattle gaggle**: https://raginggrannies.org/seattle/ (FastComet, WP multisite subsite)
- **Staging (previous attempt)**: https://staging.raginggrannies.org (FastComet)

## DNS — current state

raginggrannies.org and raginggrannies.net are currently on FastComet. DNS cutover to Cloudflare Pages (frontend) and Nixihost (CMS) happens after the PoC is proven. Do not touch production DNS until ready.

raginggrannies.international is on Nixihost and active now (development domain).

## SSL

Activate Let's Encrypt via cPanel for cms.raginggrannies.international. Cloudflare Pages handles SSL automatically for the frontend domain.
