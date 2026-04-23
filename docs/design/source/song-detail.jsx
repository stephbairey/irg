/* global React, SiteHeader, SiteFooter, ISSUES, SONGS, IconArrowL, IconPrint, IconArrow, IconPlay, renderLyric */

/* ================================================================
   Song Detail — context-first, then lyrics.
   Context: tune, gaggle, songwriter, year, issue. Then full lyrics.
   PDF/print, "more on this issue" rail.
   ================================================================ */

const DETAIL_LYRICS = [
  { type: 'section', label: '[Chorus]' },
  { type: 'lines', lines: [
    "And it’s *go*, *team*, *go*",
    "They’ll **time** your **every breath**",
    "And everyday you’re in this *place*",
    "You’re two day nearer **death**",
    "But you go…",
  ]},
  { type: 'section', label: '[Verse 1]' },
  { type: 'lines', lines: [
    "A working *hand* am I, and I’m tellin’ you no lie",
    "I work and breathe among the fumes that **foul up** our sky",
    "There’s loud noise all around me and there’s **poison** in the air",
    "There’s a lousy smell that **smacks of hell** and dust all through my hair",
  ]},
  { type: 'section', label: '[Chorus]' },
  { type: 'section', label: '[Verse 2]' },
  { type: 'lines', lines: [
    "Well I’ve worked among the drivers and I’ve dropped your dinner off,",
    "I’ve slipped upon your icy walk, your package **held aloft**,",
    "I don’t have time for lunch or breaks, and have to hold *my* urine,",
    "The work is tough, I’ve seen enough to make your **stomach turn**.",
  ]},
  { type: 'section', label: '[Chorus]' },
  { type: 'section', label: '[Verse 3]' },
  { type: 'lines', lines: [
    "There’s overtime but nurses have no bonuses in store",
    "But they all need the money and they all come **back for more**",
    "But soon their back is out and there’s **no money** for their care",
    "For every cent made on the job, their body pays its share.",
  ]},
  { type: 'section', label: '[Chorus]' },
];

function SongDetail(props = {}) {
  const song = {
    title: 'The Modern Workers Song',
    tune: "The Chemical Worker's Song (Process Man)",
    gaggle: 'Green Bay',
    writer: 'Garnet De Grave, Susan Dutton',
    year: 2026,
    written: 'April 14, 2026',
    tags: ['labor'],
    note: 'First sung at the UPS worker rally on April 15. Goes well at any picket line where the signs outnumber the riot shields.',
  };

  const relatedIssue = SONGS.filter(s => s.tags.includes('labor') || s.tags.includes('corp')).slice(0, 4);

  return (
    <div className="detail">
      <SiteHeader active="songs" />

      {/* crumb */}
      <div className="container" style={{ paddingTop: 32 }}>
        <a href="song-library.html" className="detail-crumb">
          <IconArrowL size={16} /> Back to the Song Library
        </a>
      </div>

      {/* ======= CONTEXT HEADER ======= */}
      <section className="detail-head">
        <div className="container">
          <div className="detail-head-grid">
            <div className="detail-head-main">
              <span className="chip chip-lg" style={{ background: 'rgba(87,34,140,.1)' }}>
                Labor &amp; Worker Rights
              </span>
              <h1 className="detail-title">{song.title}</h1>

              <dl className="detail-meta">
                <div>
                  <dt>Sung to</dt>
                  <dd><em>{song.tune}</em></dd>
                </div>
                <div>
                  <dt>Written by</dt>
                  <dd>{song.writer}</dd>
                </div>
                <div>
                  <dt>Gaggle</dt>
                  <dd><a href="#">{song.gaggle} Gaggle</a></dd>
                </div>
                <div>
                  <dt>Filed</dt>
                  <dd>{song.written}</dd>
                </div>
              </dl>

              <div className="detail-note">
                <span className="kicker" style={{ color: 'var(--red)' }}>Songwriter’s note</span>
                <p>{song.note}</p>
              </div>

              <div className="detail-actions">
                <a href="#lyrics" className="btn btn-primary">Jump to lyrics <IconArrow size={14} /></a>
                <button className="btn btn-ghost"><IconPrint size={16} /> Print songsheet</button>
                <button className="btn btn-ghost">Download PDF</button>
              </div>
            </div>

            <aside className="detail-aside">
              {props.hasVideo !== false ? (
                <div className="detail-aside-card">
                  <div className="kicker" style={{ color: 'var(--mustard)' }}>Listen to the original</div>
                  <div className="detail-video-placeholder">
                    <div className="detail-video-play"><IconPlay size={26} /></div>
                    <div className="detail-video-title">The Chemical Worker’s Song</div>
                    <div className="detail-video-sub">by Great Big Sea · YouTube</div>
                  </div>
                  <p className="detail-aside-hint">
                    Familiarise yourself with the tune, then sing over the verses.
                    The rhythm does the work for you.
                  </p>
                </div>
              ) : (
                <div className="detail-aside-card detail-aside-card--notune">
                  <div className="kicker" style={{ color: 'var(--mustard)' }}>No recording on file</div>
                  <div className="detail-notune-title">
                    Sing it to <em>“The Chemical Worker’s Song”</em>
                  </div>
                  <p className="detail-aside-hint">
                    We don’t have a YouTube link for this tune yet. If you know a good
                    recording — or you’ve made one yourself — we’d love to add it.
                  </p>
                  <div className="detail-notune-actions">
                    <a className="btn btn-ghost-on-dark" href="#" target="_blank" rel="noopener">
                      Search YouTube <IconArrow size={13} />
                    </a>
                    <a className="btn btn-ghost-on-dark" href="#">
                      Suggest a link
                    </a>
                  </div>
                </div>
              )}

              <div className="detail-aside-stats">
                <div>
                  <b>#847</b>
                  <span>of 1,493 in the library</span>
                </div>
                <div>
                  <b>Labor &amp; Worker Rights</b>
                  <span>155 other songs on this issue</span>
                </div>
                <div>
                  <b>Green Bay Gaggle</b>
                  <span>41 songs from this gaggle</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ======= LYRICS ======= */}
      <section className="detail-lyrics-section" id="lyrics">
        <div className="container">
          <div className="detail-lyrics-grid">
            <aside className="detail-lyrics-rail" aria-label="Legend">
              <div className="kicker">How to read the marks</div>
              <div className="legend-row">
                <em style={{ color: 'var(--ink-soft)', fontStyle: 'italic', fontSize: 17 }}>italic</em>
                <span>melodic emphasis</span>
              </div>
              <div className="legend-row">
                <strong style={{ color: 'var(--ink)', fontSize: 17 }}>bold</strong>
                <span>strong beat / shout</span>
              </div>
              <div className="legend-row">
                <span className="legend-section">[Chorus]</span>
                <span>section marker</span>
              </div>
              <hr className="rule" style={{ margin: '24px 0' }}/>
              <div className="kicker">Tips from the gaggle</div>
              <ul className="legend-tips">
                <li>Start slower than you think — the verses speed up naturally.</li>
                <li>The chorus is a unison shout, not a harmony. Don’t overthink it.</li>
                <li>Designate one granny to hold the last syllable of each verse.</li>
              </ul>
            </aside>

            <article className="detail-lyrics">
              <div className="detail-lyrics-head">
                <span className="sign-tag">SING IT</span>
                <span className="detail-lyrics-meta">to <em>{song.tune}</em></span>
              </div>
              <div className="detail-lyrics-body">
                {DETAIL_LYRICS.map((block, i) => {
                  if (block.type === 'section') {
                    return <div key={i} className="detail-lyrics-section-label">{block.label}</div>;
                  }
                  return (
                    <div key={i} className="detail-lyrics-block">
                      {block.lines.map((l, j) => (
                        <div key={j} className="detail-lyric-line">{renderLyric(l)}</div>
                      ))}
                    </div>
                  );
                })}
                <div className="detail-lyrics-end">♦ ♦ ♦</div>
              </div>

              <div className="detail-lyrics-foot">
                <div>
                  <span className="kicker">Written by</span>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{song.writer}</div>
                </div>
                <div>
                  <span className="kicker">For the</span>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{song.gaggle} Gaggle</div>
                </div>
                <div>
                  <span className="kicker">Filed</span>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{song.written}</div>
                </div>
                <div className="detail-lyrics-share">
                  <button className="btn-mini">Copy lyrics</button>
                  <button className="btn-mini">Suggest edit</button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ======= RELATED (same issue) ======= */}
      <section className="detail-related">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="kicker">Keep singing · on this issue</div>
              <h2 className="detail-related-title">More songs about work, workers, and who keeps the profit.</h2>
            </div>
            <a href="#" className="section-head-link">All 156 labor songs <IconArrow size={14} /></a>
          </div>
          <div className="detail-related-grid">
            {relatedIssue.map(s => (
              <a href="#" key={s.id} className="detail-related-card">
                <div className="kicker">{s.year}</div>
                <h3>{s.title}</h3>
                <div className="detail-related-meta">
                  to <em>{s.tune}</em><br/>
                  {s.gaggle} · {s.writer}
                </div>
                <span className="detail-related-arrow">Open →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
      <style>{STYLES_DETAIL}</style>
    </div>
  );
}

const STYLES_DETAIL = `
.detail { background: var(--paper); }

.detail-crumb {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--font-body); font-weight: 800; font-size: 14px;
  color: var(--red); letter-spacing: .02em;
}

/* head */
.detail-head { padding: 32px 0 56px; border-bottom: 1px solid var(--rule); }
.detail-head-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 56px; align-items: flex-start; }
.detail-title {
  font-size: clamp(56px, 7vw, 92px); color: var(--ink); line-height: .96;
  margin: 18px 0 28px; letter-spacing: -.005em;
}
.detail-meta {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px 40px;
  padding: 24px 0; margin: 0 0 28px; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
}
.detail-meta dt {
  font-family: var(--font-body); font-size: 11px; font-weight: 800;
  letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px;
}
.detail-meta dd { margin: 0; font-size: 17px; color: var(--ink); font-weight: 600; }
.detail-meta dd em { font-style: italic; color: var(--ink-soft); font-weight: 500; }

.detail-note {
  padding: 18px 22px; background: var(--paper-2); border-left: 3px solid var(--red);
  border-radius: 0 var(--radius) var(--radius) 0; margin-bottom: 28px;
}
.detail-note p { margin: 8px 0 0; font-size: 17px; line-height: 1.55; color: var(--text); font-style: italic; }

.detail-actions { display: flex; gap: 12px; flex-wrap: wrap; }

/* aside */
.detail-aside { display: grid; gap: 24px; }
.detail-aside-card {
  padding: 24px; background: var(--ink); color: var(--on-dark); border-radius: var(--radius);
}
.detail-video-placeholder {
  position: relative; margin-top: 14px; padding: 40px 20px 30px;
  background: linear-gradient(135deg, #2a1847, #3a1f5e); border-radius: 8px;
  text-align: center; aspect-ratio: 16/10; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background-image:
    radial-gradient(circle at 50% 40%, rgba(226,42,44,.35), transparent 55%);
}
.detail-video-play {
  width: 64px; height: 64px; border-radius: 50%; background: var(--red); color: #fff;
  display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
  box-shadow: 0 6px 20px rgba(0,0,0,.3);
}
.detail-video-title { font-family: var(--font-display); font-size: 20px; color: var(--on-dark); }
.detail-video-sub { font-size: 13px; color: var(--ink-lilac); margin-top: 4px; }
.detail-aside-hint { font-size: 14px; color: var(--ink-lilac); margin: 16px 0 0; line-height: 1.5; }

/* graceful no-video variant */
.detail-aside-card--notune { display: grid; gap: 6px; }
.detail-notune-title {
  font-family: var(--font-display); font-size: 24px; line-height: 1.15;
  color: var(--on-dark); margin-top: 4px;
}
.detail-notune-title em { font-style: italic; color: var(--mustard); font-weight: 400; }
.detail-notune-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
.btn-ghost-on-dark {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 14px; border-radius: 999px;
  background: transparent; color: var(--on-dark);
  border: 1px solid rgba(255,255,255,.28);
  font: 700 13px/1 var(--font-body); letter-spacing: .02em;
  text-decoration: none; cursor: pointer;
}
.btn-ghost-on-dark:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.5); }

.detail-aside-stats { display: grid; gap: 14px; }
.detail-aside-stats > div {
  padding: 14px 18px; background: var(--card); border: 1px solid var(--rule); border-radius: 8px;
}
.detail-aside-stats b { display: block; font-family: var(--font-display); font-size: 22px; color: var(--ink); line-height: 1; margin-bottom: 6px; }
.detail-aside-stats span { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }

/* lyrics section */
.detail-lyrics-section { padding: 72px 0; }
.detail-lyrics-grid { display: grid; grid-template-columns: 240px 1fr; gap: 48px; align-items: flex-start; }
.detail-lyrics-rail { position: sticky; top: 120px; font-size: 14px; color: var(--text-soft); }
.legend-row { display: flex; gap: 14px; align-items: baseline; padding: 8px 0; border-bottom: 1px dotted var(--rule); }
.legend-row span { color: var(--muted); font-size: 13px; }
.legend-section { font-family: var(--font-mono); font-size: 13px; color: var(--ink); background: var(--paper-2); padding: 2px 8px; border-radius: 4px; }
.legend-tips { list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 10px; font-size: 14px; line-height: 1.5; }
.legend-tips li { padding-left: 18px; position: relative; }
.legend-tips li::before { content: '✱'; position: absolute; left: 0; top: 0; color: var(--red); }

.detail-lyrics { background: var(--card); border: 1px solid var(--rule); border-radius: var(--radius-lg); padding: 48px 56px 40px; box-shadow: var(--shadow-card); position: relative; }
.detail-lyrics::before {
  content: ''; position: absolute; top: 0; left: 40px; right: 40px; height: 4px;
  background: repeating-linear-gradient(90deg, var(--red) 0 20px, var(--ink) 20px 40px, var(--mustard) 40px 60px);
  border-radius: 0 0 2px 2px;
}
.detail-lyrics-head { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; flex-wrap: wrap; }
.detail-lyrics-meta { font-size: 15px; color: var(--muted); }
.detail-lyrics-meta em { font-style: italic; color: var(--ink-soft); }
.detail-lyrics-body {
  font-family: var(--font-body); font-size: 20px; line-height: 1.75; color: var(--text);
  max-width: 640px;
}
.detail-lyrics-section-label {
  font-family: var(--font-mono); font-size: 14px; font-weight: 600; color: var(--ink-soft);
  background: var(--paper-2); padding: 4px 12px; border-radius: 4px;
  display: inline-block; margin: 24px 0 14px; letter-spacing: .02em;
}
.detail-lyrics-section-label:first-child { margin-top: 0; }
.detail-lyrics-block { margin-bottom: 8px; }
.detail-lyric-line strong { color: var(--ink); font-weight: 800; }
.detail-lyric-line em { color: var(--ink-soft); font-style: italic; font-weight: 500; }
.detail-lyrics-end { font-family: var(--font-display); color: var(--red); font-size: 28px; margin-top: 32px; letter-spacing: 12px; }

.detail-lyrics-foot {
  margin-top: 48px; padding-top: 24px; border-top: 1px dashed var(--rule);
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; align-items: center;
}
.btn-mini { background: transparent; border: 1.5px solid var(--rule); padding: 8px 14px; border-radius: 6px; font-weight: 700; font-family: var(--font-body); color: var(--ink); cursor: pointer; font-size: 13px; margin-right: 6px; }
.btn-mini:hover { border-color: var(--red); color: var(--red); }
.detail-lyrics-share { grid-column: span 2; text-align: right; }

/* related */
.detail-related { padding: 96px 0; background: var(--paper-2); }
.detail-related-title { font-size: 40px; max-width: 600px; line-height: 1.05; letter-spacing: -.005em; }
.detail-related-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.detail-related-card {
  padding: 24px 20px 20px; background: var(--card); border: 1px solid var(--rule);
  border-radius: var(--radius); color: var(--text); min-height: 200px;
  display: flex; flex-direction: column; gap: 8px;
  transition: transform .15s, box-shadow .15s;
}
.detail-related-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lift); text-decoration: none; }
.detail-related-card h3 { font-family: var(--font-display); font-size: 26px; color: var(--ink); line-height: 1; margin: 4px 0 10px; }
.detail-related-meta { font-size: 13px; color: var(--text-soft); line-height: 1.5; flex: 1; }
.detail-related-meta em { font-style: italic; color: var(--ink-soft); }
.detail-related-arrow { font-weight: 800; color: var(--red); font-size: 14px; padding-top: 12px; border-top: 1px solid var(--rule); }

@media (max-width: 900px) {
  .detail-head-grid, .detail-lyrics-grid { grid-template-columns: 1fr; }
  .detail-lyrics-rail { position: static; }
  .detail-related-grid { grid-template-columns: repeat(2, 1fr); }
  .detail-lyrics { padding: 32px 24px; }
  .detail-lyrics-foot { grid-template-columns: 1fr 1fr; }
  .detail-lyrics-share { grid-column: span 2; text-align: left; }
}
`;

window.SongDetail = SongDetail;
