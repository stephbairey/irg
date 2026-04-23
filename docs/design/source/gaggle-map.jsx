/* global React, SiteHeader, SiteFooter, IconSearch, IconArrow, IconMap, IconPlus, IconClose */

/* ================================================================
   Gaggle Map — US + Canada, pin-per-gaggle, click-through to subsite.
   Uses a simplified SVG outline of US + Canada (no real lat/long data,
   placeholder positions). Claude Code will wire real coords later.
   ================================================================ */

const GAGGLES = [
  // [id, name, country (us/ca), lat-ish %x, long-ish %y, city/region]
  { id: 'victoria', name: 'Victoria', country: 'ca', x: 8,  y: 28, city: 'Victoria, BC',          est: 1987, note: 'The original gaggle.' },
  { id: 'vancouver', name: 'Vancouver', country: 'ca', x: 11, y: 27, city: 'Vancouver, BC',      est: 1989 },
  { id: 'edmonton', name: 'Edmonton', country: 'ca', x: 17, y: 22, city: 'Edmonton, AB',         est: 2005 },
  { id: 'calgary', name: 'Calgary', country: 'ca', x: 17, y: 26, city: 'Calgary, AB',            est: 2001 },
  { id: 'saskatoon', name: 'Saskatoon', country: 'ca', x: 23, y: 24, city: 'Saskatoon, SK',      est: 2008 },
  { id: 'winnipeg', name: 'Winnipeg', country: 'ca', x: 29, y: 28, city: 'Winnipeg, MB',         est: 1992 },
  { id: 'toronto', name: 'Toronto', country: 'ca', x: 54, y: 32, city: 'Toronto, ON',            est: 1991 },
  { id: 'ottawa',  name: 'Ottawa',  country: 'ca', x: 59, y: 30, city: 'Ottawa, ON',             est: 1993 },
  { id: 'montreal', name: 'Montréal', country: 'ca', x: 62, y: 29, city: 'Montréal, QC',         est: 1990 },
  { id: 'halifax', name: 'Halifax', country: 'ca', x: 73, y: 30, city: 'Halifax, NS',            est: 2003 },
  { id: 'seattle', name: 'Seattle', country: 'us', x: 10, y: 38, city: 'Seattle, WA',            est: 1988 },
  { id: 'portland', name: 'Portland', country: 'us', x: 10, y: 44, city: 'Portland, OR',         est: 1991 },
  { id: 'sfbay',   name: 'SF Bay',    country: 'us', x: 7,  y: 52, city: 'San Francisco, CA',    est: 1989 },
  { id: 'la',      name: 'Los Angeles', country: 'us', x: 11, y: 60, city: 'Los Angeles, CA',    est: 1995 },
  { id: 'sd',      name: 'San Diego', country: 'us', x: 13, y: 64, city: 'San Diego, CA',        est: 2002 },
  { id: 'tuolumne', name: 'Tuolumne & Calaveras', country: 'us', x: 9, y: 54, city: 'Sonora, CA',  est: 2010 },
  { id: 'phx',     name: 'Phoenix',   country: 'us', x: 20, y: 60, city: 'Phoenix, AZ',          est: 2007 },
  { id: 'slc',     name: 'Salt Lake', country: 'us', x: 22, y: 48, city: 'Salt Lake City, UT',   est: 2004 },
  { id: 'denver',  name: 'Denver',    country: 'us', x: 28, y: 52, city: 'Denver, CO',           est: 1996 },
  { id: 'abq',     name: 'Albuquerque', country: 'us', x: 27, y: 59, city: 'Albuquerque, NM',    est: 2009 },
  { id: 'austin',  name: 'Austin',    country: 'us', x: 38, y: 67, city: 'Austin, TX',           est: 1999 },
  { id: 'houston', name: 'Houston',   country: 'us', x: 42, y: 70, city: 'Houston, TX',          est: 2011 },
  { id: 'twincities', name: 'Twin Cities', country: 'us', x: 40, y: 43, city: 'Minneapolis, MN', est: 1993 },
  { id: 'madison', name: 'Madison',   country: 'us', x: 44, y: 45, city: 'Madison, WI',          est: 1995 },
  { id: 'milwaukee', name: 'Milwaukee', country: 'us', x: 46, y: 46, city: 'Milwaukee, WI',      est: 2001 },
  { id: 'greenbay', name: 'Green Bay', country: 'us', x: 46, y: 42, city: 'Green Bay, WI',       est: 2004 },
  { id: 'chicago', name: 'Chicago',   country: 'us', x: 47, y: 48, city: 'Chicago, IL',          est: 1992 },
  { id: 'stl',     name: 'St. Louis', country: 'us', x: 46, y: 55, city: 'St. Louis, MO',        est: 2006 },
  { id: 'kc',      name: 'Kansas City', country: 'us', x: 40, y: 53, city: 'Kansas City, MO',    est: 2008 },
  { id: 'detroit', name: 'Detroit',   country: 'us', x: 53, y: 44, city: 'Detroit, MI',          est: 1998 },
  { id: 'cleveland', name: 'Cleveland', country: 'us', x: 55, y: 46, city: 'Cleveland, OH',      est: 2002 },
  { id: 'columbus', name: 'Columbus', country: 'us', x: 55, y: 49, city: 'Columbus, OH',         est: 2014 },
  { id: 'cincy',   name: 'Cincinnati', country: 'us', x: 53, y: 51, city: 'Cincinnati, OH',      est: 2007 },
  { id: 'pittsburgh', name: 'Pittsburgh', country: 'us', x: 58, y: 47, city: 'Pittsburgh, PA',   est: 2000 },
  { id: 'buffalo', name: 'Buffalo',   country: 'us', x: 59, y: 42, city: 'Buffalo, NY',          est: 2005 },
  { id: 'nyc',     name: 'New York',  country: 'us', x: 63, y: 46, city: 'New York, NY',         est: 1991 },
  { id: 'brooklyn', name: 'Brooklyn', country: 'us', x: 64, y: 47, city: 'Brooklyn, NY',         est: 2012 },
  { id: 'boston',  name: 'Boston',    country: 'us', x: 66, y: 42, city: 'Boston, MA',           est: 1992 },
  { id: 'burlington', name: 'Burlington', country: 'us', x: 63, y: 38, city: 'Burlington, VT',   est: 2009 },
  { id: 'portlandme', name: 'Portland (ME)', country: 'us', x: 68, y: 40, city: 'Portland, ME',  est: 2011 },
  { id: 'philly',  name: 'Philadelphia', country: 'us', x: 62, y: 49, city: 'Philadelphia, PA',  est: 1997 },
  { id: 'dc',      name: 'DC',         country: 'us', x: 60, y: 51, city: 'Washington, DC',      est: 1993 },
  { id: 'baltimore', name: 'Baltimore', country: 'us', x: 61, y: 50, city: 'Baltimore, MD',      est: 2003 },
  { id: 'richmond', name: 'Richmond',  country: 'us', x: 59, y: 54, city: 'Richmond, VA',        est: 2010 },
  { id: 'asheville', name: 'Asheville', country: 'us', x: 54, y: 58, city: 'Asheville, NC',      est: 2013 },
  { id: 'raleigh', name: 'Raleigh',    country: 'us', x: 58, y: 57, city: 'Raleigh, NC',         est: 2008 },
  { id: 'atlanta', name: 'Atlanta',    country: 'us', x: 52, y: 62, city: 'Atlanta, GA',         est: 1996 },
  { id: 'nashville', name: 'Nashville', country: 'us', x: 49, y: 58, city: 'Nashville, TN',      est: 2006 },
  { id: 'louisville', name: 'Louisville', country: 'us', x: 50, y: 54, city: 'Louisville, KY',   est: 2009 },
  { id: 'nola',    name: 'New Orleans', country: 'us', x: 46, y: 70, city: 'New Orleans, LA',    est: 2004 },
  { id: 'tampa',   name: 'Tampa',       country: 'us', x: 57, y: 72, city: 'Tampa, FL',          est: 2011 },
  { id: 'miami',   name: 'Miami',       country: 'us', x: 60, y: 76, city: 'Miami, FL',          est: 2008 },
  { id: 'hon',     name: 'Honolulu',    country: 'us', x: 4,  y: 82, city: 'Honolulu, HI',       est: 2000 },
  { id: 'anc',     name: 'Anchorage',   country: 'us', x: 2,  y: 12, city: 'Anchorage, AK',      est: 2003 },
];

function GaggleMap() {
  const [active, setActive] = React.useState(null);
  const [country, setCountry] = React.useState('all');
  const [q, setQ] = React.useState('');

  const filtered = GAGGLES.filter(g => {
    if (country !== 'all' && g.country !== country) return false;
    if (q && !g.name.toLowerCase().includes(q.toLowerCase()) && !g.city.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const visible = new Set(filtered.map(g => g.id));

  return (
    <div className="gmap">
      <SiteHeader active="gaggles" />

      {/* ======= HEADER ======= */}
      <section className="gmap-head">
        <div className="container">
          <div className="gmap-head-grid">
            <div>
              <div className="kicker" style={{ color: 'var(--red)' }}>The network · North America</div>
              <h1 className="gmap-title">Find a gaggle near you.</h1>
              <p className="gmap-sub">
                {GAGGLES.length} groups across the United States and Canada.
                Click any pin for the gaggle&rsquo;s own site &mdash; rehearsals,
                contact info, how to join.
              </p>
            </div>
            <div className="gmap-stats">
              <div><b>{GAGGLES.filter(g=>g.country==='us').length}</b><span>in the US</span></div>
              <div><b>{GAGGLES.filter(g=>g.country==='ca').length}</b><span>in Canada</span></div>
              <div><b>1987</b><span>oldest (Victoria)</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ======= MAP + LIST ======= */}
      <section className="gmap-body">
        <div className="container">
          <div className="gmap-controls">
            <div className="gmap-search">
              <IconSearch size={18} />
              <input type="search" placeholder="Find a city or gaggle…" value={q}
                onChange={e => setQ(e.target.value)} aria-label="Search gaggles" />
            </div>
            <div className="gmap-toggle">
              {[['all','All'],['us','United States'],['ca','Canada']].map(([k, l]) => (
                <button key={k} className={country === k ? 'on' : ''} onClick={() => setCountry(k)}>{l}</button>
              ))}
            </div>
            <div className="gmap-count">
              <b>{filtered.length}</b> gaggles shown
            </div>
          </div>

          <div className="gmap-grid">
            {/* --- MAP --- */}
            <div className="gmap-canvas" onClick={() => setActive(null)}>
              <MapBackdrop />
              {GAGGLES.map(g => {
                const isVisible = visible.has(g.id);
                const isActive = active && active.id === g.id;
                return (
                  <button
                    key={g.id}
                    className={`gmap-pin ${g.country} ${isActive ? 'active' : ''} ${isVisible ? '' : 'dim'}`}
                    style={{ left: g.x + '%', top: g.y + '%' }}
                    onClick={(e) => { e.stopPropagation(); setActive(g); }}
                    aria-label={g.name + ' Gaggle — ' + g.city}>
                    <span className="gmap-pin-dot" />
                  </button>
                );
              })}
              {active && (
                <div className="gmap-popover"
                     style={{
                       left: `min(${active.x}%, calc(100% - 280px))`,
                       top: `calc(${active.y}% + 18px)`,
                     }}
                     onClick={e => e.stopPropagation()}>
                  <div className="gmap-popover-flag">{active.country === 'us' ? '🇺🇸' : '🇨🇦'}</div>
                  <div className="gmap-popover-kicker">Est. {active.est}</div>
                  <div className="gmap-popover-title">{active.name} Gaggle</div>
                  <div className="gmap-popover-city">{active.city}</div>
                  {active.note && <div className="gmap-popover-note">{active.note}</div>}
                  <div className="gmap-popover-actions">
                    <a href={`gaggles/${active.id}.html`} className="btn btn-primary btn-sm">
                      Visit subsite <IconArrow size={13} />
                    </a>
                    <button className="gmap-popover-close" onClick={() => setActive(null)} aria-label="Close">
                      <IconClose size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div className="gmap-legend">
                <div className="gmap-legend-item"><span className="gmap-legend-dot us" /> US gaggle</div>
                <div className="gmap-legend-item"><span className="gmap-legend-dot ca" /> Canadian gaggle</div>
                <div className="gmap-legend-note">Click a pin to visit that gaggle&rsquo;s site.</div>
              </div>
            </div>

            {/* --- LIST --- */}
            <aside className="gmap-list" aria-label="Gaggle list">
              <div className="kicker" style={{ padding: '4px 14px 12px', borderBottom: '1px solid var(--rule)' }}>
                All gaggles · A&ndash;Z
              </div>
              <div className="gmap-list-scroll">
                {[...filtered].sort((a,b) => a.name.localeCompare(b.name)).map(g => (
                  <button key={g.id} className={`gmap-list-item ${active?.id === g.id ? 'active' : ''}`}
                    onClick={() => setActive(g)}>
                    <span className={`gmap-list-dot ${g.country}`} />
                    <span className="gmap-list-text">
                      <span className="gmap-list-name">{g.name}</span>
                      <span className="gmap-list-city">{g.city}</span>
                    </span>
                    <span className="gmap-list-est">{g.est}</span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ======= START ONE ======= */}
      <section className="gmap-start">
        <div className="container">
          <div className="gmap-start-card">
            <div>
              <div className="kicker" style={{ color: 'var(--mustard)' }}>Not on the map?</div>
              <h2>Start a gaggle where you are.</h2>
              <p>
                A gaggle is three or more women, a shared sense of humour, and a
                willingness to sing in public. We&rsquo;ll send you the starter
                kit: songbook, hat tips, and a short guide to standing your
                ground in a grocery-store lobby.
              </p>
            </div>
            <div className="gmap-start-actions">
              <a href="#" className="btn btn-primary btn-lg"><IconPlus size={18} /> The starter kit</a>
              <a href="#" className="btn btn-ghost-light btn-lg">Ask a question first</a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
      <style>{STYLES_MAP}</style>
    </div>
  );
}

/* Simplified, stylized US + Canada outlines. These are schematic, not
   geographically accurate — a placeholder until real tiles are wired. */
function MapBackdrop() {
  return (
    <svg className="gmap-bg" viewBox="0 0 100 90" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="dots" width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx=".5" cy=".5" r=".35" fill="rgba(42,24,71,.12)" />
        </pattern>
      </defs>
      {/* Canada (rough) */}
      <path d="M2,10 L6,6 L14,4 L26,5 L38,7 L52,6 L66,8 L76,10 L80,18 L76,24 L70,28 L62,30 L54,32 L46,30 L38,28 L30,28 L22,26 L14,24 L10,22 L8,18 Z"
            fill="var(--paper-2)" stroke="var(--ink-lilac)" strokeWidth=".2" />
      {/* US mainland (rough) */}
      <path d="M6,32 L14,30 L22,28 L30,28 L38,28 L46,30 L54,30 L62,32 L68,32 L72,36 L72,46 L70,54 L68,60 L64,66 L58,72 L52,76 L46,78 L40,78 L34,76 L28,72 L22,66 L16,58 L12,50 L8,42 Z"
            fill="var(--paper)" stroke="var(--ink-lilac)" strokeWidth=".2" />
      {/* Hawaii */}
      <ellipse cx="4" cy="82" rx="4" ry="2" fill="var(--paper-2)" stroke="var(--ink-lilac)" strokeWidth=".2" />
      {/* Alaska */}
      <path d="M0,8 L8,6 L14,10 L16,14 L12,18 L6,20 L2,18 Z"
            fill="var(--paper-2)" stroke="var(--ink-lilac)" strokeWidth=".2" />
      {/* Overlay dot pattern for texture */}
      <rect x="0" y="0" width="100" height="90" fill="url(#dots)" />
      {/* Country labels */}
      <text x="40" y="20" fill="var(--muted)" fontSize="2.2" fontFamily="var(--font-body)" fontWeight="800" letterSpacing=".2" textAnchor="middle">CANADA</text>
      <text x="38" y="52" fill="var(--muted)" fontSize="2.2" fontFamily="var(--font-body)" fontWeight="800" letterSpacing=".2" textAnchor="middle">UNITED STATES</text>
      <text x="4" y="86" fill="var(--muted)" fontSize="1.4" fontFamily="var(--font-body)" fontWeight="800" letterSpacing=".15" textAnchor="middle">HAWAII</text>
      <text x="7" y="24" fill="var(--muted)" fontSize="1.4" fontFamily="var(--font-body)" fontWeight="800" letterSpacing=".15" textAnchor="middle">ALASKA</text>
    </svg>
  );
}

const STYLES_MAP = `
.gmap { background: var(--paper); }
.btn-sm { padding: 9px 14px; font-size: 13px; min-height: 36px; }

/* head */
.gmap-head { padding: 48px 0 32px; }
.gmap-head-grid { display: grid; grid-template-columns: 1fr auto; gap: 48px; align-items: flex-end; }
.gmap-title { font-size: clamp(48px, 6.5vw, 84px); color: var(--ink); line-height: .98; margin: 14px 0 16px; }
.gmap-sub { font-size: 19px; color: var(--text-soft); max-width: 600px; margin: 0; line-height: 1.5; }
.gmap-stats { display: flex; gap: 36px; padding-left: 40px; border-left: 1px solid var(--rule); }
.gmap-stats b { font-family: var(--font-display); font-size: 42px; color: var(--ink); display: block; line-height: 1; }
.gmap-stats span { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); display: block; margin-top: 6px; }

/* controls */
.gmap-body { padding: 24px 0 80px; }
.gmap-controls {
  display: flex; gap: 16px; align-items: center; margin-bottom: 20px; flex-wrap: wrap;
}
.gmap-search {
  flex: 1; min-width: 260px; display: flex; gap: 12px; align-items: center;
  padding: 12px 18px; background: var(--card); border: 2px solid var(--ink);
  border-radius: 999px;
}
.gmap-search input { flex: 1; border: 0; background: transparent; outline: none; font-size: 16px; font-family: var(--font-body); }
.gmap-toggle { display: flex; gap: 4px; padding: 4px; background: var(--paper-2); border-radius: 999px; }
.gmap-toggle button {
  padding: 10px 18px; border: 0; background: transparent; border-radius: 999px;
  font-weight: 800; font-family: var(--font-body); font-size: 14px; cursor: pointer; color: var(--text);
}
.gmap-toggle button.on { background: var(--ink); color: var(--on-dark); }
.gmap-count { font-size: 14px; color: var(--text-soft); }
.gmap-count b { font-family: var(--font-display); font-size: 22px; color: var(--ink); }

/* grid */
.gmap-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: stretch; }

/* canvas */
.gmap-canvas {
  position: relative; aspect-ratio: 10/7; background: var(--card);
  border: 1.5px solid var(--ink-lilac); border-radius: var(--radius-lg); overflow: hidden;
  box-shadow: var(--shadow-card);
}
.gmap-bg { position: absolute; inset: 0; width: 100%; height: 100%; }

.gmap-pin {
  position: absolute; width: 22px; height: 22px; background: transparent;
  border: 0; padding: 0; cursor: pointer; transform: translate(-50%, -50%);
  z-index: 2;
}
.gmap-pin-dot {
  display: block; width: 14px; height: 14px; border-radius: 50%;
  background: var(--red); border: 2.5px solid var(--card);
  box-shadow: 0 2px 6px rgba(0,0,0,.25);
  transition: transform .15s, background .15s;
  margin: 4px;
}
.gmap-pin.ca .gmap-pin-dot { background: var(--ink); }
.gmap-pin:hover .gmap-pin-dot { transform: scale(1.35); }
.gmap-pin.active { z-index: 5; }
.gmap-pin.active .gmap-pin-dot {
  transform: scale(1.5);
  box-shadow: 0 0 0 5px rgba(226,42,44,.25), 0 2px 6px rgba(0,0,0,.25);
}
.gmap-pin.ca.active .gmap-pin-dot { box-shadow: 0 0 0 5px rgba(87,34,140,.25), 0 2px 6px rgba(0,0,0,.25); }
.gmap-pin.dim { opacity: .22; }
.gmap-pin.dim:hover { opacity: 1; }

/* popover */
.gmap-popover {
  position: absolute; width: 280px; background: var(--card);
  border: 1.5px solid var(--ink); border-radius: 12px; padding: 16px 18px;
  box-shadow: 0 12px 40px rgba(42,24,71,.25); z-index: 10;
  transform: translateX(-50%); margin-left: 0;
}
.gmap-popover-flag { position: absolute; top: 12px; right: 14px; font-size: 20px; }
.gmap-popover-kicker { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--red); }
.gmap-popover-title { font-family: var(--font-display); font-size: 28px; color: var(--ink); line-height: 1; margin: 4px 0 2px; }
.gmap-popover-city { font-size: 14px; color: var(--text-soft); margin-bottom: 10px; }
.gmap-popover-note { font-size: 14px; color: var(--text); font-style: italic; padding: 8px 0; border-top: 1px dashed var(--rule); border-bottom: 1px dashed var(--rule); margin-bottom: 12px; }
.gmap-popover-actions { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.gmap-popover-close { background: transparent; border: 0; color: var(--muted); cursor: pointer; padding: 4px; border-radius: 4px; }
.gmap-popover-close:hover { color: var(--red); }

/* legend */
.gmap-legend {
  position: absolute; bottom: 16px; left: 16px; background: var(--card);
  border: 1px solid var(--rule); border-radius: 8px; padding: 10px 14px;
  display: grid; gap: 6px; font-size: 12px; font-weight: 700; color: var(--text);
  z-index: 3;
}
.gmap-legend-item { display: flex; align-items: center; gap: 8px; }
.gmap-legend-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--red); border: 1.5px solid var(--card); box-shadow: 0 0 0 1px rgba(0,0,0,.1); }
.gmap-legend-dot.ca { background: var(--ink); }
.gmap-legend-note { font-weight: 500; font-size: 11px; color: var(--muted); padding-top: 4px; border-top: 1px dotted var(--rule); margin-top: 2px; }

/* list */
.gmap-list {
  background: var(--card); border: 1px solid var(--rule); border-radius: var(--radius-lg);
  overflow: hidden; display: flex; flex-direction: column;
}
.gmap-list-scroll { overflow-y: auto; flex: 1; max-height: 560px; }
.gmap-list-item {
  display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center;
  width: 100%; padding: 12px 14px; background: transparent; border: 0;
  border-bottom: 1px solid var(--rule); cursor: pointer; text-align: left;
  font-family: var(--font-body); color: var(--text); transition: background .1s;
}
.gmap-list-item:last-child { border-bottom: 0; }
.gmap-list-item:hover { background: var(--paper-2); }
.gmap-list-item.active { background: rgba(226,42,44,.08); }
.gmap-list-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--red); }
.gmap-list-dot.ca { background: var(--ink); }
.gmap-list-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.gmap-list-name { font-family: var(--font-display); font-size: 18px; color: var(--ink); line-height: 1; }
.gmap-list-city { font-size: 12px; color: var(--muted); }
.gmap-list-est { font-family: var(--font-mono); font-size: 12px; color: var(--muted); }

/* start */
.gmap-start { padding: 64px 0 96px; }
.gmap-start-card {
  display: grid; grid-template-columns: 1.2fr 1fr; gap: 48px; align-items: center;
  padding: 48px; background: var(--ink); color: var(--on-dark); border-radius: var(--radius-lg);
}
.gmap-start-card h2 { font-size: 48px; color: var(--on-dark); line-height: 1; margin: 14px 0 14px; }
.gmap-start-card p { font-size: 17px; line-height: 1.55; color: var(--ink-lilac); margin: 0; max-width: 520px; }
.gmap-start-actions { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
.gmap-start .btn-primary { background: var(--red); }
.btn-ghost-light { display: inline-flex; align-items: center; gap: 10px; padding: 14px 22px; border: 2px solid var(--on-dark); color: var(--on-dark); border-radius: 999px; font-weight: 800; font-size: 16px; background: transparent; }
.btn-ghost-light:hover { background: var(--on-dark); color: var(--ink); text-decoration: none; }
.gmap-start .btn-lg { padding: 16px 26px; font-size: 16px; min-height: 52px; }

@media (max-width: 900px) {
  .gmap-head-grid { grid-template-columns: 1fr; }
  .gmap-grid { grid-template-columns: 1fr; }
  .gmap-start-card { grid-template-columns: 1fr; padding: 32px; }
}
`;

window.GaggleMap = GaggleMap;
