#!/usr/bin/env node
// Set, swap or clear a gaggle subsite's logo from the command line (D081).
//
// The theme reads the logo from tbl_options['logo_id'] (an attachment ID on
// that subsite). Grannies set it through Appearance → Gaggle Settings; this
// script does the same thing over SSH + wp-cli so the Web Granny can change
// a logo without opening WP admin.
//
// Usage:
//   node scripts/set-gaggle-logo.mjs <slug> <path-to-image> [--has-name]
//   node scripts/set-gaggle-logo.mjs <slug> --id <attachment-id> [--has-name]
//   node scripts/set-gaggle-logo.mjs <slug> --clear
//   node scripts/set-gaggle-logo.mjs <slug> --show
//
//   --id N       point at an image already in that subsite's media library.
//   --has-name   the picture already contains the gaggle's name, so the
//                theme hides the text beside it (header and footer).
//   --clear      go back to the shared network mark (logo_id = 0).
//   --show       print the current logo setting and exit.
//
// Prereqs: `ssh nixihost-irg` works (see docs/HANDOFF.md). The image can be
// PNG, JPG, WebP or GIF; any size or aspect ratio, the theme fits it.

import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";

const HOST = "nixihost-irg";
const WP_HOME = "/home/raginggr/cms.raginggrannies.international";

const [slug, ...rest] = process.argv.slice(2);
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error("Usage: node scripts/set-gaggle-logo.mjs <slug> <image|--clear|--show> [--has-name]");
  process.exit(1);
}
const clear = rest.includes("--clear");
const show = rest.includes("--show");
const hasName = rest.includes("--has-name") ? 1 : 0;
const idIdx = rest.indexOf("--id");
const existingId = idIdx >= 0 ? Number(rest[idIdx + 1]) : 0;
const imagePath = rest.find((a, i) => !a.startsWith("--") && (idIdx < 0 || i !== idIdx + 1));

if (!clear && !show && !imagePath && !existingId) {
  console.error("Give an image path, --id N, --clear or --show.");
  process.exit(1);
}
if (imagePath) {
  const abs = resolve(imagePath);
  if (!existsSync(abs) || !statSync(abs).isFile()) {
    console.error(`Not a file: ${abs}`);
    process.exit(1);
  }
  if (!/\.(png|jpe?g|webp|gif)$/i.test(abs)) {
    console.error("Logo must be PNG, JPG, WebP or GIF (SVG is blocked by the media library).");
    process.exit(1);
  }
}

const URL = `${slug}.raginggrannies.org`;
const WP = `php ${WP_HOME}/wp-cli.phar --path=${WP_HOME} --url=${URL} --user=webgranny`;

function ssh(cmd, opts = {}) {
  const r = spawnSync("ssh", [HOST, cmd], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], ...opts });
  if (r.status !== 0) {
    console.error(`[FAIL] ssh exit=${r.status}`);
    process.exit(r.status || 1);
  }
  return r.stdout.trim();
}

// PHP that merges keys into tbl_options without clobbering the other fields.
// `wp option patch` fails when the option row does not exist yet. The patch
// travels as base64 so the one-liner has no quotes for bash to trip on.
function mergePhp(patch) {
  const b64 = Buffer.from(JSON.stringify(patch)).toString("base64");
  return `'$o = get_option("tbl_options", []); if (!is_array($o)) $o = []; $o = array_merge($o, json_decode(base64_decode("${b64}"), true)); update_option("tbl_options", $o); echo json_encode(["logo_id"=>$o["logo_id"] ?? 0, "logo_has_name"=>$o["logo_has_name"] ?? 0]);'`;
}

function finish(attId) {
  const out = ssh(`${WP} eval ${mergePhp({ logo_id: Number(attId), logo_has_name: hasName })}`);
  console.log(`[SET] ${slug} attachment ${attId}${hasName ? " (logo includes name)" : ""} -> ${out}`);
  console.log(`Check: https://${URL}/`);
}

if (show) {
  const out = ssh(`${WP} eval '$o = get_option("tbl_options", []); echo json_encode(["logo_id"=>$o["logo_id"] ?? 0, "logo_has_name"=>$o["logo_has_name"] ?? 0, "url"=>!empty($o["logo_id"]) ? wp_get_attachment_image_url((int)$o["logo_id"], "medium") : null]);'`);
  console.log(out);
  process.exit(0);
}

if (clear) {
  const out = ssh(`${WP} eval ${mergePhp({ logo_id: 0, logo_has_name: 0 })}`);
  console.log(`[CLEAR] ${slug} -> ${out}`);
  console.log(`Check: https://${URL}/`);
  process.exit(0);
}

if (existingId) {
  const ok = ssh(`${WP} eval 'echo wp_attachment_is_image(${existingId}) ? "yes" : "no";'`);
  if (ok !== "yes") {
    console.error(`[FAIL] attachment ${existingId} is not an image on ${URL}`);
    process.exit(1);
  }
  finish(existingId);
  process.exit(0);
}

// 1. Copy the image up to a scratch path on the server.
const abs = resolve(imagePath);
const remoteTmp = `/tmp/gaggle-logo-${slug}-${Date.now()}-${basename(abs)}`;
{
  const r = spawnSync("scp", ["-q", abs, `${HOST}:${remoteTmp}`], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`[FAIL] scp exit=${r.status}`);
    process.exit(r.status || 1);
  }
}

// 2. Import it into that subsite's media library, then point the option at it.
const title = `${slug} gaggle logo`;
const attId = ssh(`${WP} media import ${JSON.stringify(remoteTmp)} --title=${JSON.stringify(title)} --porcelain; rm -f ${JSON.stringify(remoteTmp)}`);
if (!/^\d+$/.test(attId)) {
  console.error(`[FAIL] media import returned: ${attId}`);
  process.exit(1);
}
finish(attId);
