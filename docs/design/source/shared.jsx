/* global React */

/* ================================================================
   Shared primitives: header, footer, icons, data, logo
   ================================================================ */

// Granny logo — inline SVG for tinting. Simplified from the full logo.
const GrannyMark = ({ size = 40, color = 'currentColor', className }) => (
  <svg viewBox="0 0 526 500" width={size} height={size} className={className}
       style={{ display: 'block', overflow: 'visible' }}>
    <image href="assets/granny-cropped.png" x="0" y="0" width="526" height="500"
           style={{ filter: color === 'currentColor' ? 'none' : undefined }} />
  </svg>
);

// Simple version showing the logo. Default = walking full-body version.
const GrannyImg = ({ src = 'assets/logo-full.svg', alt = '', ...rest }) => (
  <img src={src} alt={alt} {...rest} />
);

// -- Icons (stroke, 1.5px) --
const Icon = ({ children, size = 18, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
       stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
       className={className} style={{ flex: 'none', ...style }}>
    {children}
  </svg>
);
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>;
const IconArrow  = (p) => <Icon {...p}><path d="M5 12h14"/><path d="m13 5 7 7-7 7"/></Icon>;
const IconArrowL = (p) => <Icon {...p}><path d="M19 12H5"/><path d="m11 5-7 7 7 7"/></Icon>;
const IconMap    = (p) => <Icon {...p}><path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2z"/><path d="M9 3v16"/><path d="M15 5v16"/></Icon>;
const IconDown   = (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>;
const IconPrint  = (p) => <Icon {...p}><path d="M6 9V2h12v7"/><rect x="3" y="9" width="18" height="10" rx="1"/><path d="M6 14h12v8H6z"/></Icon>;
const IconPlay   = (p) => <Icon {...p}><path d="M8 5v14l11-7z"/></Icon>;
const IconSparkle = (p) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></Icon>;
const IconShuffle = (p) => <Icon {...p}><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></Icon>;
const IconMenu = (p) => <Icon {...p}><path d="M4 6h16M4 12h16M4 18h16"/></Icon>;
const IconClose = (p) => <Icon {...p}><path d="m6 6 12 12M18 6 6 18"/></Icon>;
const IconPlus = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;

// -- Header --
function SiteHeader({ active = 'home' }) {
  const NavLink = ({ id, children, href = '#' }) => (
    <a href={href} aria-current={active === id ? 'page' : undefined}
       style={active === id ? { color: 'var(--red)' } : {}}>{children}</a>
  );
  return (
    <header className="siteheader">
      <div className="siteheader-inner">
        <a className="brand" href="#">
          <GrannyImg src="assets/logo-cropped.svg" alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <div>
            <div className="brand-name">Raging Grannies</div>
            <div className="brand-sub">International Network · Est. 1987</div>
          </div>
        </a>
        <nav className="navlinks" aria-label="Main">
          <NavLink id="songs" href="song-library.html">Songs</NavLink>
          <NavLink id="gaggles" href="gaggle-map.html">Find a Gaggle</NavLink>
          <NavLink id="start">Start One</NavLink>
          <NavLink id="press" href="#press">Press</NavLink>
          <NavLink id="about">About</NavLink>
          <a className="navcta" href="gaggle-map.html">The Map</a>
        </nav>
      </div>
    </header>
  );
}

// -- Footer --
function SiteFooter() {
  return (
    <footer className="sitefooter">
      <div className="sitefooter-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <GrannyImg src="assets/logo-full.svg" alt="" style={{ width: 44, height: 54, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--on-dark)' }}>
              Raging Grannies
            </div>
          </div>
          <p style={{ margin: 0, color: 'var(--ink-lilac)', maxWidth: 340, fontSize: 15 }}>
            A network of women over 50, singing satire into the face of injustice
            since a damp Tuesday in Victoria, BC, 1987.
          </p>
        </div>
        <div>
          <h4>The Songs</h4>
          <ul>
            <li><a href="#">Browse library</a></li>
            <li><a href="#">By issue</a></li>
            <li><a href="#">By tune</a></li>
            <li><a href="#">Submit a song</a></li>
          </ul>
        </div>
        <div>
          <h4>The Movement</h4>
          <ul>
            <li><a href="#">Find a gaggle</a></li>
            <li><a href="#">Start a gaggle</a></li>
            <li><a href="#">Herstory</a></li>
            <li><a href="#">Philosophy</a></li>
          </ul>
        </div>
        <div>
          <h4>Get in touch</h4>
          <ul>
            <li><a href="#">Contact</a></li>
            <li><a href="#">Press</a></li>
            <li><a href="#">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div className="sitefooter-bottom">
        <span>© 2026 International Raging Grannies · A registered fiscal frolic.</span>
        <span>Made with satire, by volunteers.</span>
      </div>
    </footer>
  );
}

// -- Data --
const ISSUES = [
  { slug: 'war-peace',    label: 'War & Peace',              count: 287, tint: 'red' },
  { slug: 'climate',      label: 'Climate & Environment',    count: 241, tint: 'ink' },
  { slug: 'gov',          label: 'Government & Politics',    count: 198, tint: 'red' },
  { slug: 'labor',        label: 'Labor & Worker Rights',    count: 156, tint: 'ink' },
  { slug: 'civil',        label: 'Human & Civil Rights',     count: 142, tint: 'red' },
  { slug: 'women',        label: "Women's Rights",           count: 128, tint: 'ink' },
  { slug: 'health',       label: 'Healthcare & Pharma',      count:  89, tint: 'red' },
  { slug: 'housing',      label: 'Housing & Homelessness',   count:  64, tint: 'ink' },
  { slug: 'corp',         label: 'Corporate Power',          count:  61, tint: 'red' },
  { slug: 'indig',        label: 'Indigenous Sovereignty',   count:  57, tint: 'ink' },
  { slug: 'lgbtq',        label: 'LGBTQ+ Rights',            count:  52, tint: 'red' },
  { slug: 'guns',         label: 'Gun Control',              count:  48, tint: 'ink' },
  { slug: 'media',        label: 'Media & Free Speech',      count:  44, tint: 'red' },
  { slug: 'trade',        label: 'Trade & Globalization',    count:  39, tint: 'ink' },
  { slug: 'animals',      label: 'Animal Welfare',           count:  34, tint: 'red' },
  { slug: 'education',    label: 'Public Education',         count:  32, tint: 'ink' },
  { slug: 'holiday',      label: 'Holidays & Seasonal',      count:  21, tint: 'mustard' },
];

const SONGS = [
  { id: 1, title: 'My Blockade',             tune: 'Iko Iko by the Dixie Cups',              gaggle: 'Seattle',                    writer: 'Jo-Hanna Reed',          tags: ['war-peace'],          year: 2023, has_audio: true },
  { id: 2, title: 'These Grannies',          tune: 'These Boots Were Made for Walking',      gaggle: 'Tuolumne & Calaveras',       writer: 'Lori Underwood',         tags: ['gov'],                 year: 2022 },
  { id: 3, title: 'We Will Stop You',        tune: 'We Will Rock You',                       gaggle: 'Green Bay',                  writer: 'Susan Dutton',            tags: ['gov'],                 year: 2024, has_audio: true },
  { id: 4, title: 'The Modern Workers Song', tune: "The Chemical Worker's Song (Process Man)", gaggle: 'Green Bay',                writer: 'Garnet De Grave, Susan Dutton', tags: ['labor'],          year: 2026, has_audio: true, featured: true },
  { id: 5, title: 'Come Back Home, America', tune: 'Take Me Home, Country Roads by John Denver', gaggle: 'Madison',                writer: 'Kathy Miner',             tags: ['gov','civil'],         year: 2023 },
  { id: 6, title: 'Drill, Baby, Chill',      tune: 'Jingle Bells',                            gaggle: 'Portland',                   writer: 'Marguerite Ahlstrom',     tags: ['climate','holiday'],   year: 2024, has_audio: true },
  { id: 7, title: "Grandma's Got a Bullhorn", tune: "Grandma Got Run Over by a Reindeer",    gaggle: 'Victoria (Original)',        writer: 'Alison Acker',            tags: ['gov','women'],         year: 2021 },
  { id: 8, title: 'Pipeline to Nowhere',     tune: 'Stairway to Heaven',                      gaggle: 'Edmonton',                   writer: 'Peggy Blair',             tags: ['climate','indig'],     year: 2025, has_audio: true },
  { id: 9, title: 'Rent is Too Damn High',   tune: 'Take Me Out to the Ball Game',            gaggle: 'Brooklyn',                   writer: 'Frances Goldin',          tags: ['housing'],             year: 2024 },
  { id: 10, title: "Doctor, Doctor, Send the Bill", tune: 'Doctor, Doctor (Thompson Twins)', gaggle: 'Austin',                     writer: 'Betty Carson',            tags: ['health'],              year: 2023 },
  { id: 11, title: "CEO Lullaby",            tune: 'Rock-a-Bye Baby',                         gaggle: 'San Francisco Bay',          writer: 'Vivian Moon',             tags: ['corp','labor'],        year: 2022, has_audio: true },
  { id: 12, title: 'The Ballot Box Blues',   tune: "St. Louis Blues",                         gaggle: 'Atlanta',                    writer: 'Dorothea Green',          tags: ['gov','civil'],         year: 2024 },
];

const FEATURED_LYRIC = {
  title: 'The Modern Workers Song',
  gaggle: 'Green Bay Gaggle',
  lines: [
    'A working hand am I, and I’m tellin’ you no lie',
    'I work and breathe among the fumes that foul up our sky',
    'There’s loud noise all around me and there’s poison in the air',
    'There’s a lousy smell that smacks of hell and dust all through my hair',
  ],
};

const HERSTORY = {
  year: 1987,
  where: 'Victoria, BC',
  line: 'A handful of women over 50 got tired of being ignored at nuclear-sub protests. They put on flowered hats, wrote a few satirical songs, and discovered that a chorus of grandmothers is surprisingly hard to escort away.',
};

const FAQ_TEASER = [
  { q: 'Do I have to be a grandmother?', a: 'No — just a woman, broadly defined, on the far side of fifty. Actual grandchildren are not required equipment.' },
  { q: 'Do I have to be able to sing?', a: 'If you can carry a protest sign, you can carry a tune. Enthusiasm outranks pitch at every gaggle we know.' },
  { q: 'Do we write our own songs?', a: 'Yes. Every gaggle writes its own parodies, to local tunes, about local outrages. That is the whole point.' },
  { q: 'Are the flowered hats mandatory?', a: 'Strongly encouraged. They’re load-bearing infrastructure for the joke.' },
];

// Emphasis parser — treats *word* as italic, **word** as bold, like the
// songwriter markup from the existing site's screenshot.
function renderLyric(line) {
  const parts = [];
  let i = 0;
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let m, last = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('**')) parts.push(<strong key={parts.length}>{t.slice(2, -2)}</strong>);
    else parts.push(<em key={parts.length} style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>{t.slice(1, -1)}</em>);
    last = re.lastIndex;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

Object.assign(window, {
  GrannyMark, GrannyImg,
  SiteHeader, SiteFooter,
  Icon, IconSearch, IconArrow, IconArrowL, IconMap, IconDown, IconPrint,
  IconPlay, IconSparkle, IconShuffle, IconMenu, IconClose, IconPlus,
  ISSUES, SONGS, FEATURED_LYRIC, HERSTORY, FAQ_TEASER,
  renderLyric,
});
