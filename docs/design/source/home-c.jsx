/* global React, SiteHeader, SiteFooter, GrannyImg, ISSUES, SONGS, FEATURED_LYRIC, HERSTORY, FAQ_TEASER, IconArrow, IconMap, IconDown, IconPlus, IconShuffle */

/* ================================================================
   Homepage Variant C — "Marquee"
   Kinetic, poster-forward. Big bold type, a scrolling marquee of
   song titles, and a heavy red/ink block for the hero. Most
   overtly activist of the three.
   ================================================================ */
function HomepageMarquee() {
  const marqueeTitles = [
    'My Blockade', 'These Grannies', 'We Will Stop You', 'Pipeline to Nowhere',
    'Drill, Baby, Chill', "Grandma's Got a Bullhorn", 'CEO Lullaby',
    'Come Back Home, America', 'The Modern Workers Song', 'Rent is Too Damn High',
    'The Ballot Box Blues',
  ];
  const rand = SONGS[Math.floor(Math.random() * SONGS.length)];

  return (
    <div className="home-c">
      <SiteHeader active="home" />

      {/* ================= HERO ================= */}
      <section className="mq-hero">
        <div className="mq-hero-inner">
          <div className="mq-kicker">
            <span>INTL NETWORK</span>
            <span>·</span>
            <span>EST. 1987</span>
            <span>·</span>
            <span>80+ GAGGLES</span>
            <span>·</span>
            <span>1,493 SONGS</span>
          </div>
          <h1 className="mq-title">
            <span className="mq-title-line">SING</span>
            <span className="mq-title-line mq-title-line-alt">
              <em>like</em> you <u>mean</u> it.
            </span>
            <span className="mq-title-line">MARCH</span>
            <span className="mq-title-line mq-title-line-alt">
              <em>like</em> you <u>mean</u> it.
            </span>
            <span className="mq-title-line">RAGE</span>
            <span className="mq-title-line mq-title-line-alt">
              <em>like</em> a granny.
            </span>
          </h1>

          <div className="mq-hero-bottom">
            <p className="mq-hero-tag">
              An international chorus of women over 50, using satirical songs
              and theatrical audacity to demand peace, justice, and a livable
              planet. <strong>Started in Victoria, BC. Still going.</strong>
            </p>
            <div className="mq-hero-cta">
              <a href="#" className="btn btn-primary btn-lg">Browse the songbook <IconArrow size={18} /></a>
              <a href="#" className="btn btn-ghost btn-lg">Find your gaggle</a>
            </div>
          </div>
        </div>

        {/* marquee ticker */}
        <div className="mq-ticker">
          <div className="mq-ticker-track">
            {[...marqueeTitles, ...marqueeTitles].map((t, i) => (
              <span key={i} className="mq-ticker-item">
                {t} <span className="mq-ticker-dot">★</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PHILOSOPHY ================= */}
      <section className="mq-philosophy">
        <div className="container">
          <div className="mq-philosophy-grid">
            <div className="mq-philosophy-number">01</div>
            <div>
              <div className="kicker" style={{ color: 'var(--red)' }}>What is this, exactly</div>
              <h2 className="mq-philo-head">
                Older women are <em>under</em>estimated.<br/>
                So we <u>over</u>estimate right back.
              </h2>
              <p className="mq-philo-body">
                The premise is simple: a chorus of women in flowered hats singing
                a clever rewrite of <em>These Boots Are Made for Walkin’</em> is
                harder to ignore than a polite letter, and harder to arrest than
                a lone dissenter. Every gaggle is independent. Every gaggle
                writes its own songs. We just keep the songbook.
              </p>
              <div className="mq-philo-links">
                <a href="#" className="underline-link">Our philosophy →</a>
                <a href="#" className="underline-link">The herstory →</a>
                <a href="#" className="underline-link">How gaggles work →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURED SONG ================= */}
      <section className="mq-featured">
        <div className="container">
          <div className="mq-philosophy-grid">
            <div className="mq-philosophy-number mq-num-cream">02</div>
            <div>
              <div className="kicker" style={{ color: 'var(--mustard)' }}>Today from the songbook</div>
              <h2 className="mq-feat-title">{FEATURED_LYRIC.title}</h2>
              <div className="mq-feat-meta">
                to <em>The Chemical Worker’s Song</em> · Green Bay Gaggle · Garnet De Grave &amp; Susan Dutton
              </div>
              <blockquote className="mq-feat-quote">
                {FEATURED_LYRIC.lines.map((l, i) => <div key={i}>{l}</div>)}
              </blockquote>
              <div className="mq-feat-cta">
                <a href="#" className="btn btn-primary">Read &amp; sing it <IconArrow size={16} /></a>
                <a href="#" className="btn-ghost-dark">
                  <IconShuffle size={16} /> Shuffle another
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ISSUES ================= */}
      <section className="mq-issues">
        <div className="container">
          <div className="mq-philosophy-grid">
            <div className="mq-philosophy-number">03</div>
            <div>
              <div className="kicker" style={{ color: 'var(--red)' }}>The library, by theme</div>
              <h2 className="mq-philo-head">
                1,493 songs. 17 outrages. Pick a flavour.
              </h2>
              <div className="mq-issues-list">
                {ISSUES.slice(0, 14).map((iss, i) => (
                  <a href="#" key={iss.slug} className="mq-issue-row">
                    <span className="mq-issue-num">{String(i+1).padStart(2,'0')}</span>
                    <span className="mq-issue-label">{iss.label}</span>
                    <span className="mq-issue-count">{iss.count} <span>songs</span></span>
                    <span className="mq-issue-arrow"><IconArrow size={18} /></span>
                  </a>
                ))}
              </div>
              <a href="#" className="underline-link" style={{ marginTop: 24, display: 'inline-block' }}>See all 17 →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= GAGGLE ================= */}
      <section className="mq-gaggle">
        <div className="container">
          <div className="mq-gaggle-grid">
            <div>
              <div className="kicker" style={{ color: 'var(--mustard)' }}>04 · The network</div>
              <h2 className="mq-gaggle-title">
                Find one. Or <em>start</em> one.
              </h2>
              <p className="mq-gaggle-sub">
                A gaggle is three or more women, a shared sense of humour, and
                a willingness to sing in public. We’re in 80+ cities on 4 continents,
                and there is always room for another.
              </p>
              <div className="mq-gaggle-cta">
                <a href="#" className="btn btn-primary btn-lg"><IconMap size={18} /> Gaggle map</a>
                <a href="#" className="btn btn-ghost-light btn-lg"><IconPlus size={18} /> Starter kit</a>
              </div>
            </div>
            <div className="mq-gaggle-art">
              <GrannyImg src="assets/granny-cream.png" alt="" className="mq-gaggle-granny" />
              <div className="mq-gaggle-count">
                <b>80+</b>
                <span>gaggles</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="mq-faq">
        <div className="container-narrow">
          <div className="kicker" style={{ color: 'var(--red)' }}>05 · Questions</div>
          <h2 className="mq-philo-head" style={{ marginBottom: 40 }}>
            Some things we get asked.
          </h2>
          <div className="faq-list">
            {FAQ_TEASER.map((f, i) => (
              <details key={i} className="faq-item" open={i === 0}>
                <summary>{f.q}<IconDown size={18} /></summary>
                <div className="faq-answer">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL ================= */}
      <section className="mq-final">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="kicker" style={{ color: 'var(--mustard)' }}>Still reading?</div>
          <h2 className="mq-final-title">
            Find your gaggle.<br/><em>Or start one.</em>
          </h2>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32, position: 'relative' }}>
            <a href="gaggle-map.html" className="btn btn-primary btn-lg"><IconMap size={18} /> Open the gaggle map</a>
            <a href="#" className="btn-ghost-light btn-lg">Start-a-gaggle kit</a>
          </div>
        </div>
      </section>

      <SiteFooter />

      <style>{STYLES_C}</style>
    </div>
  );
}

const STYLES_C = `
.home-c { background: var(--paper); }
.home-c .btn-lg { padding: 18px 28px; font-size: 17px; min-height: 56px; }

/* hero */
.mq-hero { background: var(--ink); color: var(--on-dark); padding: 72px 0 0; position: relative; overflow: hidden; }
.mq-hero-inner { max-width: 1400px; margin: 0 auto; padding: 0 32px 56px; }
.mq-kicker {
  display: inline-flex; gap: 10px; padding: 8px 16px; margin-bottom: 40px;
  background: rgba(245,244,230,.08); border: 1px solid rgba(245,244,230,.15);
  border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: .15em; color: var(--mustard);
}
.mq-title { font-size: clamp(80px, 14vw, 220px); line-height: .82; letter-spacing: -.015em; color: var(--on-dark); margin-bottom: 40px; }
.mq-title-line { display: block; }
.mq-title-line-alt {
  font-family: var(--font-body); font-weight: 400; font-style: italic;
  font-size: .28em; color: var(--ink-lilac); line-height: 1.2;
  padding: 4px 0 10px 4px;
}
.mq-title-line-alt em { color: var(--red); font-style: italic; font-weight: 700; }
.mq-title-line-alt u { color: var(--mustard); text-decoration: underline; text-decoration-thickness: 3px; text-underline-offset: 4px; }
.mq-title .mq-title-line:nth-child(3) { color: var(--red); }
.mq-title .mq-title-line:nth-child(5) { color: var(--mustard); }

.mq-hero-bottom {
  display: grid; grid-template-columns: 1fr auto; gap: 56px; align-items: flex-end;
  padding-top: 32px; border-top: 1px solid rgba(245,244,230,.15);
}
.mq-hero-tag { font-size: 19px; line-height: 1.5; color: var(--ink-lilac); max-width: 540px; margin: 0; }
.mq-hero-tag strong { color: #fff; }
.mq-hero-cta { display: flex; gap: 14px; flex-wrap: wrap; }

/* light-ghost button for dark surfaces */
.btn-ghost-light { background: transparent; color: var(--on-dark); border: 2px solid var(--on-dark); display: inline-flex; align-items: center; gap: 10px; padding: 14px 22px; border-radius: 999px; font-weight: 800; font-size: 16px; }
.btn-ghost-light:hover { background: var(--on-dark); color: var(--ink); text-decoration: none; }

.home-c .mq-hero .btn-ghost { color: var(--on-dark); border-color: var(--on-dark); }
.home-c .mq-hero .btn-ghost:hover { background: var(--on-dark); color: var(--ink); }

/* ticker */
.mq-ticker {
  background: var(--red); border-top: 3px solid var(--ink); border-bottom: 3px solid var(--ink);
  overflow: hidden; color: var(--on-dark); padding: 16px 0;
}
.mq-ticker-track {
  display: flex; gap: 40px; width: max-content;
  animation: ticker 60s linear infinite;
  font-family: var(--font-display); font-size: 28px; white-space: nowrap;
}
.mq-ticker-item { display: inline-flex; gap: 40px; align-items: center; }
.mq-ticker-dot { color: var(--mustard); }
@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* philosophy / numbered rows */
.mq-philosophy, .mq-featured, .mq-issues, .mq-faq { padding: 112px 0; }
.mq-featured { background: var(--ink); color: var(--on-dark); }
.mq-featured .kicker { color: var(--mustard); }
.mq-philosophy-grid { display: grid; grid-template-columns: 200px 1fr; gap: 64px; align-items: flex-start; }
.mq-philosophy-number {
  font-family: var(--font-display); font-size: 140px; color: var(--red);
  line-height: .85; letter-spacing: -.02em;
}
.mq-num-cream { color: var(--mustard); }
.mq-philo-head { font-size: clamp(40px, 5vw, 64px); line-height: 1; margin: 16px 0 24px; color: var(--ink); letter-spacing: -.005em; }
.mq-featured .mq-philo-head, .mq-feat-title { color: var(--on-dark); }
.mq-philo-body { font-size: 20px; line-height: 1.55; color: var(--text-soft); max-width: 640px; margin: 0 0 28px; }
.mq-featured .mq-philo-body { color: var(--ink-lilac); }
.mq-philo-links { display: flex; gap: 24px; flex-wrap: wrap; }
.mq-philo-head em { font-style: italic; color: var(--red); }
.mq-philo-head u { text-decoration: underline; text-decoration-color: var(--mustard); text-decoration-thickness: 4px; text-underline-offset: 6px; }

/* featured */
.mq-feat-title { font-size: 80px; color: var(--on-dark); line-height: .95; margin: 8px 0 14px; }
.mq-feat-meta { font-size: 16px; color: var(--ink-lilac); margin-bottom: 32px; }
.mq-feat-meta em { color: #fff; font-style: italic; }
.mq-feat-quote {
  margin: 0 0 32px; padding: 24px 28px; border-left: 4px solid var(--red);
  background: rgba(245,244,230,.06);
  font-size: 22px; line-height: 1.55; color: var(--on-dark); font-style: italic;
}
.mq-feat-cta { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.btn-ghost-dark {
  display: inline-flex; gap: 10px; align-items: center; padding: 14px 22px;
  border: 2px solid var(--on-dark); color: var(--on-dark); border-radius: 999px;
  font-weight: 800; background: transparent;
}
.btn-ghost-dark:hover { background: var(--on-dark); color: var(--ink); text-decoration: none; }

/* issues list */
.mq-issues-list { border-top: 1.5px solid var(--ink); }
.mq-issue-row {
  display: grid; grid-template-columns: 40px 1fr auto 40px; gap: 24px;
  padding: 20px 0; border-bottom: 1.5px solid var(--rule); color: var(--ink);
  align-items: center; transition: padding .15s, background .15s;
}
.mq-issue-row:hover { padding-left: 20px; padding-right: 20px; background: var(--ink); color: var(--on-dark); text-decoration: none; }
.mq-issue-row:hover .mq-issue-num { color: var(--mustard); }
.mq-issue-row:hover .mq-issue-count { color: var(--ink-lilac); }
.mq-issue-num { font-family: var(--font-mono); font-size: 13px; color: var(--muted); letter-spacing: .05em; }
.mq-issue-label { font-family: var(--font-display); font-size: 28px; line-height: 1; }
.mq-issue-count { font-family: var(--font-body); font-weight: 800; font-size: 15px; color: var(--muted); }
.mq-issue-count span { font-weight: 400; letter-spacing: .06em; text-transform: uppercase; font-size: 11px; }

/* gaggle */
.mq-gaggle { background: var(--red); color: var(--on-dark); padding: 112px 0; overflow: hidden; }
.mq-gaggle-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 64px; align-items: center; }
.mq-gaggle-title { font-size: clamp(56px, 8vw, 96px); color: var(--on-dark); line-height: .95; margin-bottom: 20px; }
.mq-gaggle-title em { font-style: italic; color: var(--mustard); }
.mq-gaggle-sub { font-size: 20px; line-height: 1.5; color: rgba(255,255,255,.88); margin: 0 0 32px; max-width: 560px; }
.mq-gaggle-cta { display: flex; gap: 14px; flex-wrap: wrap; }
.mq-gaggle .btn-primary { background: var(--ink); }
.mq-gaggle .btn-primary:hover { background: #1b0f2e; }
.mq-gaggle-art { position: relative; display: flex; justify-content: center; }
.mq-gaggle-granny { width: 320px; filter: drop-shadow(0 12px 30px rgba(0,0,0,.25)); }
.mq-gaggle-count {
  position: absolute; bottom: 8%; left: 0; background: var(--ink); color: var(--on-dark);
  padding: 20px 28px; border-radius: 4px; transform: rotate(-3deg); box-shadow: 0 6px 20px rgba(0,0,0,.25);
}
.mq-gaggle-count b { font-family: var(--font-display); font-size: 56px; display: block; line-height: .9; }
.mq-gaggle-count span { font-size: 12px; font-weight: 800; letter-spacing: .15em; text-transform: uppercase; color: var(--mustard); }

/* faq */
.mq-faq { background: var(--paper); }

/* final */
.mq-final { padding: 120px 0; background: var(--ink); color: var(--on-dark); position: relative; overflow: hidden; }
.mq-final::before, .mq-final::after {
  content: ''; position: absolute; width: 160px; height: 160px;
  background: var(--red); border-radius: 50%; opacity: .3; filter: blur(60px);
}
.mq-final::before { top: -40px; left: 10%; }
.mq-final::after { bottom: -40px; right: 10%; background: var(--mustard); }
.mq-final-title { font-size: clamp(56px, 9vw, 120px); color: var(--on-dark); line-height: .95; margin: 16px 0 40px; position: relative; }
.mq-final-title em { font-style: italic; color: var(--mustard); }
.mq-final-form {
  display: flex; gap: 12px; max-width: 560px; margin: 0 auto; flex-wrap: wrap;
  justify-content: center; position: relative;
}
.mq-final-form input {
  flex: 1; min-width: 240px; padding: 18px 22px; font-size: 17px; font-family: var(--font-body);
  background: var(--on-dark); color: var(--ink); border: none; border-radius: 999px;
}
.mq-final-note { margin-top: 24px; font-size: 14px; color: var(--ink-lilac); position: relative; }

@media (max-width: 900px) {
  .mq-philosophy-grid, .mq-gaggle-grid, .mq-hero-bottom { grid-template-columns: 1fr; gap: 32px; }
  .mq-philosophy-number { font-size: 80px; }
  .mq-title { font-size: 64px; }
  .mq-feat-title { font-size: 48px; }
  .mq-issue-row { grid-template-columns: 30px 1fr auto; }
  .mq-issue-arrow { display: none; }
}
`;

window.HomepageMarquee = HomepageMarquee;
