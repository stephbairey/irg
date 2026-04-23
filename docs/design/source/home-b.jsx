/* global React, SiteHeader, SiteFooter, GrannyImg, ISSUES, SONGS, FEATURED_LYRIC, HERSTORY, FAQ_TEASER, IconArrow, IconMap, IconDown, IconShuffle, IconPlus */

/* ================================================================
   Homepage Variant B — "The Bulletin"
   Newsprint / broadside feel. A masthead-style hero with
   column-based layout, rules, and a dense front page that
   treats the site like an activist paper.
   ================================================================ */
function HomepageBulletin() {
  const featured = SONGS[3];
  const randomPick = SONGS[7];

  return (
    <div className="home-b">
      <SiteHeader active="home" />

      {/* ================= MASTHEAD ================= */}
      <section className="bul-masthead">
        <div className="container">
          <div className="bul-masthead-top">
            <span>Welcome, friend</span>
            <span>The International Disorganization</span>
            <span>Est. Victoria, BC · 1987</span>
          </div>
          <h1 className="bul-title">Raging Grannies</h1>
          <div className="bul-tagline">
            Using <em>creative and humorous</em> protests for political education.
          </div>
        </div>
      </section>

      {/* ================= FRONT PAGE ================= */}
      <section className="bul-frontpage">
        <div className="container">
          <div className="bul-frontpage-grid">

            {/* Lead story */}
            <article className="bul-lead">
              <div className="bul-deck">The Lead · From today’s songbook</div>
              <h2 className="bul-lead-title">{featured.title}</h2>
              <div className="bul-byline">
                By <strong>{featured.writer}</strong> &middot; {featured.gaggle} Gaggle &middot;
                to the tune of <em>{featured.tune}</em>
              </div>
              <div className="bul-lead-body bul-lead-lyrics">
                <div className="detail-lyrics-section-label">[Chorus]</div>
                <p>
                  And it’s go, team, go<br/>
                  They’ll <strong>time</strong> your <strong>every breath</strong><br/>
                  And everyday you’re in this <em>place</em><br/>
                  You’re two day nearer <strong>death</strong><br/>
                  But you go…
                </p>
                <div className="detail-lyrics-section-label">[Verse 1]</div>
                <p>
                  A working <em>hand</em> am I, and I’m tellin’ you no lie<br/>
                  I work and breathe among the fumes that <strong>foul up</strong> our sky<br/>
                  There’s loud noise all around me and there’s <strong>poison</strong> in the air<br/>
                  There’s a lousy smell that <strong>smacks of hell</strong> and dust all through my hair
                </p>
              </div>
              <a href="#" className="bul-lead-link">Open the full songsheet <IconArrow size={14} /></a>
            </article>

            {/* Sidebar - mission + stats */}
            <aside className="bul-side">
              <div className="bul-side-block bul-side-mission">
                <div className="bul-deck">The Mission</div>
                <p>
                  We use <strong>satirical song</strong>, <strong>flowered hats</strong>, and
                  the moral authority of advanced age to protest for peace,
                  civil rights, and a livable planet.
                </p>
                <a href="#" className="bul-inline-link">Our philosophy →</a>
              </div>

              <div className="bul-side-block bul-side-stats">
                <div className="bul-deck">By the numbers</div>
                <dl>
                  <div><dt>Gaggles</dt><dd>80+</dd></div>
                  <div><dt>Songs archived</dt><dd>1,493</dd></div>
                  <div><dt>Issues covered</dt><dd>17</dd></div>
                  <div><dt>Years going</dt><dd>39</dd></div>
                  <div><dt>Arrests (polite)</dt><dd>∞</dd></div>
                </dl>
              </div>
            </aside>

            {/* Actions column */}
            <section className="bul-col">
              <div className="bul-deck">On The Streets</div>
              <h3 className="bul-col-head">Recent actions from the field</h3>
              <ul className="bul-news">
                <li>
                  <b>Portland.</b> Sang outside the Rivian showroom for four hours
                  straight. The staff closed early, citing “scheduling.”
                  <span className="bul-news-meta">April 18 · 3 songs</span>
                </li>
                <li>
                  <b>Toronto.</b> ‘Drill, Baby, Chill’ premiered at the pipeline
                  hearing. The stenographer asked for the lyrics.
                  <span className="bul-news-meta">April 11 · 1 new song</span>
                </li>
                <li>
                  <b>Madrid.</b> Nuestras Abuelas Indignadas held their first
                  rehearsal. The neighbours brought snacks.
                  <span className="bul-news-meta">April 04 · founding</span>
                </li>
                <li>
                  <b>Brooklyn.</b> Housing march — three new parodies minted,
                  two arrests, one made the local evening news.
                  <span className="bul-news-meta">March 27 · 3 songs</span>
                </li>
              </ul>
              <a href="#" className="bul-inline-link">All dispatches →</a>
            </section>

            {/* Featured picks column */}
            <section className="bul-col">
              <div className="bul-deck">Also in the songbook</div>
              <h3 className="bul-col-head">A handful, at random</h3>
              <div className="bul-picks">
                {[SONGS[0], SONGS[6], SONGS[10], SONGS[5]].map(s => (
                  <a href="#" key={s.id} className="bul-pick">
                    <div className="bul-pick-title">{s.title}</div>
                    <div className="bul-pick-meta">
                      <em>{s.tune}</em><br/>
                      {s.gaggle} · {s.writer}
                    </div>
                  </a>
                ))}
              </div>
              <a href="#" className="btn btn-primary" style={{ width: '100%' }}>
                Browse all 1,493 songs <IconArrow size={14} />
              </a>
            </section>

            {/* Herstory column */}
            <section className="bul-col bul-col-herstory">
              <div className="bul-deck">Herstory</div>
              <h3 className="bul-col-head">How this got started.</h3>
              <div className="bul-herstory-photo">
                <img src="assets/granny-photo-1.jpg" alt="Raging Grannies gathered at a state capitol" />
                <div className="bul-herstory-caption">Madison gaggle on the Capitol steps · 2025</div>
              </div>
              <div className="bul-herstory-year">1987</div>
              <p className="bul-herstory-copy">
                A handful of women in Victoria, BC, got tired of being ignored
                at nuclear-submarine protests. They borrowed flowered hats,
                wrote a few satirical songs, and discovered that a chorus of
                grandmothers is surprisingly <em>hard to escort away</em>.
              </p>
              <a href="#" className="bul-inline-link">Read the herstory →</a>
            </section>

          </div>
        </div>
      </section>

      {/* ================= ISSUES STRIP ================= */}
      <section className="bul-issues">
        <div className="container">
          <div className="bul-section-head">
            <div className="bul-deck">The Beat</div>
            <h2>Browse by the outrage of your choice.</h2>
          </div>
          <div className="bul-issues-grid">
            {ISSUES.slice(0, 9).map(iss => (
              <a href="#" key={iss.slug} className="bul-issue">
                <span className="bul-issue-count">{iss.count}</span>
                <span className="bul-issue-label">{iss.label}</span>
              </a>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <a href="#" className="bul-inline-link">See all 17 categories →</a>
          </div>
        </div>
      </section>

      {/* ================= GAGGLE MAP + START ================= */}
      <section className="bul-gaggle">
        <div className="container">
          <div className="bul-gaggle-grid">
            <div>
              <div className="bul-deck">The Network</div>
              <h2 className="bul-gaggle-title">80+ gaggles on 4 continents.</h2>
              <p className="bul-gaggle-sub">
                From Victoria, BC to Sydney, Australia. Most groups meet weekly
                to rehearse, then march, sing, and occasionally get gently
                removed from lobbies.
              </p>
              <div className="bul-gaggle-cta">
                <a href="#" className="btn btn-ink"><IconMap size={16} /> Open the map</a>
                <a href="#" className="btn btn-ghost"><IconPlus size={16} /> Start a gaggle</a>
              </div>
            </div>
            <div className="bul-map">
              <div className="bul-map-placeholder">
                <span className="ph-dot" style={{ top: '28%', left: '18%' }} />
                <span className="ph-dot" style={{ top: '34%', left: '22%' }} />
                <span className="ph-dot" style={{ top: '30%', left: '26%' }} />
                <span className="ph-dot" style={{ top: '40%', left: '28%' }} />
                <span className="ph-dot" style={{ top: '42%', left: '34%' }} />
                <span className="ph-dot" style={{ top: '32%', left: '54%' }} />
                <span className="ph-dot" style={{ top: '36%', left: '56%' }} />
                <span className="ph-dot" style={{ top: '40%', left: '60%' }} />
                <span className="ph-dot" style={{ top: '72%', left: '76%' }} />
                <span className="bul-map-label">MAP · interactive gaggle directory</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ABOUT STRIP ================= */}
      <section className="bul-about">
        <div className="container">
          <div className="bul-about-grid">
            <figure className="bul-about-photo">
              <img src="assets/granny-photo-1.jpg" alt="A Raging Grannies gaggle assembled outside a state capitol" />
              <figcaption>A dozen-plus grannies, one lunchtime, one capitol building.</figcaption>
            </figure>
            <div className="bul-about-copy">
              <div className="bul-deck">About the Disorganization</div>
              <h2 className="bul-about-head">
                Older women, flowered hats,<br/>
                and a <em>deeply unserious</em> approach<br/>
                to serious trouble.
              </h2>
              <p>
                We’re a loose, continental network of roughly eighty gaggles —
                autonomous chapters of women over fifty who show up at protests,
                council hearings, and corporate lobbies to sing parody songs set
                to tunes everyone already knows. No dues. No head office. No
                permission slips.
              </p>
              <div className="bul-about-links">
                <a href="#" className="bul-inline-link">Read the full about →</a>
                <a href="#" className="bul-inline-link">Our philosophy →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="bul-faq">
        <div className="container">
          <div className="bul-faq-grid">
            <aside className="bul-faq-aside">
              <figure className="bul-faq-photo">
                <img src="assets/granny-photo-1.jpg" alt="" />
              </figure>
              <div className="bul-deck">Letters to the Editor</div>
              <h2 className="bul-faq-title">What people ask us.</h2>
              <p className="bul-faq-sub">
                The same questions come up at every action. Here are the answers
                we’ve settled on — for now.
              </p>
              <a href="#" className="underline-link">Full FAQ →</a>
            </aside>
            <div className="faq-list">
              {FAQ_TEASER.map((f, i) => (
                <details key={i} className="faq-item" open={i === 0}>
                  <summary>{f.q}<IconDown size={18} /></summary>
                  <div className="faq-answer">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      <style>{STYLES_B}</style>
    </div>
  );
}

const STYLES_B = `
.home-b { background: var(--paper); }

/* masthead */
.bul-masthead { padding: 48px 0 32px; border-bottom: 3px double var(--ink); }
.bul-masthead-top {
  display: flex; justify-content: space-between; font-family: var(--font-body);
  font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: var(--muted); border-bottom: 1px solid var(--rule); padding-bottom: 12px; margin-bottom: 20px;
}
.bul-title {
  font-size: clamp(72px, 11vw, 160px); line-height: .9; text-align: center;
  color: var(--ink); letter-spacing: -.01em;
}
.bul-tagline {
  text-align: center; font-size: 19px; color: var(--text-soft); margin-top: 24px;
  font-family: var(--font-body); font-style: italic;
}

/* front page grid */
.bul-frontpage { padding: 56px 0 80px; }
.bul-frontpage-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 0;
  border-top: 1px solid var(--rule);
  border-left: 1px solid var(--rule);
}
.bul-frontpage-grid > * {
  padding: 28px 28px 32px;
  border-right: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}
.bul-lead { grid-row: span 2; border-right: 2px solid var(--ink) !important; }
.bul-side { grid-row: span 2; background: var(--paper-2); }
.bul-side-block + .bul-side-block { margin-top: 28px; padding-top: 28px; border-top: 1px dashed var(--ink-lilac); }

.bul-deck {
  font-family: var(--font-body); font-size: 11px; font-weight: 800;
  letter-spacing: .16em; text-transform: uppercase; color: var(--red);
  margin-bottom: 14px;
}
.bul-lead-title { font-size: 56px; color: var(--ink); margin-bottom: 10px; line-height: .98; }
.bul-byline { font-size: 14px; color: var(--text-soft); padding-bottom: 18px; border-bottom: 1px solid var(--rule); margin-bottom: 20px; }
.bul-byline em { color: var(--ink-soft); font-style: italic; }
.bul-lead-body { font-size: 17px; line-height: 1.6; color: var(--text); column-count: 1; }
.bul-lead-body p { margin: 0 0 14px; }
.bul-lead-lyrics p { font-family: var(--font-body); line-height: 1.6; }
.bul-lead-lyrics strong { color: var(--ink); font-weight: 800; }
.bul-lead-lyrics em { color: var(--ink-soft); font-style: italic; }
.bul-dropcap {
  float: left; font-family: var(--font-display); font-size: 84px; line-height: .82;
  color: var(--red); padding: 6px 10px 0 0;
}
.bul-lead-body blockquote {
  margin: 18px 0 22px; padding: 16px 20px; border-left: 3px solid var(--red);
  font-family: var(--font-display); font-size: 22px; color: var(--ink); line-height: 1.25;
  background: rgba(226,42,44,.04);
}
.bul-lead-link { display: inline-flex; align-items: center; gap: 6px; font-weight: 800; color: var(--red); margin-top: 8px; }

.bul-side-mission p { font-size: 17px; line-height: 1.5; margin: 0 0 14px; }
.bul-side-mission strong { color: var(--ink); }
.bul-inline-link { font-weight: 800; color: var(--red); font-size: 14px; letter-spacing: .02em; }

.bul-side-stats dl { margin: 0; }
.bul-side-stats dl div {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 8px 0; border-bottom: 1px dotted var(--ink-lilac);
}
.bul-side-stats dt { font-size: 15px; color: var(--text-soft); }
.bul-side-stats dd { margin: 0; font-family: var(--font-display); font-size: 26px; color: var(--ink); line-height: 1; }

.bul-col-head { font-size: 28px; color: var(--ink); margin-bottom: 16px; line-height: 1.05; }
.bul-news { list-style: none; padding: 0; margin: 0 0 14px; font-size: 15px; line-height: 1.5; }
.bul-news li { padding: 12px 0; border-bottom: 1px dotted var(--rule); color: var(--text); }
.bul-news b { color: var(--ink); font-family: var(--font-display); font-weight: 400; font-size: 17px; display: inline; margin-right: 4px; }
.bul-news-meta { display: block; font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); margin-top: 6px; }

.bul-picks { display: grid; gap: 0; margin-bottom: 18px; }
.bul-pick { padding: 12px 0; border-bottom: 1px dotted var(--rule); color: var(--text); display: block; }
.bul-pick:first-child { border-top: 1px dotted var(--rule); }
.bul-pick:hover { background: rgba(226,42,44,.04); text-decoration: none; padding-left: 6px; }
.bul-pick-title { font-family: var(--font-display); font-size: 22px; color: var(--ink); line-height: 1; margin-bottom: 4px; }
.bul-pick-meta { font-size: 13px; color: var(--text-soft); line-height: 1.4; }
.bul-pick-meta em { color: var(--ink-soft); }

.bul-col-herstory { grid-column: span 2; background: var(--ink); color: var(--on-dark); }
.bul-col-herstory .bul-deck { color: var(--mustard); }
.bul-col-herstory .bul-col-head { color: var(--on-dark); }
.bul-herstory-photo {
  margin: 14px 0 8px; padding: 8px 8px 0;
  background: var(--on-dark);
  transform: rotate(-1.2deg);
  box-shadow: 0 8px 20px rgba(0,0,0,.25);
  max-width: 420px;
}
.bul-herstory-photo img {
  display: block; width: 100%; height: 180px; object-fit: cover;
  filter: saturate(.85) contrast(1.02);
}
.bul-herstory-caption {
  font-family: var(--font-body); font-size: 11px; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase; color: var(--ink);
  padding: 10px 4px 10px; text-align: center;
}
.bul-herstory-year { font-family: var(--font-display); font-size: 120px; color: var(--red); line-height: 1; margin: 10px 0; }
.bul-herstory-copy { font-size: 17px; line-height: 1.55; color: var(--on-dark); max-width: 540px; margin: 0 0 18px; }
.bul-herstory-copy em { color: var(--mustard); font-style: italic; }
.bul-col-herstory .bul-inline-link { color: var(--mustard); }

/* issues */
.bul-issues { padding: 80px 0; background: var(--paper-2); }
.bul-section-head { text-align: center; margin-bottom: 40px; }
.bul-section-head h2 { font-size: 44px; color: var(--ink); line-height: 1; }
.bul-issues-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 1px solid var(--ink); border-left: 1px solid var(--ink); }
.bul-issue {
  padding: 22px 24px; border-right: 1px solid var(--ink); border-bottom: 1px solid var(--ink);
  display: flex; align-items: baseline; justify-content: space-between; gap: 16px; color: var(--ink);
  background: var(--paper);
}
.bul-issue:hover { background: var(--red); color: var(--on-dark); text-decoration: none; }
.bul-issue:hover .bul-issue-count { color: var(--on-dark); }
.bul-issue-count { font-family: var(--font-display); font-size: 40px; color: var(--red); line-height: 1; }
.bul-issue-label { font-weight: 700; font-size: 16px; text-align: right; }

/* gaggle map */
.bul-gaggle { padding: 96px 0; }
.bul-gaggle-grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 64px; align-items: center; }
.bul-gaggle-title { font-size: 56px; color: var(--ink); line-height: .98; margin-bottom: 20px; }
.bul-gaggle-sub { font-size: 19px; color: var(--text-soft); margin: 0 0 32px; line-height: 1.5; }
.bul-gaggle-cta { display: flex; gap: 12px; flex-wrap: wrap; }
.bul-map-placeholder {
  aspect-ratio: 16/10; position: relative;
  background: var(--paper-2);
  background-image:
    repeating-linear-gradient(0deg, rgba(42,24,71,.05) 0 1px, transparent 1px 48px),
    repeating-linear-gradient(90deg, rgba(42,24,71,.05) 0 1px, transparent 1px 48px),
    radial-gradient(circle at 30% 40%, rgba(87,34,140,.14), transparent 45%),
    radial-gradient(circle at 58% 38%, rgba(87,34,140,.1), transparent 45%),
    radial-gradient(circle at 78% 68%, rgba(87,34,140,.12), transparent 45%);
  border: 1.5px solid var(--ink-lilac); border-radius: 12px;
  overflow: hidden;
}
.ph-dot {
  position: absolute; width: 12px; height: 12px; background: var(--red); border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(226,42,44,.18);
}
.bul-map-label {
  position: absolute; bottom: 16px; right: 18px; font-family: var(--font-mono);
  font-size: 11px; color: var(--muted); letter-spacing: .1em;
}

/* FAQ */
.bul-faq { padding: 96px 0; }
.bul-faq-grid {
  display: grid; grid-template-columns: 340px 1fr; gap: 64px; align-items: start;
}
.bul-faq-aside { position: sticky; top: 24px; }
.bul-faq-photo {
  margin: 0 0 24px; padding: 10px 10px 0; background: var(--on-dark);
  transform: rotate(1.5deg); box-shadow: 0 10px 28px rgba(0,0,0,.18);
  max-width: 300px;
}
.bul-faq-photo img { display: block; width: 100%; height: 220px; object-fit: cover; filter: saturate(.9); }
.bul-faq-title { font-size: 52px; margin: 10px 0 14px; color: var(--ink); line-height: .95; }
.bul-faq-sub { font-size: 16px; color: var(--text-soft); margin: 0 0 18px; line-height: 1.55; max-width: 32ch; }

/* About strip */
.bul-about { padding: 72px 0; background: var(--paper-2); border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); }
.bul-about-grid {
  display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 56px; align-items: center;
}
.bul-about-photo {
  margin: 0; padding: 14px 14px 0; background: var(--on-dark);
  transform: rotate(-1.5deg);
  box-shadow: 0 14px 36px rgba(0,0,0,.18);
  border: 1px solid rgba(0,0,0,.04);
}
.bul-about-photo img {
  display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover;
  filter: saturate(.9) contrast(1.02);
}
.bul-about-photo figcaption {
  font-family: var(--font-body); font-size: 12px; font-weight: 700;
  letter-spacing: .04em; color: var(--ink); padding: 14px 6px 14px;
  text-align: center; font-style: italic;
}
.bul-about-head {
  font-family: var(--font-display); font-weight: 400; font-size: 56px;
  line-height: 1.05; color: var(--ink); margin: 12px 0 20px; letter-spacing: -.01em;
}
.bul-about-head em { color: var(--red); font-style: italic; }
.bul-about-copy p { font-size: 18px; line-height: 1.55; color: var(--text); max-width: 52ch; margin: 0 0 20px; }
.bul-about-links { display: flex; gap: 24px; flex-wrap: wrap; }

@media (max-width: 1000px) {
  .bul-frontpage-grid { grid-template-columns: 1fr 1fr; }
  .bul-lead, .bul-side, .bul-col-herstory { grid-row: auto; grid-column: span 2; }
  .bul-gaggle-grid { grid-template-columns: 1fr; }
  .bul-issues-grid { grid-template-columns: repeat(2, 1fr); }
  .bul-title { font-size: 64px; }
}
`;

window.HomepageBulletin = HomepageBulletin;
