#!/usr/bin/env node
// Bulk-create gaggle subsites on the IRG multisite, driven by
// data/gaggle-locations.json. Idempotent — safe to re-run. For each gaggle:
//
//   1. Create the subsite if it doesn't exist
//   2. Delete WP's default Hello world! / Sample Page if present
//   3. Activate The Bulletin Local theme if not active
//   4. Force the default-content seeder via do_action(after_switch_theme)
//      if the seeded home page is missing
//   5. Upload favicon-bulk.png and set site_icon if not set
//   6. Set timezone_string from lat/lng (via tz-lookup) if wrong
//   7. Set start_of_week to 0 (Sunday) if not 0
//
// Each gaggle gets one SSH round-trip with all checks/actions inline.
//
// Usage:
//   node scripts/bulk-create-subsites.mjs              # process all gaggles
//   node scripts/bulk-create-subsites.mjs montreal     # process one gaggle
//   node scripts/bulk-create-subsites.mjs montreal seattle  # process several
//
// Prereqs:
//   - WP-CLI phar at ~/cms.raginggrannies.international/wp-cli.phar on the server
//   - favicon-bulk.png at ~/cms.raginggrannies.international/favicon-bulk.png on the server
//     (scp ./public/favicon.png nixihost-irg:~/cms.raginggrannies.international/favicon-bulk.png)
//   - SSH alias `nixihost-irg` configured

import tzlookup from "tz-lookup";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SERVER_BASH = `
set -e
SLUG="$1"
NAME="$2"
EMAIL="$3"
TZ_STR="$4"
URL="cms.raginggrannies.international/$SLUG"
WP_HOME=/home/raginggr/cms.raginggrannies.international
WP="php $WP_HOME/wp-cli.phar --path=$WP_HOME"
FAVICON="$WP_HOME/favicon-bulk.png"

# 1. Create subsite if missing
if ! $WP site list --field=path 2>/dev/null | grep -qx "/$SLUG/"; then
  echo "[CREATE] $SLUG"
  $WP site create --slug="$SLUG" --title="$NAME" --email="$EMAIL"
fi

# 2. Delete WP default content if present
HELLO=$($WP post list --post_type=post --name=hello-world --field=ID --url=$URL --user=webgranny 2>/dev/null || true)
SAMPLE=$($WP post list --post_type=page --name=sample-page --field=ID --url=$URL --user=webgranny 2>/dev/null || true)
if [ -n "$HELLO" ]; then
  echo "[CLEAN] $SLUG hello-world id=$HELLO"
  $WP post delete $HELLO --force --url=$URL --user=webgranny
fi
if [ -n "$SAMPLE" ]; then
  echo "[CLEAN] $SLUG sample-page id=$SAMPLE"
  $WP post delete $SAMPLE --force --url=$URL --user=webgranny
fi

# 3. Activate theme if not active
ACTIVE=$($WP theme list --status=active --field=name --url=$URL --user=webgranny 2>/dev/null || true)
if [ "$ACTIVE" != "the-bulletin-local" ]; then
  echo "[ACTIVATE] $SLUG (was: $ACTIVE)"
  $WP theme activate the-bulletin-local --url=$URL --user=webgranny
fi

# 4. Force seeder if the seeded home page is missing
HOME_ID=$($WP post list --post_type=page --name=home --field=ID --url=$URL --user=webgranny 2>/dev/null || true)
if [ -z "$HOME_ID" ]; then
  echo "[SEED] $SLUG"
  $WP eval 'do_action("after_switch_theme");' --url=$URL --user=webgranny
fi

# 5. Site icon
ICON=$($WP option get site_icon --url=$URL --user=webgranny 2>/dev/null || echo 0)
if [ -z "$ICON" ] || [ "$ICON" = "0" ]; then
  echo "[ICON] $SLUG (importing favicon)"
  ATTID=$($WP media import "$FAVICON" --title="Site Icon" --porcelain --url=$URL --user=webgranny)
  $WP option update site_icon $ATTID --url=$URL --user=webgranny
fi

# 6. Timezone
CURTZ=$($WP option get timezone_string --url=$URL --user=webgranny 2>/dev/null || echo "")
if [ "$CURTZ" != "$TZ_STR" ]; then
  echo "[TZ] $SLUG: '$CURTZ' -> '$TZ_STR'"
  $WP option update timezone_string "$TZ_STR" --url=$URL --user=webgranny
fi

# 7. start_of_week (Sunday = 0; WP defaults to 1 = Monday)
SOW=$($WP option get start_of_week --url=$URL --user=webgranny 2>/dev/null || echo "")
if [ "$SOW" != "0" ]; then
  echo "[SOW] $SLUG: '$SOW' -> '0'"
  $WP option update start_of_week 0 --url=$URL --user=webgranny
fi

echo "[OK] $SLUG"
`;

function loadGaggles() {
  const raw = JSON.parse(readFileSync(resolve(ROOT, "data/gaggle-locations.json"), "utf8"));
  return raw
    .filter(
      (g) =>
        g &&
        typeof g.slug === "string" &&
        g.slug.length > 0 &&
        typeof g.name === "string" &&
        typeof g.lat === "number" &&
        typeof g.lng === "number",
    )
    .map((g) => ({
      slug: g.slug,
      name: `${g.name} Raging Grannies`,
      email: `${g.slug}@raginggrannies.org`,
      tz: tzlookup(g.lat, g.lng),
    }));
}

// Shell-quote a single argument for safe interpolation into a remote command
// passed through SSH (which collapses argv into one string).
function shq(s) {
  if (s === "") return "''";
  if (/^[a-zA-Z0-9_/.@:+-]+$/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

function processGaggle(g) {
  const t0 = Date.now();
  const remoteArgs = [g.slug, g.name, g.email, g.tz].map(shq).join(" ");
  const r = spawnSync("ssh", ["nixihost-irg", `bash -s -- ${remoteArgs}`], {
    input: SERVER_BASH,
    stdio: ["pipe", "inherit", "inherit"],
    encoding: "utf8",
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  if (r.status !== 0) {
    console.error(`[FAIL] ${g.slug} exit=${r.status} (${dt}s)`);
    return false;
  }
  console.log(`[PASS] ${g.slug} (${dt}s)`);
  return true;
}

(async () => {
  const all = loadGaggles();
  const filter = process.argv.slice(2);
  const todo = filter.length > 0
    ? all.filter((g) => filter.includes(g.slug))
    : all;

  if (todo.length === 0) {
    console.error(`No matching gaggles. Available slugs: ${all.map((g) => g.slug).join(", ")}`);
    process.exit(2);
  }

  console.log(`[bulk] processing ${todo.length} gaggle(s)`);

  const passed = [];
  const failed = [];
  for (const g of todo) {
    console.log(`\n=== ${g.slug} | tz=${g.tz} ===`);
    if (processGaggle(g)) {
      passed.push(g.slug);
    } else {
      failed.push(g.slug);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`PASS  ${passed.length}: ${passed.join(", ")}`);
  if (failed.length > 0) {
    console.log(`FAIL  ${failed.length}: ${failed.join(", ")}`);
  }
  console.log(
    `\nNext: run \`node scripts/snapshot-subsites.mjs\`, build, commit, push.`,
  );
  process.exit(failed.length > 0 ? 1 : 0);
})();
