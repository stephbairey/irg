/**
 * Admin status page for the "Ask the website" chatbot (D045).
 *
 * GET /admin/chatbot-status?token=<ADMIN_TOKEN>
 *
 * Shows: today's spend vs caps, recent transcripts (newest first),
 * cost per interaction, retrieval scores. Token-gated via the
 * ADMIN_TOKEN env var (set in CF Pages → Settings → Environment
 * Variables → Production, mark as secret).
 *
 * No frameworks, no client JS — server-rendered HTML, single response.
 */

interface Env {
  BUDGET_KV: KVNamespace;
  ADMIN_TOKEN: string;
  CHATBOT_DAILY_SOFT_USD?: string;
  CHATBOT_DAILY_HARD_USD?: string;
  CHATBOT_ENABLED?: string;
  CHATBOT_LOG_TRANSCRIPTS?: string;
}

interface KVNamespace {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  list: (options?: { prefix?: string; limit?: number; cursor?: string }) => Promise<{
    keys: Array<{ name: string; expiration?: number }>;
    list_complete: boolean;
    cursor?: string;
  }>;
}

interface TranscriptEntry {
  timestamp: string;
  question: string;
  answer: string;
  sources: Array<{ title: string; url: string; type: string; score: number }>;
  costUsd: number;
  todaySpendUsd: number;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
}

const SOFT_USD_DEFAULT = 0.25;
const HARD_USD_DEFAULT = 1.0;
const RECENT_LIMIT = 50;

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 19)} UTC`;
}

function renderHtml(state: {
  today: string;
  spend: number;
  softCap: number;
  hardCap: number;
  enabled: boolean;
  loggingEnabled: boolean;
  transcriptCount: number;
  todayCount: number;
  transcripts: TranscriptEntry[];
}): string {
  const spendPctOfHard = Math.min(100, (state.spend / state.hardCap) * 100);
  const spendBarColor =
    state.spend >= state.hardCap ? "#E22A2C" : state.spend >= state.softCap ? "#D97706" : "#16A34A";
  const enabledBadge = state.enabled
    ? `<span class="badge badge-ok">Enabled</span>`
    : `<span class="badge badge-off">Disabled</span>`;
  const loggingBadge = state.loggingEnabled
    ? `<span class="badge badge-ok">Logging on</span>`
    : `<span class="badge badge-off">Logging off</span>`;

  const transcriptRows = state.transcripts
    .map((t) => {
      const sourcesList = t.sources
        .map(
          (s) =>
            `<li><span class="src-type">${escapeHtml(s.type)}</span> <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.title)}</a> <span class="src-score">${s.score.toFixed(3)}</span></li>`,
        )
        .join("");
      const cacheReads = t.usage.cache_read_input_tokens || 0;
      const cacheWrites = t.usage.cache_creation_input_tokens || 0;
      return `
        <details class="transcript">
          <summary>
            <span class="ts">${escapeHtml(formatTimestamp(t.timestamp))}</span>
            <span class="cost">$${t.costUsd.toFixed(5)}</span>
            <span class="q">${escapeHtml(t.question.slice(0, 120))}${t.question.length > 120 ? "…" : ""}</span>
          </summary>
          <div class="t-body">
            <div class="t-meta">
              <span>${t.usage.input_tokens} in</span>
              <span>${t.usage.output_tokens} out</span>
              ${cacheReads > 0 ? `<span>${cacheReads} cached read</span>` : ""}
              ${cacheWrites > 0 ? `<span>${cacheWrites} cached write</span>` : ""}
            </div>
            <h4>Question</h4>
            <p class="t-q">${escapeHtml(t.question)}</p>
            <h4>Answer</h4>
            <pre class="t-a">${escapeHtml(t.answer)}</pre>
            <h4>Top retrieved sources (cosine score)</h4>
            <ul class="t-sources">${sourcesList}</ul>
          </div>
        </details>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Chatbot status — ${state.today}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; max-width: 1100px; margin: 0 auto; padding: 32px 24px; color: #2A1847; background: #FAF3E3; }
    h1 { font-size: 28px; margin: 0 0 4px; }
    h2 { font-size: 20px; margin: 32px 0 12px; padding-bottom: 6px; border-bottom: 1.5px solid #E8DFC7; }
    h4 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: #57228C; margin: 16px 0 6px; }
    p { margin: 6px 0; line-height: 1.45; }
    .head-meta { color: #57228C; font-size: 14px; margin-bottom: 24px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 16px 0 24px; }
    .stat { padding: 14px 18px; background: #F5EBD2; border-radius: 8px; }
    .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #57228C; }
    .stat-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
    .bar { height: 10px; background: #E8DFC7; border-radius: 999px; overflow: hidden; margin-top: 10px; }
    .bar-fill { height: 100%; transition: width 0.3s ease; }
    .badges { display: flex; gap: 8px; align-items: center; }
    .badge { font-size: 12px; padding: 3px 8px; border-radius: 999px; font-weight: 600; }
    .badge-ok { background: #DCFCE7; color: #166534; }
    .badge-off { background: #FEE2E2; color: #991B1B; }
    .transcript { margin: 8px 0; border: 1px solid #E8DFC7; border-radius: 8px; background: #fff; }
    .transcript summary { padding: 10px 14px; cursor: pointer; display: grid; grid-template-columns: auto 80px 1fr; gap: 16px; align-items: center; font-size: 14px; }
    .transcript summary:hover { background: #F5EBD2; }
    .transcript[open] summary { border-bottom: 1px solid #E8DFC7; }
    .ts { color: #57228C; font-family: ui-monospace, monospace; font-size: 12px; }
    .cost { font-family: ui-monospace, monospace; font-size: 13px; color: #2A1847; text-align: right; }
    .q { color: #2A1847; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .t-body { padding: 4px 18px 16px; }
    .t-meta { color: #57228C; font-size: 12px; display: flex; gap: 16px; margin-bottom: 8px; }
    .t-q { font-style: italic; color: #2A1847; padding: 8px 12px; background: #F5EBD2; border-left: 3px solid #57228C; border-radius: 0 6px 6px 0; }
    .t-a { white-space: pre-wrap; font-family: ui-sans-serif, sans-serif; font-size: 14px; line-height: 1.55; padding: 12px; background: #F9F4E4; border-radius: 6px; margin: 6px 0; overflow-x: auto; }
    .t-sources { list-style: none; padding: 0; margin: 6px 0; }
    .t-sources li { padding: 4px 0; font-size: 13px; display: grid; grid-template-columns: 60px 1fr 60px; gap: 12px; align-items: center; }
    .src-type { font-family: ui-monospace, monospace; font-size: 11px; text-transform: uppercase; color: #57228C; }
    .src-score { font-family: ui-monospace, monospace; font-size: 12px; color: #57228C; text-align: right; }
    .t-sources a { color: #2A1847; text-decoration: none; border-bottom: 1px solid #57228C; }
    .t-sources a:hover { color: #E22A2C; border-color: #E22A2C; }
    .empty { text-align: center; padding: 48px 16px; color: #57228C; font-style: italic; }
  </style>
</head>
<body>
  <h1>Chatbot status</h1>
  <p class="head-meta">${state.today} (UTC)  ·  ${enabledBadge} ${loggingBadge}  ·  use browser refresh to update</p>

  <div class="stats">
    <div class="stat">
      <div class="stat-label">Today's spend</div>
      <div class="stat-value">$${state.spend.toFixed(4)}</div>
      <div class="bar"><div class="bar-fill" style="width: ${spendPctOfHard.toFixed(1)}%; background: ${spendBarColor};"></div></div>
      <p style="font-size: 12px; color: #57228C; margin: 6px 0 0;">soft $${state.softCap.toFixed(2)} · hard $${state.hardCap.toFixed(2)}</p>
    </div>
    <div class="stat">
      <div class="stat-label">Today's queries</div>
      <div class="stat-value">${state.todayCount}</div>
    </div>
    <div class="stat">
      <div class="stat-label">90-day total</div>
      <div class="stat-value">${state.transcriptCount}</div>
      <p style="font-size: 12px; color: #57228C; margin: 6px 0 0;">rolling, auto-purged</p>
    </div>
  </div>

  <h2>Recent transcripts (newest first)</h2>
  ${state.transcripts.length === 0
    ? '<div class="empty">No transcripts yet.</div>'
    : transcriptRows
  }
</body>
</html>`;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!env.ADMIN_TOKEN) {
    return new Response("ADMIN_TOKEN env var not set on server.", { status: 503 });
  }
  if (!token || token !== env.ADMIN_TOKEN) {
    return new Response("401 — append ?token=<ADMIN_TOKEN>", {
      status: 401,
      headers: { "content-type": "text/plain" },
    });
  }

  const today = todayKey();
  const softCap = parseFloat(env.CHATBOT_DAILY_SOFT_USD || String(SOFT_USD_DEFAULT));
  const hardCap = parseFloat(env.CHATBOT_DAILY_HARD_USD || String(HARD_USD_DEFAULT));

  // Today's spend
  const spendStr = await env.BUDGET_KV.get(`spend:${today}`);
  const spend = spendStr ? Number(spendStr) : 0;

  // List transcripts. KV.list returns up to 1000 keys per call; for our
  // expected volume (90-day total around 600) one call covers it.
  const list = await env.BUDGET_KV.list({ prefix: "transcript:", limit: 1000 });

  // Newest first — keys are zero-padded `transcript:YYYY-MM-DD:HHMMSSmmm-rand`
  // which sorts lexicographically the same as chronologically.
  const sortedKeys = list.keys
    .map((k) => k.name)
    .sort((a, b) => b.localeCompare(a));

  const todayPrefix = `transcript:${today}:`;
  const todayCount = sortedKeys.filter((k) => k.startsWith(todayPrefix)).length;

  const recentKeys = sortedKeys.slice(0, RECENT_LIMIT);
  const transcripts = await Promise.all(
    recentKeys.map(async (key) => {
      const v = await env.BUDGET_KV.get(key);
      try {
        return v ? (JSON.parse(v) as TranscriptEntry) : null;
      } catch {
        return null;
      }
    }),
  );

  const html = renderHtml({
    today,
    spend,
    softCap,
    hardCap,
    enabled: env.CHATBOT_ENABLED === "true",
    loggingEnabled: env.CHATBOT_LOG_TRANSCRIPTS !== "false",
    transcriptCount: list.keys.length,
    todayCount,
    transcripts: transcripts.filter((t): t is TranscriptEntry => t !== null),
  });

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
};

type PagesFunction<E = unknown> = (context: {
  request: Request;
  env: E;
  params: Record<string, string>;
  data: Record<string, unknown>;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
}) => Response | Promise<Response>;
