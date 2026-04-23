/* global React, SiteHeader, SiteFooter, IconArrow, IconSearch, IconDown */

/* ================================================================
   PRESS PAGE
   Auto-populated from Google Alerts. Newsprint "clippings desk"
   treatment, consistent with the Bulletin homepage.
   ================================================================ */

const PRESS_ITEMS = [
  {
    title: 'Protesters Accuse UCP Of "Gaslighting" Immigrants Before Referendum',
    source: 'Bridge City News',
    date: '2026-04-17',
    region: 'Alberta',
    gaggle: 'Lethbridge',
    blurb:
      'An advocacy group known as the Raging Grannies were in north Lethbridge on Friday to let their voices be heard in opposition to the provincial referendum questions.',
    url: '#',
  },
  {
    title: 'Raging Grannies Street Rally Protests Immigration Referendum Questions',
    source: 'Lethbridge News Now',
    date: '2026-04-17',
    region: 'Alberta',
    gaggle: 'Lethbridge',
    blurb:
      'The Lethbridge Raging Grannies are back at it on April 17, with a street rally to protest several questions included on the upcoming provincial ballot.',
    url: '#',
  },
  {
    title: 'Singing Seniors Stage Climate Sit-In Outside State Capitol',
    source: 'Madison Cap Times',
    date: '2026-04-11',
    region: 'Wisconsin',
    gaggle: 'Madison',
    blurb:
      'Armed with guitars, tambourines, and a songbook three decades deep, the Madison Raging Grannies held a four-hour vigil on the Capitol steps demanding action on the state energy bill.',
    url: '#',
  },
  {
    title: '"We Sing Because We Refuse To Shut Up": Raging Grannies Mark 39 Years',
    source: 'Times Colonist',
    date: '2026-04-04',
    region: 'British Columbia',
    gaggle: 'Victoria',
    blurb:
      'The original Victoria gaggle gathered at Centennial Square to celebrate nearly four decades of satirical protest song, joined by members as young as 58 and as old as 94.',
    url: '#',
  },
  {
    title: 'Local Grannies Take Housing Fight To City Hall, With Harmonies',
    source: 'The Tyee',
    date: '2026-03-28',
    region: 'British Columbia',
    gaggle: 'Vancouver',
    blurb:
      'A dozen flowered-hat activists interrupted Tuesday\'s zoning hearing with a three-part rewrite of a beloved folk tune, arguing for tenant protections in the Downtown Eastside.',
    url: '#',
  },
  {
    title: 'Grannies, Guitars And Grievances: Inside A Satirical Protest Movement',
    source: 'CBC Radio · The Current',
    date: '2026-03-22',
    region: 'National',
    gaggle: 'Multiple',
    blurb:
      'A half-hour radio feature visiting three gaggles across the country, tracing the origins of the movement from a 1987 anti-nuclear protest in Victoria to today\'s climate marches.',
    url: '#',
  },
  {
    title: 'Seattle Raging Grannies Rewrite "My Blockade" For Port Protest',
    source: 'KUOW',
    date: '2026-03-14',
    region: 'Washington',
    gaggle: 'Seattle',
    blurb:
      'Songwriter Jo-Hanna Reed debuted the new lyrics at Saturday\'s dockside demonstration, drawing on the Dixie Cups melody her gaggle has been adapting for five years.',
    url: '#',
  },
  {
    title: 'A Chorus Of Nanas: Portland Gaggle Joins Pipeline Blockade',
    source: 'Willamette Week',
    date: '2026-03-05',
    region: 'Oregon',
    gaggle: 'Portland',
    blurb:
      'Twelve members of the Portland Raging Grannies linked arms across the access road before dawn, singing until the police finally asked, politely, for permission to arrest them.',
    url: '#',
  },
  {
    title: 'Green Bay Grannies Honor Labor Day With 1,500-Strong Sing-Along',
    source: 'Green Bay Press-Gazette',
    date: '2026-02-14',
    region: 'Wisconsin',
    gaggle: 'Green Bay',
    blurb:
      'Organizer Susan Dutton led the crowd through three original labor songs written by her gaggle, including "The Modern Workers Song," a reimagining of a 1964 protest classic.',
    url: '#',
  },
  {
    title: 'Opinion: The Raging Grannies Have Always Understood Assignment',
    source: 'The Walrus',
    date: '2026-01-30',
    region: 'National',
    gaggle: null,
    blurb:
      'A culture essay arguing that satirical protest song, dismissed for decades as quaint, has turned out to be one of the most durable forms of civic engagement in North America.',
    url: '#',
  },
  {
    title: 'Raging Grannies Arrested At Nuclear Weapons Lab Gate',
    source: 'East Bay Express',
    date: '2026-01-18',
    region: 'California',
    gaggle: 'East Bay',
    blurb:
      'Seven women in flowered hats and sensible shoes were cited and released after a two-hour sit-in at the Livermore Lab gate, marking the 40th anniversary of the Nevada Test Site protests.',
    url: '#',
  },
  {
    title: 'Calgary Grannies Launch Anti-Coal Songbook With Live Performance',
    source: 'CBC Calgary',
    date: '2026-01-09',
    region: 'Alberta',
    gaggle: 'Calgary',
    blurb:
      'The new 22-song collection, released free online, reworks Alberta folk standards with lyrics targeting the province\'s recently revived coal mining policy.',
    url: '#',
  },
];

const TOPICS = [
  ['All', PRESS_ITEMS.length],
  ['Climate', PRESS_ITEMS.filter(i => i.topic === 'Climate').length],
  ['Immigration', PRESS_ITEMS.filter(i => i.topic === 'Immigration').length],
  ['War & Peace', PRESS_ITEMS.filter(i => i.topic === 'War & Peace').length],
  ['Labor', PRESS_ITEMS.filter(i => i.topic === 'Labor').length],
  ['Housing', PRESS_ITEMS.filter(i => i.topic === 'Housing').length],
  ['Herstory', PRESS_ITEMS.filter(i => i.topic === 'Herstory').length],
  ['Feature', PRESS_ITEMS.filter(i => i.topic === 'Feature').length],
  ['Opinion', PRESS_ITEMS.filter(i => i.topic === 'Opinion').length],
];

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function monthKey(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function PressPage() {
  const [activeTopic, setActiveTopic] = React.useState('All');
  const [query, setQuery] = React.useState('');

  const filtered = PRESS_ITEMS
    .filter(i => activeTopic === 'All' || i.topic === activeTopic)
    .filter(i =>
      !query
      || i.title.toLowerCase().includes(query.toLowerCase())
      || i.source.toLowerCase().includes(query.toLowerCase())
      || (i.gaggle || '').toLowerCase().includes(query.toLowerCase())
    );

  // group by month
  const groups = [];
  let current = null;
  filtered.forEach(item => {
    const k = monthKey(item.date);
    if (!current || current.key !== k) {
      current = { key: k, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  });

  const latest = PRESS_ITEMS[0];
  const daysSince = Math.floor((new Date() - new Date(latest.date + 'T00:00:00')) / 86400000);

  return (
    <div className="press-page">
      <SiteHeader active="press" />

      {/* ================= HERO / DESK ================= */}
      <section className="press-hero">
        <div className="container">
          <div className="press-hero-top">
            <span>The Clippings Desk</span>
            <span>Auto-updated via Google Alerts</span>
            <span>{PRESS_ITEMS.length} stories on file</span>
          </div>

          <div className="press-hero-grid">
            <div className="press-hero-left">
              <div className="press-kicker">Press &amp; Coverage</div>
              <h1 className="press-title">In the News</h1>
              <p className="press-dek">
                Every mention of <em>Raging Grannies</em> across the North American
                press — auto-clipped and sorted newest first. If something's missing,
                the alert bot probably missed it;{' '}
                <a href="#" className="press-inline-link">send it our way</a>.
              </p>

              <div className="press-live">
                <span className="press-live-dot" aria-hidden />
                <span>
                  <b>Live feed.</b> Latest clipping added {daysSince === 0 ? 'today' : `${daysSince} day${daysSince === 1 ? '' : 's'} ago`} —
                  <em> {latest.source}</em>.
                </span>
              </div>
            </div>

            <aside className="press-hero-right">
              <figure className="press-hero-photo">
                <img src="assets/granny-photo-1.jpg" alt="A Raging Grannies gaggle posed in front of a state capitol" />
                <figcaption>The Madison gaggle, post-rally · 2025</figcaption>
              </figure>
              <div className="press-kit-card">
                <div className="press-kit-kicker">For Journalists</div>
                <div className="press-kit-title">Press Kit</div>
                <ul className="press-kit-list">
                  <li><a href="#">Logos &amp; wordmarks <IconArrow size={12} /></a></li>
                  <li><a href="#">Photography (CC-BY) <IconArrow size={12} /></a></li>
                  <li><a href="#">Fact sheet &amp; timeline <IconArrow size={12} /></a></li>
                  <li><a href="#">Spokesperson directory <IconArrow size={12} /></a></li>
                </ul>
                <div className="press-kit-contact">
                  <div className="press-kit-contact-label">Media inquiries</div>
                  <a href="mailto:press@raginggrannies.org">press@raginggrannies.org</a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ================= CONTROLS ================= */}
      <section className="press-controls">
        <div className="container">
          <div className="press-controls-bar">
            <div className="press-search">
              <IconSearch size={16} />
              <input
                type="text"
                placeholder="Search by title, outlet, or gaggle…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <div className="press-sort">
              <span className="press-sort-label">Sort</span>
              <select>
                <option>Newest first</option>
                <option>Oldest first</option>
                <option>By outlet (A–Z)</option>
              </select>
              <IconDown size={14} />
            </div>
          </div>

          <div className="press-topics" role="tablist">
            {TOPICS.map(([name, count]) => (
              <button
                key={name}
                role="tab"
                aria-selected={activeTopic === name}
                className={'press-topic ' + (activeTopic === name ? 'is-active' : '')}
                onClick={() => setActiveTopic(name)}
              >
                {name} <span>{count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CLIPPINGS LIST ================= */}
      <section className="press-list-section">
        <div className="container">
          <div className="press-list-meta">
            <span>{filtered.length} clipping{filtered.length === 1 ? '' : 's'}</span>
            <span>{activeTopic === 'All' ? 'All topics' : activeTopic}</span>
          </div>

          {groups.length === 0 && (
            <div className="press-empty">
              <b>No clippings yet.</b>
              <span>Nothing matches that filter. Try a different topic or search term.</span>
            </div>
          )}

          {groups.map(group => (
            <div key={group.key} className="press-group">
              <div className="press-group-head">
                <h3 className="press-group-title">{group.key}</h3>
                <span className="press-group-count">{group.items.length} stor{group.items.length === 1 ? 'y' : 'ies'}</span>
              </div>
              <ol className="press-list">
                {group.items.map((item, i) => (
                  <li key={i} className="press-item">
                    <a href={item.url} className="press-item-link">
                      <div className="press-item-meta">
                        <span className="press-source">{item.source}</span>
                        <span className="press-dot-sep" aria-hidden>·</span>
                        <time>{fmtDate(item.date)}</time>
                        {item.gaggle && (
                          <>
                            <span className="press-dot-sep" aria-hidden>·</span>
                            <span className="press-gaggle">{item.gaggle} gaggle</span>
                          </>
                        )}
                      </div>
                      <h4 className="press-item-title">{item.title}</h4>
                      <p className="press-item-blurb">{item.blurb}</p>
                      <div className="press-item-foot">
                        <span className="press-topic-tag">{item.topic}</span>
                        <span className="press-read">Read at {item.source} <IconArrow size={12} /></span>
                      </div>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          ))}

          <div className="press-foot-note">
            <div>
              <b>How this page works.</b> A Google Alert for
              {' '}<em>"Raging Grannies"</em> pipes new coverage into the site a few
              times a day. We review it — filtering out coincidences and reruns — and
              the rest lands here automatically, oldest at the bottom. No editors,
              no curated narrative. Just what the press is saying.
            </div>
            <a href="#" className="press-foot-rss">
              Subscribe to the feed <IconArrow size={13} />
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />

      <style>{STYLES_PRESS}</style>
    </div>
  );
}

const STYLES_PRESS = `
.press-page { background: var(--paper); color: var(--text); }
.press-page .container { max-width: 1240px; margin: 0 auto; padding: 0 40px; }

/* --- HERO / DESK --- */
.press-hero {
  padding: 56px 0 48px;
  border-bottom: 3px double var(--ink);
  background: var(--paper);
}
.press-hero-top {
  display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap;
  font-family: var(--font-body); font-size: 12px; font-weight: 700;
  letter-spacing: .12em; text-transform: uppercase; color: var(--muted);
  border-bottom: 1px solid var(--rule); padding-bottom: 14px; margin-bottom: 36px;
}
.press-hero-grid {
  display: grid; grid-template-columns: 1.8fr 1fr; gap: 56px; align-items: start;
}
.press-kicker {
  font-family: var(--font-body); font-size: 12px; font-weight: 800;
  letter-spacing: .16em; text-transform: uppercase; color: var(--red);
  margin-bottom: 16px;
}
.press-title {
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(64px, 9vw, 128px); line-height: .92;
  color: var(--ink); letter-spacing: -.01em; margin: 0;
}
.press-dek {
  margin: 20px 0 0; font-size: 20px; line-height: 1.5; color: var(--text);
  max-width: 56ch;
}
.press-dek em { font-style: italic; color: var(--ink); }
.press-inline-link {
  color: var(--red); border-bottom: 1.5px solid var(--red); text-decoration: none;
  font-weight: 700;
}
.press-inline-link:hover { background: var(--red); color: var(--on-dark); }

.press-live {
  display: inline-flex; align-items: center; gap: 12px; margin-top: 28px;
  padding: 10px 16px 10px 14px; border: 1px solid var(--rule); border-radius: 999px;
  background: var(--paper-2); font-size: 14px; color: var(--text);
}
.press-live b { font-weight: 800; color: var(--ink); }
.press-live em { font-style: italic; color: var(--purple); font-weight: 600; }
.press-live-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--red);
  box-shadow: 0 0 0 0 rgba(226,42,44,.6);
  animation: press-pulse 2s ease-out infinite;
}
@keyframes press-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(226,42,44,.6); }
  70%  { box-shadow: 0 0 0 10px rgba(226,42,44,0); }
  100% { box-shadow: 0 0 0 0 rgba(226,42,44,0); }
}

/* press kit card */
.press-hero-photo {
  margin: 0 0 20px; padding: 10px 10px 0; background: var(--on-dark);
  transform: rotate(1.4deg);
  box-shadow: 0 14px 32px rgba(0,0,0,.18);
}
.press-hero-photo img {
  display: block; width: 100%; height: 220px; object-fit: cover;
  filter: saturate(.9) contrast(1.02);
}
.press-hero-photo figcaption {
  font-family: var(--font-body); font-size: 11px; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase; color: var(--ink);
  text-align: center; padding: 12px 4px;
}
.press-kit-card {
  background: var(--ink); color: var(--on-dark); padding: 28px 28px 24px;
  border-radius: var(--radius);
}
.press-kit-kicker {
  font-family: var(--font-body); font-size: 11px; font-weight: 800;
  letter-spacing: .16em; text-transform: uppercase; color: var(--mustard, #E6B94A);
  margin-bottom: 8px;
}
.press-kit-title {
  font-family: var(--font-display); font-size: 40px; line-height: 1;
  color: var(--on-dark); margin-bottom: 20px;
}
.press-kit-list { list-style: none; padding: 0; margin: 0 0 20px; display: grid; gap: 2px; }
.press-kit-list a {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; color: var(--on-dark); text-decoration: none;
  border-bottom: 1px solid rgba(255,255,255,.14);
  font-size: 15px; font-weight: 600;
}
.press-kit-list li:last-child a { border-bottom: none; }
.press-kit-list a:hover { color: var(--mustard, #E6B94A); padding-left: 4px; }
.press-kit-contact {
  padding-top: 18px; border-top: 1px solid rgba(255,255,255,.18);
}
.press-kit-contact-label {
  font-size: 11px; font-weight: 800; letter-spacing: .14em;
  text-transform: uppercase; color: var(--ink-lilac); margin-bottom: 6px;
}
.press-kit-contact a {
  color: var(--on-dark); font-size: 18px; font-weight: 700; text-decoration: none;
  border-bottom: 1.5px solid rgba(255,255,255,.3);
}
.press-kit-contact a:hover { border-bottom-color: var(--mustard, #E6B94A); color: var(--mustard, #E6B94A); }

/* --- CONTROLS --- */
.press-controls {
  padding: 28px 0 20px;
  background: var(--paper);
  border-bottom: 1px solid var(--rule);
  position: sticky; top: 0; z-index: 5;
}
.press-controls-bar {
  display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-bottom: 20px;
}
.press-search {
  flex: 1; min-width: 280px;
  display: flex; align-items: center; gap: 10px;
  padding: 0 16px; height: 48px;
  background: var(--card); border: 1px solid var(--rule); border-radius: 10px;
  color: var(--muted);
}
.press-search input {
  flex: 1; border: none; outline: none; background: transparent;
  font: 500 16px/1 var(--font-body); color: var(--text);
}
.press-search input::placeholder { color: var(--muted); }
.press-sort {
  display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 14px 0 16px;
  background: var(--card); border: 1px solid var(--rule); border-radius: 10px;
  color: var(--text);
}
.press-sort-label {
  font-family: var(--font-body); font-size: 11px; font-weight: 800;
  letter-spacing: .14em; text-transform: uppercase; color: var(--muted);
}
.press-sort select {
  border: none; outline: none; background: transparent; appearance: none;
  font: 600 14px/1 var(--font-body); color: var(--text); cursor: pointer;
  padding-right: 4px;
}

.press-topics {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.press-topic {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-radius: 999px;
  background: var(--card); border: 1px solid var(--rule);
  font: 700 13px/1 var(--font-body); color: var(--text);
  cursor: pointer; transition: all .15s ease;
}
.press-topic span {
  font-size: 11px; font-weight: 700; color: var(--muted);
  padding: 2px 7px; border-radius: 999px; background: var(--paper-2);
}
.press-topic:hover { border-color: var(--ink-lilac); color: var(--ink); }
.press-topic.is-active {
  background: var(--ink); color: var(--on-dark); border-color: var(--ink);
}
.press-topic.is-active span { background: rgba(255,255,255,.14); color: var(--on-dark); }

/* --- LIST --- */
.press-list-section { padding: 40px 0 80px; }
.press-list-meta {
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: var(--font-body); font-size: 12px; font-weight: 800;
  letter-spacing: .12em; text-transform: uppercase; color: var(--muted);
  margin-bottom: 24px;
}
.press-group + .press-group { margin-top: 48px; }
.press-group-head {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-bottom: 14px; margin-bottom: 4px;
  border-bottom: 2px solid var(--ink);
}
.press-group-title {
  font-family: var(--font-display); font-size: 34px; font-weight: 400;
  color: var(--ink); margin: 0; letter-spacing: -.005em;
}
.press-group-count {
  font-family: var(--font-body); font-size: 12px; font-weight: 800;
  letter-spacing: .12em; text-transform: uppercase; color: var(--muted);
}
.press-list { list-style: none; padding: 0; margin: 0; }
.press-item {
  border-bottom: 1px solid var(--rule);
  counter-increment: clip;
}
.press-item-link {
  display: block; padding: 24px 0 28px; text-decoration: none; color: inherit;
  position: relative; transition: padding .15s ease;
}
.press-item-link:hover { padding-left: 14px; }
.press-item-link:hover .press-item-title { color: var(--red); }
.press-item-link:hover .press-read { color: var(--red); }
.press-item-link:focus-visible { outline: 2px solid var(--red); outline-offset: 4px; }

.press-item-meta {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  font-family: var(--font-body); font-size: 13px; font-weight: 700;
  letter-spacing: .02em; color: var(--muted); margin-bottom: 10px;
}
.press-source { color: var(--purple); text-transform: uppercase; letter-spacing: .1em; font-size: 12px; }
.press-dot-sep { color: var(--rule); }
.press-gaggle { color: var(--text-soft); font-style: italic; font-weight: 500; }
.press-item-title {
  font-family: var(--font-display); font-weight: 400;
  font-size: 34px; line-height: 1.1; color: var(--ink);
  margin: 0 0 12px; letter-spacing: -.005em;
  transition: color .15s ease;
  max-width: 32ch;
}
.press-item-blurb {
  margin: 0; font-size: 17px; line-height: 1.55; color: var(--text);
  max-width: 72ch;
}
.press-item-foot {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 16px; gap: 16px;
}
.press-topic-tag {
  display: inline-block; padding: 5px 12px; border-radius: 999px;
  background: var(--paper-2); border: 1px solid var(--rule);
  font: 700 11px/1 var(--font-body); letter-spacing: .08em;
  text-transform: uppercase; color: var(--ink);
}
.press-read {
  font: 700 13px/1 var(--font-body); color: var(--text-soft);
  display: inline-flex; align-items: center; gap: 6px;
  transition: color .15s ease;
}

.press-empty {
  padding: 60px 40px; text-align: center;
  background: var(--paper-2); border: 1px dashed var(--rule); border-radius: var(--radius);
  display: grid; gap: 8px;
}
.press-empty b { font-family: var(--font-display); font-size: 28px; color: var(--ink); font-weight: 400; }
.press-empty span { font-size: 15px; color: var(--text-soft); }

.press-foot-note {
  display: grid; grid-template-columns: 1fr auto; gap: 32px; align-items: center;
  margin-top: 56px; padding: 28px 32px;
  background: var(--paper-2); border-left: 3px solid var(--purple);
  border-radius: 0 var(--radius) var(--radius) 0;
  font-size: 14px; line-height: 1.55; color: var(--text-soft);
}
.press-foot-note b { color: var(--ink); font-weight: 800; }
.press-foot-note em { font-style: italic; color: var(--ink); }
.press-foot-rss {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 18px; border-radius: 999px;
  background: var(--ink); color: var(--on-dark);
  font: 700 13px/1 var(--font-body);
  text-decoration: none; white-space: nowrap;
}
.press-foot-rss:hover { background: var(--red); }
`;

Object.assign(window, { PressPage });
