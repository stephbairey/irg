# Archived: "Ask a Question" (AI assistant)

Archived 2026-06-03. The IRG committee decided they did not want an AI feature
on the site.

This folder preserves the original files in their repo-relative structure:

- `src/pages/ask.astro` — the public "Ask the website" page
- `functions/api/ask.ts` — the Cloudflare Pages function backing it
- `functions/admin/chatbot-status.ts` — the admin spend/transcript dashboard
- `scripts/build-rag-index.mjs` — built the embeddings index the chatbot used

Because they live under `_archive/` (outside `src/pages/`, `functions/`, and the
build's `scripts/`), Astro does not route the page, Cloudflare does not deploy
the functions, and nothing runs the embeddings build.

The `public/embeddings.json` artifact (~7.2 MB) that `build-rag-index.mjs`
produced was **deleted** from the working tree (it is recoverable from git
history, or regenerable by running the archived script). The `embed` npm script
was removed from `package.json`.

Note: the `llms.txt` generator (`scripts/generate-llms-txt.mjs`) was intentionally
**kept** — it produces metadata for external AI tools (ChatGPT, Perplexity,
Claude web) to discover and cite the public site, and is unrelated to this
on-site chatbot.

To restore: move these files back to their original paths, re-add the `embed`
script to `package.json`, run it to regenerate `public/embeddings.json`, re-add
the three nav links in `src/layouts/BaseLayout.astro` (desktop nav, mobile menu,
footer "Connect" column), and restore the chatbot copy in `src/pages/privacy.astro`.
