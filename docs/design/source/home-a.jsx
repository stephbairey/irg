/* global React, SiteHeader, SiteFooter, GrannyImg, ISSUES, SONGS, FEATURED_LYRIC, HERSTORY, FAQ_TEASER, IconSearch, IconArrow, IconArrowL, IconMap, IconDown, IconShuffle, IconSparkle, IconPlus, renderLyric */

/* ================================================================
   Homepage Variant A — "Songbook"
   Editorial, typographic, protest-sign accents. Hero is a
   manifesto-style tagline with a stamp-like sign motif. Featured
   song appears as a lyric pull-quote. Issues as a chip wall.
   ================================================================ */
function HomepageSongbook() {
  const featured = SONGS.find(s => s.featured) || SONGS[3];
  const [shuffleIdx, setShuffleIdx] = React.useState(0);
  const randomSongs = [SONGS[0], SONGS[7], SONGS[5], SONGS[11]];
  const spot = randomSongs[shuffleIdx % randomSongs.length];

  return (
    <div className="home-a">
      <SiteHeader active="home" />

      {/* ================= HERO ================= */}
      <section className="hero-a">
        <div className="container" style={{ position: 'relative' }}>
          <div className="hero-a-grid">
            <div className="hero-a-copy">
              <div className="hero-a-kicker">
                <span className="kicker-dot" /> Singing since 1987 · 80 gaggles and counting
              </div>
              <h1 className="hero-a-title">
                We raise our voices<br/>
                <em className="hero-a-em">(and our blood pressure)</em><br/>
                for a better world.
              </h1>
              <p className="hero-a-body">
                We are a global network of women over fifty who protest injustice
                with satirical songs, flowered hats, and the unreasonable patience
                of people who have been doing this for a very long time.
              </p>
              <div className="hero-a-cta">
                <a href="#songs" className="btn btn-primary">
                  Browse 1,493 songs <IconArrow size={16} />
                </a>
                <a href="#gaggles" className="btn btn-ghost">
                  <IconMap size={16} /> Find a gaggle
                </a>
              </div>
              <div className="hero-a-stats">
                <div><b>1,493</b><span>songs</span></div>
                <div><b>80+</b><span>gaggles</span></div>
                <div><b>39</b><span>years</span></div>
                <div><b>0</b><span>corporate sponsors</span></div>
              </div>
            </div>

            <div className="hero-a-art">
              <GrannyImg alt="The raging granny — marching with sign" className="hero-a-granny" />
              <div className="hero-a-sign sign-1">No Peace?<br/><em>No Peace &amp; Quiet.</em></div>
              <div className="hero-a-sign sign-2">Grandmothers<br/>Against Everything</div>
              <div className="hero-a-sign sign-3">I’m Not Cute.<br/>I’m Furious.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURED LYRIC ================= */}
      <section className="featured-lyric">
        <div className="container">
          <div className="featured-lyric-inner">
            <div>
              <div className="kicker" style={{ color: 'var(--red)' }}>Today’s pick · from the songbook</div>
              <h2 className="featured-lyric-title">{featured.title}</h2>
              <div className="featured-lyric-meta">
                to the tune of <em>{featured.tune}</em> · by {featured.writer} · <span style={{ color: 'var(--ink)' }}>{featured.gaggle}</span>
              </div>
              <blockquote className="featured-lyric-quote">
                {FEATURED_LYRIC.lines.map((l, i) => <div key={i}>{l}</div>)}
              </blockquote>
              <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                <a href="#" className="btn btn-ink">Read the whole song <IconArrow size={16} /></a>
                <button className="btn btn-ghost" onClick={() => setShuffleIdx(i => i + 1)}>
                  <IconShuffle size={16} /> Try a random song
                </button>
              </div>
            </div>
            <aside className="featured-lyric-side">
              <div className="featured-lyric-rand">
                <div className="kicker">Currently on rotation</div>
                <div className="featured-lyric-rand-title">{spot.title}</div>
                <div className="featured-lyric-rand-meta">
                  to <em>{spot.tune}</em><br/>
                  {spot.gaggle} Gaggle · {spot.year}
                </div>
                <a href="#" className="featured-lyric-rand-link">Sing it →</a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ================= ISSUES ================= */}
      <section className="issues-wall">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="kicker">The catalog</div>
              <h2 className="section-head-title">Browse by the outrage that fits.</h2>
            </div>
            <a href="#" className="section-head-link">All 1,493 songs <IconArrow size={14} /></a>
          </div>
          <div className="issues-wall-grid">
            {ISSUES.slice(0, 12).map(iss => (
              <a href="#" key={iss.slug} className={`issue-tile issue-tint-${iss.tint}`}>
                <div className="issue-tile-count">{iss.count}</div>
                <div className="issue-tile-label">{iss.label}</div>
              </a>
            ))}
            <a href="#" className="issue-tile issue-tile-more">
              + {ISSUES.length - 12} more<br/>categories
            </a>
          </div>
        </div>
      </section>

      {/* ================= HERSTORY ================= */}
      <section className="herstory">
        <div className="container">
          <div className="herstory-grid">
            <div>
              <div className="kicker">Herstory, briefly</div>
              <div className="herstory-year">1987.</div>
              <p className="herstory-line">{HERSTORY.line}</p>
              <a href="#" className="underline-link">Read the full story →</a>
            </div>
            <div className="herstory-art">
              <div className="ph-image" style={{ aspectRatio: '4/3' }}>
                PHOTO · Original Victoria gaggle<br/>at first anti-sub protest
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= GAGGLE + START ================= */}
      <section className="split-cta">
        <div className="container">
          <div className="split-cta-grid">
            <a href="#" className="split-cta-card split-cta-find">
              <IconMap size={28} />
              <h3>Find a gaggle near you</h3>
              <p>80+ groups across North America, Europe, Australia, and wherever else women have had enough.</p>
              <span className="split-cta-arrow">Open the map <IconArrow size={14} /></span>
            </a>
            <a href="#" className="split-cta-card split-cta-start">
              <IconPlus size={28} />
              <h3>Don’t see one? Start one.</h3>
              <p>A minimum viable gaggle is three women, one songbook, and enough nerve to sing in public.</p>
              <span className="split-cta-arrow">The starter kit <IconArrow size={14} /></span>
            </a>
          </div>
        </div>
      </section>

      {/* ================= FAQ + NEWS ================= */}
      <section className="faq-news">
        <div className="container">
          <div className="faq-news-grid">
            <div>
              <div className="kicker">People ask</div>
              <h2 className="section-head-title" style={{ marginBottom: 32 }}>Questions we get, answered honestly.</h2>
              <div className="faq-list">
                {FAQ_TEASER.map((f, i) => (
                  <details key={i} className="faq-item" open={i === 0}>
                    <summary>{f.q}<IconDown size={18} /></summary>
                    <div className="faq-answer">{f.a}</div>
                  </details>
                ))}
              </div>
              <a href="#" className="underline-link" style={{ marginTop: 24, display: 'inline-block' }}>All the FAQ →</a>
            </div>

            <div>
              <div className="kicker">On the streets</div>
              <h2 className="section-head-title" style={{ marginBottom: 32 }}>Recent actions.</h2>
              <div className="news-list">
                <NewsItem date="April 18" city="Portland" title="Sang at the Rivian dealership for 4 hours. They closed early." />
                <NewsItem date="April 11" city="Toronto"  title="‘Drill, Baby, Chill’ debuted at the pipeline hearing." />
                <NewsItem date="April 04" city="Madrid"   title="Nueva Abuelas Indignadas chapter held its first rehearsal." />
                <NewsItem date="March 27" city="Brooklyn" title="Joined housing march — 3 new songs, 2 arrests (polite)." />
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      <style>{STYLES_A}</style>
    </div>
  );
}

function NewsItem({ date, city, title }) {
  return (
    <a href="#" className="news-item">
      <div className="news-item-date">{date}<span>{city}</span></div>
      <div className="news-item-title">{title}</div>
    </a>
  );
}

const STYLES_A = `
.home-a { background: var(--paper); }

/* hero */
.hero-a { padding: 72px 0 96px; position: relative; overflow: hidden; }
.hero-a::before {
  content: ''; position: absolute; inset: 0;
  background-image:
    radial-gradient(circle at 8% 85%, rgba(226,42,44,.04), transparent 40%),
    radial-gradient(circle at 92% 15%, rgba(87,34,140,.05), transparent 40%);
  pointer-events: none;
}
.hero-a-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 64px; align-items: center; }
.hero-a-kicker {
  font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
  color: var(--ink); display: inline-flex; align-items: center; gap: 10px;
  padding: 8px 14px; background: var(--paper-2); border-radius: 999px; margin-bottom: 28px;
}
.kicker-dot { width: 8px; height: 8px; background: var(--red); border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(226,42,44,.18); animation: pulse 2.4s ease-in-out infinite; }
@keyframes pulse { 50% { box-shadow: 0 0 0 7px rgba(226,42,44,0); } }
.hero-a-title {
  font-size: clamp(56px, 6.5vw, 88px);
  line-height: .98; letter-spacing: -.005em;
  color: var(--ink); margin-bottom: 32px;
}
.hero-a-em {
  display: inline-block; font-family: 'Nunito Sans', sans-serif;
  font-weight: 400; font-style: italic; font-size: .55em;
  color: var(--red); padding: 4px 14px; background: var(--rose);
  transform: rotate(-1deg); border-radius: 4px; line-height: 1.2;
  margin: 6px 0 2px;
}
.hero-a-body { font-size: 21px; line-height: 1.5; color: var(--text-soft); max-width: 560px; margin: 0 0 36px; }
.hero-a-cta { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 56px; }
.hero-a-stats {
  display: grid; grid-template-columns: repeat(4, auto); gap: 40px;
  padding-top: 28px; border-top: 1px solid var(--rule);
}
.hero-a-stats b { font-family: var(--font-display); font-size: 36px; color: var(--ink); display: block; line-height: 1; }
.hero-a-stats span { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); display: block; margin-top: 6px; }

.hero-a-art { position: relative; display: flex; justify-content: center; align-items: center; min-height: 520px; }
.hero-a-granny { width: 380px; max-width: 100%; filter: drop-shadow(0 8px 30px rgba(42,24,71,.18)); }
.hero-a-sign {
  position: absolute; padding: 10px 16px; background: var(--ink); color: var(--on-dark);
  font-family: var(--font-display); font-size: 20px; line-height: 1.1; text-align: center;
  border-radius: 3px; box-shadow: 0 4px 18px rgba(42,24,71,.25);
}
.hero-a-sign em { font-style: italic; color: var(--mustard); font-size: .8em; }
.sign-1 { top: 5%; left: 0; transform: rotate(-6deg); background: var(--ink); }
.sign-2 { top: 40%; right: -4%; transform: rotate(4deg); background: var(--red); }
.sign-3 { bottom: 5%; left: 8%; transform: rotate(-3deg); background: var(--ink-soft); }

/* section utilities */
.section-head {
  display: flex; justify-content: space-between; align-items: flex-end;
  margin-bottom: 40px; gap: 32px; flex-wrap: wrap;
}
.section-head-title { font-size: 48px; max-width: 700px; letter-spacing: -.005em; }
.section-head-link {
  font-family: var(--font-body); font-weight: 800; font-size: 14px;
  color: var(--red); display: inline-flex; align-items: center; gap: 6px;
  text-transform: uppercase; letter-spacing: .08em; white-space: nowrap;
}

/* featured lyric */
.featured-lyric { background: var(--ink); color: var(--on-dark); padding: 96px 0; position: relative; overflow: hidden; }
.featured-lyric::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px;
  background: repeating-linear-gradient(90deg, var(--red) 0 40px, var(--mustard) 40px 80px, var(--ink-lilac) 80px 120px);
}
.featured-lyric-inner { display: grid; grid-template-columns: 1.6fr 1fr; gap: 56px; align-items: flex-start; }
.featured-lyric-title { font-size: 68px; color: var(--on-dark); margin: 8px 0 12px; line-height: .95; }
.featured-lyric-meta { color: var(--ink-lilac); font-size: 16px; margin-bottom: 36px; }
.featured-lyric-meta em { color: #fff; font-style: italic; }
.featured-lyric-quote {
  margin: 0; padding: 0 0 0 24px; border-left: 3px solid var(--mustard);
  font-family: var(--font-body); font-size: 24px; line-height: 1.5; color: var(--on-dark);
  font-style: italic;
}
.featured-lyric-side { padding-top: 32px; }
.featured-lyric-rand {
  padding: 24px; background: rgba(245,244,230,.08); border: 1px solid rgba(245,244,230,.15);
  border-radius: var(--radius);
}
.featured-lyric-rand .kicker { color: var(--mustard); }
.featured-lyric-rand-title { font-family: var(--font-display); font-size: 32px; color: var(--on-dark); margin: 10px 0 6px; line-height: 1; }
.featured-lyric-rand-meta { color: var(--ink-lilac); font-size: 14px; line-height: 1.5; }
.featured-lyric-rand-meta em { font-style: italic; color: #fff; }
.featured-lyric-rand-link { display: inline-block; margin-top: 16px; font-weight: 800; color: var(--mustard); }

/* issues */
.issues-wall { padding: 96px 0; }
.issues-wall-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.issue-tile {
  padding: 28px 22px 24px; border-radius: var(--radius-lg); background: var(--card);
  border: 1px solid var(--rule); color: var(--text); display: flex; flex-direction: column;
  justify-content: space-between; min-height: 140px; transition: transform .15s ease, box-shadow .15s ease;
}
.issue-tile:hover { transform: translateY(-3px); box-shadow: var(--shadow-lift); text-decoration: none; }
.issue-tile-count { font-family: var(--font-display); font-size: 40px; color: var(--ink); line-height: 1; }
.issue-tile-label { font-weight: 700; font-size: 16px; color: var(--text); }
.issue-tint-red .issue-tile-count { color: var(--red); }
.issue-tint-mustard { background: rgba(232,197,71,.14); border-color: rgba(232,197,71,.45); }
.issue-tile-more {
  background: transparent; border: 2px dashed var(--ink-lilac); color: var(--ink);
  align-items: center; justify-content: center; text-align: center; font-family: var(--font-display); font-size: 22px; line-height: 1.1;
}

/* herstory */
.herstory { padding: 96px 0; background: var(--paper-2); position: relative; }
.herstory-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; }
.herstory-year { font-family: var(--font-display); font-size: 200px; color: var(--red); line-height: .9; margin: 12px 0 24px; letter-spacing: -.01em; }
.herstory-line { font-size: 22px; line-height: 1.55; color: var(--text); margin: 0 0 24px; }
.underline-link {
  font-family: var(--font-body); font-weight: 800; color: var(--ink);
  border-bottom: 2px solid var(--red); padding-bottom: 3px;
}
.underline-link:hover { color: var(--red); text-decoration: none; }
.herstory-art .ph-image { min-height: 320px; }

/* split CTAs */
.split-cta { padding: 96px 0; }
.split-cta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.split-cta-card {
  padding: 40px; border-radius: var(--radius-lg); color: var(--on-dark);
  display: flex; flex-direction: column; gap: 14px; transition: transform .15s ease, box-shadow .2s ease;
  min-height: 280px; position: relative; overflow: hidden;
}
.split-cta-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lift); text-decoration: none; }
.split-cta-card h3 { font-family: var(--font-display); font-size: 42px; color: var(--on-dark); line-height: 1; }
.split-cta-card p { font-size: 17px; line-height: 1.5; margin: 0; flex: 1; max-width: 440px; }
.split-cta-find { background: var(--ink); }
.split-cta-start { background: var(--red); }
.split-cta-arrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-weight: 800; font-size: 14px; letter-spacing: .08em; text-transform: uppercase;
  padding-top: 14px; border-top: 1px solid rgba(255,255,255,.25);
}

/* FAQ + news */
.faq-news { padding: 96px 0; }
.faq-news-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 72px; align-items: flex-start; }
.faq-list { border-top: 1px solid var(--rule); }
.faq-item { border-bottom: 1px solid var(--rule); padding: 22px 0; }
.faq-item summary {
  cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center;
  font-family: var(--font-display); font-size: 24px; color: var(--ink); gap: 20px;
}
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item[open] summary svg { transform: rotate(180deg); }
.faq-item summary svg { transition: transform .2s; color: var(--red); }
.faq-answer { padding-top: 14px; color: var(--text-soft); font-size: 17px; line-height: 1.6; max-width: 640px; }

.news-list { display: grid; gap: 4px; }
.news-item {
  padding: 18px 0; border-bottom: 1px solid var(--rule); color: var(--text);
  display: grid; grid-template-columns: 120px 1fr; gap: 20px; align-items: baseline;
}
.news-item:hover { text-decoration: none; }
.news-item:hover .news-item-title { color: var(--red); }
.news-item-date {
  font-family: var(--font-display); font-size: 22px; color: var(--ink); line-height: 1;
}
.news-item-date span {
  display: block; font-family: var(--font-body); font-size: 11px; font-weight: 800;
  letter-spacing: .1em; text-transform: uppercase; color: var(--muted); margin-top: 6px;
}
.news-item-title { font-size: 18px; line-height: 1.35; font-weight: 600; color: var(--text); transition: color .15s; }

@media (max-width: 900px) {
  .hero-a-grid, .herstory-grid, .split-cta-grid, .faq-news-grid, .featured-lyric-inner { grid-template-columns: 1fr; gap: 40px; }
  .issues-wall-grid { grid-template-columns: repeat(2, 1fr); }
  .hero-a-title { font-size: 48px; }
  .section-head-title { font-size: 36px; }
  .featured-lyric-title { font-size: 42px; }
  .herstory-year { font-size: 120px; }
}
`;

window.HomepageSongbook = HomepageSongbook;
