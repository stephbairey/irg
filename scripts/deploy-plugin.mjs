#!/usr/bin/env node
// Build and deploy the irg-core plugin to the WP server via REST.
//
// Prereqs:
//   - `.env.local` has PUBLIC_WP_URL, WP_USERNAME, WP_APP_PASSWORD.
//   - irg-core v3.2.0+ is already installed on WP (it ships the upload
//     endpoint at /wp-json/irg/v1/plugin-upload). First-time installs
//     still need a manual upload.
//
// Usage:
//   node scripts/deploy-plugin.mjs

import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PLUGIN_DIR = resolve(ROOT, "wp-plugin");
const ZIP_PATH = resolve(PLUGIN_DIR, "irg-core.zip");

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

const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

console.log("Building irg-core.zip…");
execSync(
  `rm -f ${JSON.stringify(ZIP_PATH)} && cd ${JSON.stringify(PLUGIN_DIR)} && zip -r irg-core.zip irg-core -x "*.DS_Store" "*/.*"`,
  { stdio: "inherit", shell: "/bin/bash" },
);

const size = statSync(ZIP_PATH).size;
console.log(`  ${ZIP_PATH} (${size} bytes)`);

console.log(`Uploading to ${BASE}/wp-json/irg/v1/plugin-upload…`);

const zipBuffer = readFileSync(ZIP_PATH);
const form = new FormData();
form.append("plugin", new Blob([zipBuffer], { type: "application/zip" }), "irg-core.zip");

const res = await fetch(`${BASE}/wp-json/irg/v1/plugin-upload`, {
  method: "POST",
  headers: { Authorization: AUTH },
  body: form,
});

const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = text;
}

if (!res.ok) {
  console.error(`  ${res.status} ${res.statusText}`);
  console.error(body);
  process.exit(1);
}

console.log("  OK:", body);
