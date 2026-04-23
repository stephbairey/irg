/* global React, SiteHeader, SiteFooter, ISSUES, SONGS, IconSearch, IconArrow, IconDown, IconShuffle, IconPlay */

/* ================================================================
   Song Library — browse/search/filter 1,493 songs.
   Density: comfortable rows (not cards). Left-rail filters.
   ================================================================ */
function SongLibrary() {
  const [q, setQ] = React.useState('');
  const [issue, setIssue] = React.useState(null);
  const [gaggle, setGaggle] = React.useState(null);
  const [sort, setSort] = React.useState('a-z');
  const [audioOnly, setAudioOnly] = React.useState(false);

  // build an expanded list for realism
  const expanded = React.useMemo(() => {
    const out = [];
    for (let i = 0; i < 40; i++) {
      const base = SONGS[i % SONGS.length];
      out.push({ ...base, id: base.id * 100 + i });
    }
    return out;
  }, []);

  const gaggles = ['Victoria (Original)', 'Seattle', 'Portland', 'Green Bay', 'Madison', 'Brooklyn', 'Austin', 'Edmonton', 'Atlanta', 'San Francisco Bay'];

  const filtered = expanded.filter(s => {
    if (q && !s.title.toLowerCase().includes(q.toLowerCase()) &&
        !s.tune.toLowerCase().includes(q.toLowerCase())) return false;
    if (issue && !s.tags.includes(issue)) return false;
    if (gaggle && s.gaggle !== gaggle) return false;
    if (audioOnly && !s.has_audio) return false;
    return true;
  });

  return (
    <div className="lib">
      <SiteHeader active="songs" />

      {/* ======= HEADER BAND ======= */}
      <section className="lib-head">
        <div className="container">
          <div className="lib-head-grid">
            <div>
              <div className="kicker" style={{ color: 'var(--red)' }}>The songbook · 1987 – 2026</div>
              <h1 className="lib-title">The Song Library</h1>
              <p className="lib-sub">
                Every song catalogued by gaggles across four continents —
                searchable, filterable, printable, and <em>yours to sing</em>.
                {' '}<a href="#" className="underline-link">Submit one of yours</a>.
              </p>
            </div>
            <div className="lib-count-card">
              <div className="lib-count-big">1,493</div>
              <div className="lib-count-sub">songs · 80 gaggles · 17 issues · 39 years</div>
            </div>
          </div>
        </div>
      </section>

      {/* ======= SEARCH + CONTROLS ======= */}
      <section className="lib-controls">
        <div className="container">
          <div className="lib-search">
            <IconSearch size={22} />
            <input
              type="search"
              placeholder="Search by title, tune, or a line in the lyrics…"
              value={q}
              onChange={e => setQ(e.target.value)}
              aria-label="Search songs"
            />
            {q && <button className="lib-search-clear" onClick={() => setQ('')}>Clear</button>}
            <div className="lib-search-scope">
              <label><input type="checkbox" /> lyrics</label>
            </div>
          </div>

          <div className="lib-activebar">
            <span className="lib-result-count">
              <b>{filtered.length}</b> of 1,493 songs
              {(issue || gaggle || audioOnly) && ' ·'}
              {issue && <span className="lib-chip-rm" onClick={() => setIssue(null)}>
                {ISSUES.find(i => i.slug === issue)?.label} ×
              </span>}
              {gaggle && <span className="lib-chip-rm" onClick={() => setGaggle(null)}>
                {gaggle} ×
              </span>}
              {audioOnly && <span className="lib-chip-rm" onClick={() => setAudioOnly(false)}>
                Has audio ×
              </span>}
            </span>
            <div className="lib-sort">
              <label>Sort</label>
              <div className="lib-select">
                <select value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="a-z">A → Z</option>
                  <option value="z-a">Z → A</option>
                  <option value="newest">Newest first</option>
                  <option value="popular">Most sung</option>
                </select>
                <IconDown size={14} />
              </div>
              <button className="lib-shuffle-btn"><IconShuffle size={14} /> Random</button>
            </div>
          </div>
        </div>
      </section>

      {/* ======= BODY: filters + list ======= */}
      <section className="lib-body">
        <div className="container">
          <div className="lib-body-grid">

            {/* ---- FILTER RAIL ---- */}
            <aside className="lib-filters" aria-label="Filters">
              <div className="lib-filter-group">
                <div className="lib-filter-head">Issues</div>
                <ul className="lib-filter-list">
                  <li>
                    <button
                      className={`lib-filter-row ${!issue ? 'active' : ''}`}
                      onClick={() => setIssue(null)}>
                      All issues <span>1,493</span>
                    </button>
                  </li>
                  {ISSUES.map(iss => (
                    <li key={iss.slug}>
                      <button
                        className={`lib-filter-row ${issue === iss.slug ? 'active' : ''}`}
                        onClick={() => setIssue(iss.slug)}>
                        <span className={`lib-filter-dot ${iss.tint}`} />
                        {iss.label} <span>{iss.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lib-filter-group">
                <div className="lib-filter-head">Gaggle</div>
                <div className="lib-filter-search">
                  <IconSearch size={14} />
                  <input placeholder="Find a gaggle…" />
                </div>
                <ul className="lib-filter-list lib-filter-list-sm">
                  {gaggles.map(g => (
                    <li key={g}>
                      <button
                        className={`lib-filter-row ${gaggle === g ? 'active' : ''}`}
                        onClick={() => setGaggle(gaggle === g ? null : g)}>
                        {g}<span>{Math.floor(Math.random() * 60) + 4}</span>
                      </button>
                    </li>
                  ))}
                  <li><button className="lib-filter-row lib-filter-more">+ 71 more gaggles</button></li>
                </ul>
              </div>

              <div className="lib-filter-group">
                <div className="lib-filter-head">Songwriter</div>
                <div className="lib-filter-search">
                  <IconSearch size={14} />
                  <input placeholder="Find a songwriter…" />
                </div>
              </div>

              <div className="lib-filter-group">
                <div className="lib-filter-head">Original tune</div>
                <div className="lib-filter-search">
                  <IconSearch size={14} />
                  <input placeholder="e.g. Yankee Doodle…" />
                </div>
              </div>

              <div className="lib-filter-group">
                <label className="lib-filter-check">
                  <input type="checkbox"
                    checked={audioOnly} onChange={e => setAudioOnly(e.target.checked)} />
                  <span>Has audio / video</span>
                </label>
              </div>

              <button className="lib-reset" onClick={() => { setIssue(null); setGaggle(null); setAudioOnly(false); setQ(''); }}>
                Reset filters
              </button>
            </aside>

            {/* ---- RESULTS ---- */}
            <div className="lib-results">
              {filtered.slice(0, 14).map(s => (
                <SongRow key={s.id} song={s} />
              ))}
              <div className="lib-pager">
                <button className="btn btn-ghost">← Previous</button>
                <div className="lib-pager-info">Page 1 of 107 · showing 14 of 1,493</div>
                <button className="btn btn-ink">Next page <IconArrow size={14} /></button>
              </div>
            </div>

          </div>
        </div>
      </section>

      <SiteFooter />
      <style>{STYLES_LIB}</style>
    </div>
  );
}

function SongRow({ song }) {
  const tags = song.tags.map(t => ISSUES.find(i => i.slug === t)).filter(Boolean);
  return (
    <a href="song-detail.html" className="lib-row">
      <div className="lib-row-main">
        <h3 className="lib-row-title">{song.title}</h3>
        <div className="lib-row-meta">
          <span>to <em>{song.tune}</em></span>
          <span className="sep">·</span>
          <span>{song.gaggle}</span>
          <span className="sep">·</span>
          <span>by {song.writer}</span>
        </div>
        <div className="lib-row-tags">
          {tags.map(t => (
            <span key={t.slug} className={`chip ${t.tint === 'red' ? 'chip-red' : t.tint === 'mustard' ? 'chip-mustard' : ''}`}>{t.label}</span>
          ))}
          {song.has_audio && <span className="lib-row-audio"><IconPlay size={11}/> Audio</span>}
        </div>
      </div>
      <div className="lib-row-year">
        <span>{song.year}</span>
        <IconArrow size={18} />
      </div>
    </a>
  );
}

const STYLES_LIB = `
.lib { background: var(--paper); }

/* head */
.lib-head { padding: 56px 0 24px; }
.lib-head-grid { display: grid; grid-template-columns: 1fr auto; gap: 48px; align-items: flex-end; }
.lib-title { font-size: clamp(56px, 7vw, 96px); color: var(--ink); margin: 14px 0 16px; line-height: .98; }
.lib-sub { font-size: 19px; color: var(--text-soft); max-width: 640px; margin: 0; line-height: 1.5; }
.lib-sub em { color: var(--ink); font-style: italic; }
.lib-count-card {
  padding: 22px 28px; background: var(--ink); color: var(--on-dark); border-radius: var(--radius);
  transform: rotate(1.5deg); box-shadow: var(--shadow-lift); text-align: right;
}
.lib-count-big { font-family: var(--font-display); font-size: 56px; line-height: 1; color: var(--mustard); }
.lib-count-sub { font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-lilac); margin-top: 8px; }

/* controls */
.lib-controls { padding: 24px 0 20px; position: sticky; top: 80px; background: var(--paper); z-index: 40; border-bottom: 1px solid var(--rule); }
.lib-search {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 20px; background: var(--card); border: 2px solid var(--ink); border-radius: 999px;
  box-shadow: var(--shadow-card);
}
.lib-search:focus-within { border-color: var(--red); }
.lib-search svg { color: var(--ink); flex: none; }
.lib-search input { flex: 1; border: 0; background: transparent; font-size: 18px; font-family: var(--font-body); color: var(--ink); outline: none; min-width: 0; }
.lib-search input::placeholder { color: var(--muted); }
.lib-search-clear { background: transparent; border: 0; font-weight: 800; color: var(--red); cursor: pointer; font-size: 13px; padding: 4px 10px; }
.lib-search-scope { border-left: 1px solid var(--rule); padding-left: 14px; font-size: 13px; color: var(--muted); font-weight: 700; }
.lib-search-scope label { display: inline-flex; gap: 6px; cursor: pointer; align-items: center; }

.lib-activebar { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; gap: 16px; flex-wrap: wrap; }
.lib-result-count { font-size: 14px; color: var(--text-soft); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.lib-result-count b { font-family: var(--font-display); font-size: 20px; color: var(--ink); }
.lib-chip-rm {
  display: inline-flex; gap: 6px; padding: 5px 10px; background: var(--mustard);
  border-radius: 999px; color: var(--ink); font-weight: 800; cursor: pointer; font-size: 13px;
}
.lib-chip-rm:hover { background: var(--red); color: #fff; }

.lib-sort { display: flex; align-items: center; gap: 10px; }
.lib-sort label { font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
.lib-select { position: relative; }
.lib-select select {
  appearance: none; padding: 10px 36px 10px 14px; font-size: 14px; font-weight: 700;
  font-family: var(--font-body); background: var(--card); color: var(--ink);
  border: 1.5px solid var(--ink-lilac); border-radius: 8px; cursor: pointer; min-height: 40px;
}
.lib-select svg { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--ink); pointer-events: none; }
.lib-shuffle-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 14px; font-size: 14px; font-weight: 800; font-family: var(--font-body);
  background: var(--card); border: 1.5px solid var(--ink-lilac); color: var(--ink);
  border-radius: 8px; cursor: pointer; min-height: 40px;
}
.lib-shuffle-btn:hover { border-color: var(--red); color: var(--red); }

/* body grid */
.lib-body { padding: 32px 0 80px; }
.lib-body-grid { display: grid; grid-template-columns: 280px 1fr; gap: 48px; align-items: flex-start; }

/* filters */
.lib-filters { position: sticky; top: 220px; display: grid; gap: 28px; align-self: start; padding-right: 12px; max-height: calc(100vh - 240px); overflow-y: auto; scrollbar-width: thin; }
.lib-filter-group { border-bottom: 1px solid var(--rule); padding-bottom: 20px; }
.lib-filter-group:last-of-type { border-bottom: 0; }
.lib-filter-head { font-family: var(--font-display); font-size: 22px; color: var(--ink); margin-bottom: 12px; }
.lib-filter-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 2px; }
.lib-filter-list-sm { max-height: 260px; overflow-y: auto; }
.lib-filter-row {
  display: flex; justify-content: space-between; align-items: center; gap: 10px;
  width: 100%; padding: 8px 12px; background: transparent; border: 0; border-radius: 8px;
  font-family: var(--font-body); font-size: 15px; color: var(--text); text-align: left; cursor: pointer; line-height: 1.3;
}
.lib-filter-row span { font-family: var(--font-mono); font-size: 12px; color: var(--muted); }
.lib-filter-row:hover { background: rgba(87,34,140,.06); color: var(--ink); }
.lib-filter-row.active { background: var(--ink); color: var(--on-dark); font-weight: 700; }
.lib-filter-row.active span { color: var(--mustard); }
.lib-filter-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--ink-lilac); margin-right: 2px; }
.lib-filter-dot.red { background: var(--red); }
.lib-filter-dot.mustard { background: var(--mustard); }
.lib-filter-more { color: var(--red); font-weight: 800; }

.lib-filter-search {
  display: flex; align-items: center; gap: 8px; padding: 9px 12px;
  background: var(--card); border: 1px solid var(--rule); border-radius: 8px; margin-bottom: 10px;
}
.lib-filter-search input { border: 0; background: transparent; outline: none; flex: 1; font-size: 14px; font-family: var(--font-body); }
.lib-filter-search svg { color: var(--muted); }

.lib-filter-check { display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer; color: var(--ink); }
.lib-filter-check input { width: 18px; height: 18px; accent-color: var(--red); }

.lib-reset {
  padding: 10px 16px; background: transparent; border: 1.5px solid var(--rule); border-radius: 8px;
  font-weight: 800; color: var(--red); cursor: pointer; font-family: var(--font-body); font-size: 13px;
}
.lib-reset:hover { border-color: var(--red); background: rgba(226,42,44,.05); }

/* results list */
.lib-results { display: grid; gap: 0; }
.lib-row {
  display: grid; grid-template-columns: 1fr auto; gap: 32px;
  padding: 22px 4px; border-bottom: 1px solid var(--rule); color: var(--text);
  align-items: center; transition: background .12s, padding .12s;
}
.lib-row:hover { background: var(--paper-2); padding-left: 20px; padding-right: 20px; text-decoration: none; }
.lib-row:hover .lib-row-title { color: var(--red); }
.lib-row-title { font-family: var(--font-display); font-size: 30px; color: var(--ink); line-height: 1; margin: 0 0 8px; }
.lib-row-meta { font-size: 14px; color: var(--text-soft); margin-bottom: 10px; }
.lib-row-meta em { font-style: italic; color: var(--ink-soft); }
.lib-row-meta .sep { color: var(--ink-lilac); margin: 0 6px; }
.lib-row-tags { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.lib-row-audio {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase;
  color: var(--red);
}
.lib-row-year {
  font-family: var(--font-display); font-size: 28px; color: var(--muted);
  display: flex; align-items: center; gap: 16px;
}
.lib-row-year svg { color: var(--red); }

.lib-pager { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; gap: 16px; flex-wrap: wrap; }
.lib-pager-info { font-size: 14px; color: var(--muted); }

@media (max-width: 900px) {
  .lib-body-grid { grid-template-columns: 1fr; }
  .lib-filters { position: static; max-height: none; }
  .lib-head-grid { grid-template-columns: 1fr; }
}
`;

window.SongLibrary = SongLibrary;
