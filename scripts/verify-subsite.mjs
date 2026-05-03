#!/usr/bin/env node
// Probe a subsite's REST + GraphQL endpoints to confirm the Bulletin Local
// theme's default-content seeder ran correctly. Use after creating a new
// gaggle subsite to catch silent failures (e.g. WP-CLI without --user
// running the seeder under a logged-out session).
//
// Usage:
//   node scripts/verify-subsite.mjs montreal
//   node scripts/verify-subsite.mjs              # defaults to "montreal"
//
// Exits 0 if all checks pass, 1 if any FAIL. WARNs don't fail the run.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  return { ...env, ...process.env };
}

const env = loadEnv();
const BASE = (env.PUBLIC_WP_URL || "").replace(/\/$/, "");
const USER = env.WP_USERNAME;
const PASS = env.WP_APP_PASSWORD?.replace(/\s/g, "");
if (!BASE) {
  console.error("Missing PUBLIC_WP_URL (set in .env.local)");
  process.exit(2);
}
if (!USER || !PASS) {
  console.error("Missing WP_USERNAME / WP_APP_PASSWORD (set in .env.local) — needed for authenticated checks");
  process.exit(2);
}
const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

const slug = process.argv[2] || "montreal";
const SITE = `${BASE}/${slug}`;
const EXPECTED_ADMIN_EMAIL = `${slug}@raginggrannies.org`;
const EXPECTED_THEME = "the-bulletin-local";
const EXPECTED_PAGES = [
  { slug: "home",    template: "" },
  { slug: "about",   template: "" },                     // about needs content too
  { slug: "photos",  template: "page-photos.php" },
  { slug: "videos",  template: "page-videos.php" },
  { slug: "contact", template: "page-contact.php" },
  { slug: "actions", template: "" },
];
const EXPECTED_SAMPLE_SLUG = "welcome-to-our-corner-of-the-movement";

let passes = 0;
let fails = 0;
let warns = 0;

function pass(label, detail = "") {
  console.log(`  PASS  ${label}${detail ? "  — " + detail : ""}`);
  passes++;
}
function fail(label, detail = "") {
  console.log(`  FAIL  ${label}${detail ? "  — " + detail : ""}`);
  fails++;
}
function warn(label, detail = "") {
  console.log(`  WARN  ${label}${detail ? "  — " + detail : ""}`);
  warns++;
}
function section(name) {
  console.log(`\n[${name}]`);
}

async function getJson(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      Accept: "application/json",
      "User-Agent": "irg-verify/1.0",
      ...(opts.headers || {}),
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {}
  return { res, body };
}

async function getJsonAuth(url, opts = {}) {
  return getJson(url, {
    ...opts,
    headers: { Authorization: AUTH, ...(opts.headers || {}) },
  });
}

console.log(`=== Verifying "${slug}" at ${SITE} ===`);

// 1. REST root reachable
section("reachability");
let restRoot = null;
{
  const { res, body } = await getJson(`${SITE}/wp-json/`);
  if (res.ok && body?.name) {
    restRoot = body;
    pass("REST root responds", `name="${body.name}"`);
  } else {
    fail("REST root", `HTTP ${res.status}`);
  }
}

// 2. Listed in irg/v1/subsites + admin email
section("multisite registration");
{
  const { res, body } = await getJson(`${BASE}/wp-json/irg/v1/subsites`);
  if (res.ok && Array.isArray(body)) {
    const entry = body.find((s) => s?.slug === slug);
    if (entry) {
      pass(`Listed in /wp-json/irg/v1/subsites`, `id=${entry.id}, name="${entry.name}"`);
    } else {
      fail(`Not listed in /wp-json/irg/v1/subsites`, `subsite may be private or not yet registered`);
    }
  } else {
    fail("Could not read /wp-json/irg/v1/subsites", `HTTP ${res.status}`);
  }
}

// 3. Settings — admin email, front + posts page
let settings = null;
{
  const { res, body } = await getJsonAuth(`${SITE}/wp-json/wp/v2/settings`);
  if (res.ok && body) {
    settings = body;
    if (body.email === EXPECTED_ADMIN_EMAIL) {
      pass(`Admin email`, body.email);
    } else if (typeof body.email === "string" && body.email.length > 0) {
      warn(`Admin email`, `expected ${EXPECTED_ADMIN_EMAIL}, got ${body.email}`);
    } else {
      // /wp/v2/settings on a subsite filters out `email` for users who aren't
      // explicitly admins of that subsite (super-admin status alone isn't
      // enough). Verify via the WP admin UI instead.
      warn(`Admin email`, `not exposed to this user — verify in network admin → Sites → ${slug} → Settings`);
    }
  } else {
    fail("Could not read settings", `HTTP ${res.status} (auth may be missing or insufficient)`);
  }
}

// 4. Active theme
section("active theme");
{
  const { res, body } = await getJsonAuth(`${SITE}/wp-json/wp/v2/themes?status=active`);
  if (res.ok && Array.isArray(body)) {
    const active = body[0];
    if (active?.stylesheet === EXPECTED_THEME) {
      pass(`Active theme`, `${EXPECTED_THEME} v${active?.version || "?"}`);
    } else {
      fail(`Active theme`, `expected ${EXPECTED_THEME}, got ${active?.stylesheet || "unknown"}`);
    }
  } else {
    fail("Could not read /wp/v2/themes", `HTTP ${res.status}`);
  }
}

// 5. Seeded pages
section("seeded pages");
const pageIdBySlug = new Map();
{
  // /wp/v2/pages doesn't expose templates without context=edit. Use auth + edit context.
  const { res, body } = await getJsonAuth(
    `${SITE}/wp-json/wp/v2/pages?per_page=50&context=edit&status=any&_fields=id,slug,title,status,template,content`,
  );
  if (res.ok && Array.isArray(body)) {
    const bySlug = new Map(body.map((p) => [p.slug, p]));
    for (const exp of EXPECTED_PAGES) {
      const p = bySlug.get(exp.slug);
      if (!p) {
        fail(`Page "${exp.slug}"`, "missing — seeder may not have run");
        continue;
      }
      pageIdBySlug.set(exp.slug, p.id);
      const detail = [`id=${p.id}`, `status=${p.status}`];
      if (exp.template) {
        if (p.template === exp.template) {
          detail.push(`template=${p.template}`);
        } else {
          warn(
            `Page "${exp.slug}" template`,
            `expected ${exp.template}, got "${p.template || "(none)"}"`,
          );
        }
      }
      if (p.status !== "publish") {
        warn(`Page "${exp.slug}" status`, `expected publish, got ${p.status}`);
      }
      // About page should have non-trivial seeded content
      if (exp.slug === "about") {
        const len = (p.content?.raw || "").length;
        if (len < 200) {
          warn(`Page "about" content length`, `${len} chars — boilerplate may be missing`);
        } else {
          detail.push(`content=${len} chars`);
        }
      }
      pass(`Page "${exp.slug}"`, detail.join(", "));
    }
  } else {
    fail("Could not read /wp/v2/pages", `HTTP ${res.status}`);
  }
}

// 6. Settings cross-check (front page, posts page, permalinks)
section("settings");
if (settings) {
  const homeId = pageIdBySlug.get("home");
  const actionsId = pageIdBySlug.get("actions");
  if (settings.show_on_front === "page" && homeId && Number(settings.page_on_front) === homeId) {
    pass(`Static front`, `home (id=${homeId})`);
  } else {
    fail(
      `Static front`,
      `show_on_front=${settings.show_on_front}, page_on_front=${settings.page_on_front}, expected home id=${homeId}`,
    );
  }
  if (actionsId && Number(settings.page_for_posts) === actionsId) {
    pass(`Posts page`, `actions (id=${actionsId})`);
  } else {
    fail(
      `Posts page`,
      `page_for_posts=${settings.page_for_posts}, expected actions id=${actionsId}`,
    );
  }
  // /wp/v2/settings doesn't expose permalink_structure. Infer from any
  // published post's link: with /%postname%/ the link ends in /<slug>/ and
  // contains no `?p=` or `/YYYY/MM/` segments.
  const { res: postsRes, body: postsBody } = await getJson(
    `${SITE}/wp-json/wp/v2/posts?per_page=1&_fields=link,slug`,
  );
  if (postsRes.ok && Array.isArray(postsBody) && postsBody[0]?.link && postsBody[0]?.slug) {
    const link = postsBody[0].link;
    const slugSegment = `/${postsBody[0].slug}/`;
    const looksPostnameOnly =
      link.endsWith(slugSegment) && !/\/\d{4}\/\d{2}\//.test(link) && !link.includes("?p=");
    if (looksPostnameOnly) {
      pass(`Permalinks`, "/%postname%/ (inferred from sample post link)");
    } else {
      fail(`Permalinks`, `sample post link does not match /%postname%/: ${link}`);
    }
  } else {
    warn(`Permalinks`, "no posts to infer from — check Settings → Permalinks manually");
  }
}

// 7. Sample Action post
section("sample post");
{
  const { res, body } = await getJson(
    `${SITE}/wp-json/wp/v2/posts?slug=${EXPECTED_SAMPLE_SLUG}&_fields=id,slug,status,title`,
  );
  if (res.ok && Array.isArray(body) && body.length === 1) {
    const post = body[0];
    if (post.status === "publish") {
      pass(`Sample Action post`, `"${post.title?.rendered || post.slug}" id=${post.id}`);
    } else {
      warn(`Sample Action post status`, `${post.status}`);
    }
  } else if (res.ok && Array.isArray(body) && body.length === 0) {
    warn(
      `Sample Action post`,
      `not found at slug=${EXPECTED_SAMPLE_SLUG} — gaggle may have already published their own posts (this is fine)`,
    );
  } else {
    fail("Could not read /wp/v2/posts", `HTTP ${res.status}`);
  }
}

// 8. GraphQL endpoint responds
section("GraphQL");
{
  const res = await fetch(`${SITE}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: `{ posts(first:5){ nodes{ slug title } } }` }),
  });
  let body = null;
  try {
    body = await res.json();
  } catch {}
  const nodes = body?.data?.posts?.nodes;
  if (res.ok && Array.isArray(nodes)) {
    pass(`/graphql responds`, `${nodes.length} posts visible`);
  } else {
    fail(
      `/graphql`,
      `HTTP ${res.status}, errors=${JSON.stringify(body?.errors || []).slice(0, 120)}`,
    );
  }
}

// Summary
console.log(`\n=== ${passes} passed, ${fails} failed, ${warns} warning(s) ===`);
process.exit(fails > 0 ? 1 : 0);
