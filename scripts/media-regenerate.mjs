#!/usr/bin/env node
// Rebuild attachment metadata + intermediate sizes for media whose file was
// replaced on disk (file-manager/FTP swap). REST stand-in for
// `wp media regenerate` — the host has no WP-CLI. Requires irg-core >= 3.17.0.
//
// Usage:
//   node scripts/media-regenerate.mjs <id> [<id>...] [--blog=N] [--dry-run]

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadEnv() {
  const env = {};
  for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const BASE = env.PUBLIC_WP_URL?.replace(/\/$/, "");
const USER = env.WP_USERNAME;
const PASS = env.WP_APP_PASSWORD?.replace(/\s/g, "");

if (!BASE || !USER || !PASS) {
  console.error("Missing PUBLIC_WP_URL / WP_USERNAME / WP_APP_PASSWORD in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const ids = args.filter((a) => /^\d+$/.test(a)).map(Number);
const blog = Number(args.find((a) => a.startsWith("--blog="))?.split("=")[1] ?? 0);
const dryRun = args.includes("--dry-run");

if (!ids.length) {
  console.error("Usage: node scripts/media-regenerate.mjs <id> [<id>...] [--blog=N] [--dry-run]");
  process.exit(1);
}

const res = await fetch(`${BASE}/wp-json/irg/v1/media-regenerate`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64"),
  },
  body: JSON.stringify({ ids, blog, dry_run: dryRun }),
});

const body = await res.json().catch(() => null);
if (!res.ok || !body?.ok) {
  console.error(`HTTP ${res.status}`, JSON.stringify(body, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(body, null, 2));
