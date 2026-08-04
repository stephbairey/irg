#!/usr/bin/env node
// Press feed health check (pre-cutover plan, workstream F2).
//
// The ingest pipeline is deliberately failure-tolerant: a blocked fetch, a
// parse error, and a genuinely quiet news day all end in a green run reading
// "no new clippings". This is the alarm on top: when nothing has been
// ingested for PRESS_MAX_QUIET_DAYS (default 30), exit 1 so the GitHub
// Actions run fails and GitHub emails about it. One false alarm during a
// legitimately quiet month costs an email; a silently dead feed cost six
// weeks of missed coverage before anyone noticed.
//
// Runs only in CI (a separate workflow step) — never as part of the build.

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVE = resolve(ROOT, "data/press-clippings.json");
const MAX_QUIET_DAYS = Number(process.env.PRESS_MAX_QUIET_DAYS) || 30;

let archive = [];
if (existsSync(ARCHIVE)) {
  try {
    const raw = JSON.parse(readFileSync(ARCHIVE, "utf8"));
    if (Array.isArray(raw)) archive = raw;
  } catch {
    // fall through to the empty-archive failure below
  }
}

if (archive.length === 0) {
  console.error("[press-health] the clippings archive is empty or unreadable.");
  process.exit(1);
}

const lastIngest = archive
  .map((a) => a.fetched_at)
  .filter((d) => typeof d === "string" && d.length >= 10)
  .sort()
  .pop();

const days = Math.floor(
  (Date.now() - new Date(`${lastIngest}T00:00:00Z`).getTime()) / 86_400_000,
);

if (!lastIngest || Number.isNaN(days)) {
  console.error("[press-health] could not determine the last ingest date.");
  process.exit(1);
}

if (days > MAX_QUIET_DAYS) {
  console.error(
    `[press-health] no new clipping ingested in ${days} days ` +
      `(last: ${lastIngest}, threshold: ${MAX_QUIET_DAYS}). ` +
      `Either the news is genuinely quiet or the fetch is silently failing — ` +
      `run \`node scripts/fetch-press.mjs\` locally and compare against the live feed.`,
  );
  process.exit(1);
}

console.log(`[press-health] ok — last ingest ${lastIngest} (${days} days ago).`);
