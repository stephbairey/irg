/* global React, SiteHeader, SiteFooter, IconArrow, IconDown, FAQ_TEASER */

/* ================================================================
   INNER PAGES — About, Herstory, Philosophy, FAQ, Contact
   Shared newsprint shell (InnerShell) matching the Bulletin DNA.
   Each includes a single photo using assets/granny-photo-1.jpg.
   ================================================================ */

function InnerShell({ kicker, title, dek, activeNav, children }) {
  return (
    <div className="inner-page">
      <SiteHeader active={activeNav} />
      <section className="inner-masthead">
        <div className="container">
          <div className="inner-masthead-top">
            <span>Welcome, friend</span>
            <span>The International Disorganization</span>
            <span>Est. Victoria, BC · 1987</span>
          </div>
          <div className="inner-hero">
            <div className="inner-kicker">{kicker}</div>
            <h1 className="inner-title">{title}</h1>
            {dek && <p className="inner-dek">{dek}</p>}
          </div>
        </div>
      </section>
      {children}
      <SiteFooter />
      <style>{INNER_STYLES}</style>
    </div>
  );
}

/* ---------- Photo helper (polaroid style, optional caption/tilt) ---------- */
function PolaroidPhoto({ src = 'assets/granny-photo-1.jpg', alt = '', caption, tilt = -1.3, height = 320 }) {
  return (
    <figure className="inner-photo" style={{ transform: `rotate(${tilt}deg)` }}>
      <img src={src} alt={alt} style={{ height: height + 'px' }} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/* ================================================================
   ABOUT
   ================================================================ */
function AboutPage() {
  return (
    <InnerShell
      kicker="About"
      activeNav="about"
      title="An international disorganization of flowered hats."
      dek="We are roughly eighty autonomous gaggles of women over fifty, scattered across North America and a little beyond, who show up at protests, council hearings, and corporate lobbies and sing."
    >
      <section className="inner-body">
        <div className="container">
          <div className="inner-lede-grid">
            <div className="inner-lede-copy">
              <p className="inner-drop"><span className="drop">T</span>here is no head office. No dues. No permission slips. If you and a few neighbours want to start a gaggle, you start a gaggle. The only requirements are a flowered hat, a tune everyone already knows, and a grievance.</p>
              <p>Each gaggle is self-governing and picks its own fights — climate, housing, war, labour, gender, local zoning. What we share is a method: <em>set new lyrics to a familiar tune, show up somewhere uncomfortable, and sing together until someone starts listening or politely asks us to leave.</em></p>
              <p>This website exists to hold the collective songbook (now at 1,493 songs and counting), a directory of active gaggles, and enough how-to for a new group to find its footing. The rest happens on the street.</p>
            </div>
            <aside className="inner-lede-photo">
              <PolaroidPhoto caption="Madison gaggle · capitol steps · 2025" tilt={-1.5} height={360} />
            </aside>
          </div>

          <div className="inner-facts">
            <div><b>80+</b><span>Active gaggles</span></div>
            <div><b>1,493</b><span>Songs on file</span></div>
            <div><b>17</b><span>Issue categories</span></div>
            <div><b>39</b><span>Years going</span></div>
          </div>

          <div className="inner-cta-grid">
            <a href="#" className="inner-cta inner-cta--red">
              <div className="inner-cta-kicker">For visitors</div>
              <div className="inner-cta-title">Find a gaggle near you</div>
              <div className="inner-cta-arrow"><IconArrow size={16} /></div>
            </a>
            <a href="#" className="inner-cta inner-cta--ink">
              <div className="inner-cta-kicker">For organizers</div>
              <div className="inner-cta-title">Start your own gaggle</div>
              <div className="inner-cta-arrow"><IconArrow size={16} /></div>
            </a>
          </div>
        </div>
      </section>
    </InnerShell>
  );
}

/* ================================================================
   HERSTORY
   ================================================================ */
function HerstoryPage() {
  const TIMELINE = [
    { year: '1987', place: 'Victoria, BC', body: 'A handful of women, exhausted by being ignored at nuclear-submarine protests, borrow flowered hats and start singing. The first gaggle is born.' },
    { year: '1989', place: 'Seattle, WA', body: 'The second gaggle forms south of the border. A songbook exchange by fax begins between the two cities.' },
    { year: '1994', place: 'Eastern US', body: 'A dozen new gaggles spring up from Boston to Philadelphia. The movement reaches the New York Times.' },
    { year: '2001', place: 'Post-9/11', body: 'Peace gaggles proliferate. Anti-war songs dominate the archive for the better part of a decade.' },
    { year: '2015', place: 'Continental', body: 'The collective songbook passes a thousand titles. A Google Sheet — briefly — holds the archive.' },
    { year: '2026', place: 'Everywhere', body: 'Eighty-plus gaggles, 1,493 songs, and counting. You are reading the new website.' },
  ];
  return (
    <InnerShell
      kicker="Herstory"
      activeNav="about"
      title="How this got started — and kept going."
      dek="Forty-ish years of satirical song, five continents touched, one origin story that begins with being politely ignored."
    >
      <section className="inner-body">
        <div className="container">
          <div className="inner-origin-grid">
            <div className="inner-origin-photo">
              <PolaroidPhoto caption="Victoria, BC · early years" tilt={-2} height={420} />
            </div>
            <div className="inner-origin-copy">
              <div className="kicker">The origin</div>
              <h2 className="inner-h2">Victoria, 1987.</h2>
              <p className="inner-drop">
                <span className="drop">I</span>t started with a nuclear submarine and a group of local women who had attended one too many solemn peace vigils where no one listened. Someone, exasperated, suggested that what they needed was <em>hats</em>. Big ones. And songs. And perhaps — since they were all, technically, grandmothers — they should play the part to the hilt.
              </p>
              <p>The first appearance was at the Esquimalt naval base gate. The point was to be <em>unarrestable</em>: too visibly elderly, too visibly cheerful, too visibly having a nice time to be treated with anything but bewildered politeness. It worked. The press came. A reporter asked their name. They improvised one on the spot.</p>
            </div>
          </div>

          <div className="inner-timeline">
            <div className="kicker">A loose chronology</div>
            <h2 className="inner-h2 inner-h2--center">Four decades, in sixths.</h2>
            <ol className="timeline-list">
              {TIMELINE.map(t => (
                <li key={t.year}>
                  <div className="timeline-year">{t.year}</div>
                  <div className="timeline-body">
                    <div className="timeline-place">{t.place}</div>
                    <p>{t.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </InnerShell>
  );
}

/* ================================================================
   PHILOSOPHY
   ================================================================ */
function PhilosophyPage() {
  const PRINCIPLES = [
    { n: '01', t: 'Sing, don\'t shout.', body: 'Anyone can be shouted down. A choir in three-part harmony is harder to dismiss, harder to interrupt, and harder to forget. The tune does the carrying.' },
    { n: '02', t: 'Use the tunes they know.', body: 'New lyrics to a familiar melody travel faster than any original composition. A crowd sings along before they realise what they\'re agreeing to.' },
    { n: '03', t: 'Be unarrestable.', body: 'Flowered hats, sensible shoes, a visible cane or two. Police are trained to handle belligerence, not a choir of grandmothers serenading them by name.' },
    { n: '04', t: 'Take yourselves un-seriously.', body: 'The grievances are serious. The delivery is not. Humour makes room for people to listen who have tuned out more confrontational forms.' },
    { n: '05', t: 'Stay small, stay everywhere.', body: 'No federation, no head office, no permission. A new gaggle just needs four women, a tune, and a photocopier. That\'s the feature, not the bug.' },
  ];
  return (
    <InnerShell
      kicker="Philosophy"
      activeNav="about"
      title="Why song. Why old women. Why the hats."
      dek="Five working principles we have arrived at over roughly four decades. They are not binding. Nothing is, really."
    >
      <section className="inner-body">
        <div className="container">
          <div className="inner-philo-hero">
            <blockquote className="inner-pullquote">
              <span className="quote-mark">“</span>
              The moral authority of advanced age, combined with a tune everyone’s grandmother used to hum, is a surprisingly durable piece of protest infrastructure.
              <cite>— from the 1991 newsletter</cite>
            </blockquote>
            <div className="inner-philo-photo">
              <PolaroidPhoto caption="A working choir · mid-action" tilt={1.8} height={280} />
            </div>
          </div>

          <ol className="inner-principles">
            {PRINCIPLES.map(p => (
              <li key={p.n} className="inner-principle">
                <div className="principle-num">{p.n}</div>
                <div>
                  <h3 className="principle-title">{p.t}</h3>
                  <p>{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </InnerShell>
  );
}

/* ================================================================
   FAQ
   ================================================================ */
function FAQPage() {
  const FAQS = [
    { q: 'Do I have to be a grandmother to join?', a: 'No. You have to be a woman over fifty who is willing to wear a flowered hat in public. Grandchildren are optional.' },
    { q: 'Do you write your own songs?', a: 'Yes. Every gaggle writes parodies set to tunes everyone already knows. We share them across the network — that\'s what the 1,493-song library is for.' },
    { q: 'Are you serious or are you joking?', a: 'Both, at the same time, deliberately. The grievances are entirely serious. The delivery is not.' },
    { q: 'How do I start a gaggle?', a: 'Find three or four friends, pick a tune, and write new lyrics about something that makes you furious. Show up somewhere and sing it. Congratulations, you have a gaggle. Then contact us to be added to the directory.' },
    { q: 'Is there a membership fee?', a: 'No. There is no central organisation to collect one.' },
    { q: 'Can men join?', a: 'Not the singing gaggles — that\'s part of the point. But allies of every kind are welcome at every action, and can absolutely help with sound, logistics, childcare, or bail.' },
    { q: 'Have you ever been arrested?', a: 'Rarely. Politely, when it happens. It tends to make the local news, which is often the goal.' },
    { q: 'Can I use your songs for my own protest?', a: 'Please do. The archive is free to use. Credit the songwriter and the gaggle in the lyrics if you can.' },
    { q: 'What if we want to sing at a private event?', a: 'Most gaggles will happily perform at union halls, community events, and sympathetic fundraisers. Contact the gaggle nearest you.' },
    { q: 'Who runs this website?', a: 'A small rotating volunteer crew from gaggles across the continent. The song archive is maintained by the songwriters themselves.' },
  ];
  return (
    <InnerShell
      kicker="Frequently asked"
      activeNav="faq"
      title="Letters to the editor."
      dek="The same questions come up at every action. Here are the answers we have settled on — for now. If yours is not here, write to us."
    >
      <section className="inner-body">
        <div className="container">
          <div className="inner-faq-grid">
            <aside className="inner-faq-aside">
              <PolaroidPhoto caption="Post-action · 2025" tilt={-1.5} height={260} />
              <p className="inner-aside-copy">
                Can’t find what you’re looking for? Send your question to
                <a href="mailto:hello@raginggrannies.org"> hello@raginggrannies.org</a> and we’ll add it if it comes up more than once.
              </p>
            </aside>
            <div className="inner-faq-list">
              {FAQS.map((f, i) => (
                <details key={i} className="faq-item" open={i === 0}>
                  <summary>{f.q}<IconDown size={18} /></summary>
                  <div className="faq-answer">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </InnerShell>
  );
}

/* ================================================================
   CONTACT
   ================================================================ */
function ContactPage() {
  const INBOXES = [
    { label: 'Join a gaggle', addr: 'join@raginggrannies.org', body: 'We’ll put you in touch with the gaggle nearest you. Please include your city.' },
    { label: 'Start a gaggle', addr: 'start@raginggrannies.org', body: 'For advice, templates, and a welcome-pack from a nearby organizer.' },
    { label: 'Press inquiries', addr: 'press@raginggrannies.org', body: 'Interviews, quotes, photos, and spokespeople for journalists on deadline.' },
    { label: 'Everything else', addr: 'hello@raginggrannies.org', body: 'General questions, website bugs, contributions to the song archive.' },
  ];
  return (
    <InnerShell
      kicker="Get in touch"
      activeNav="contact"
      title="We would love to hear from you."
      dek="Pick the inbox that fits, or fill in the form — either reaches the same small group of volunteers. Please allow a few days for a reply; we all have day jobs."
    >
      <section className="inner-body">
        <div className="container">
          <div className="inner-contact-grid">
            <form className="inner-form" onSubmit={e => e.preventDefault()}>
              <div className="kicker">A general message</div>
              <h2 className="inner-h2">Write to us.</h2>
              <label className="inner-label">
                <span>Your name</span>
                <input type="text" placeholder="Jane Smith" />
              </label>
              <label className="inner-label">
                <span>Email</span>
                <input type="email" placeholder="you@example.org" />
              </label>
              <label className="inner-label">
                <span>About</span>
                <select>
                  <option>Joining a gaggle</option>
                  <option>Starting a new gaggle</option>
                  <option>Press &amp; media</option>
                  <option>A song contribution</option>
                  <option>Website / technical</option>
                  <option>Something else</option>
                </select>
              </label>
              <label className="inner-label">
                <span>Message</span>
                <textarea rows={6} placeholder="Tell us what’s on your mind…" />
              </label>
              <button type="submit" className="inner-submit">Send message <IconArrow size={14} /></button>
            </form>

            <aside className="inner-contact-aside">
              <PolaroidPhoto caption="The volunteers, periodically" tilt={1.6} height={240} />
              <div className="inner-inboxes">
                <div className="kicker">Direct inboxes</div>
                {INBOXES.map(i => (
                  <div key={i.addr} className="inner-inbox">
                    <div className="inbox-label">{i.label}</div>
                    <a href={`mailto:${i.addr}`} className="inbox-addr">{i.addr}</a>
                    <p>{i.body}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </InnerShell>
  );
}

/* ================================================================
   STYLES
   ================================================================ */
const INNER_STYLES = `
.inner-page { background: var(--paper); color: var(--text); }
.inner-page .container { max-width: 1240px; margin: 0 auto; padding: 0 40px; }

.inner-masthead { padding: 56px 0 48px; border-bottom: 3px double var(--ink); }
.inner-masthead-top {
  display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap;
  font-family: var(--font-body); font-size: 12px; font-weight: 700;
  letter-spacing: .12em; text-transform: uppercase; color: var(--muted);
  border-bottom: 1px solid var(--rule); padding-bottom: 14px; margin-bottom: 40px;
}
.inner-hero { max-width: 920px; }
.inner-kicker {
  font-family: var(--font-body); font-size: 12px; font-weight: 800;
  letter-spacing: .16em; text-transform: uppercase; color: var(--red);
  margin-bottom: 16px;
}
.inner-title {
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(56px, 8vw, 104px); line-height: .95; color: var(--ink);
  letter-spacing: -.01em; margin: 0; text-wrap: pretty;
}
.inner-dek {
  font-size: 22px; line-height: 1.45; color: var(--text);
  max-width: 60ch; margin: 28px 0 0;
}
.inner-dek em { font-style: italic; color: var(--ink); }

.inner-body { padding: 72px 0 96px; }
.inner-h2 {
  font-family: var(--font-display); font-weight: 400;
  font-size: 52px; line-height: 1; color: var(--ink);
  margin: 14px 0 20px; letter-spacing: -.005em;
}
.inner-h2--center { text-align: center; }
.kicker {
  font-family: var(--font-body); font-size: 11px; font-weight: 800;
  letter-spacing: .16em; text-transform: uppercase; color: var(--red);
  margin-bottom: 8px;
}

/* ---- photo ---- */
.inner-photo {
  margin: 0; padding: 14px 14px 0; background: var(--on-dark);
  box-shadow: 0 14px 36px rgba(0,0,0,.18);
  display: inline-block;
}
.inner-photo img {
  display: block; width: 100%; object-fit: cover;
  filter: saturate(.9) contrast(1.02);
}
.inner-photo figcaption {
  font-family: var(--font-body); font-size: 11px; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase; color: var(--ink);
  padding: 12px 4px 12px; text-align: center;
}

/* ---- About ---- */
.inner-lede-grid {
  display: grid; grid-template-columns: 1.4fr 1fr; gap: 64px;
  align-items: start; margin-bottom: 56px;
}
.inner-lede-copy p { font-size: 19px; line-height: 1.6; color: var(--text); margin: 0 0 18px; max-width: 58ch; }
.inner-lede-copy em { font-style: italic; color: var(--ink); }
.inner-drop .drop {
  float: left; font-family: var(--font-display); font-size: 78px; line-height: .78;
  color: var(--red); padding: 8px 10px 0 0;
}
.inner-lede-photo { justify-self: end; }

.inner-facts {
  display: grid; grid-template-columns: repeat(4, 1fr);
  padding: 28px 0; margin: 0 0 56px;
  border-top: 2px solid var(--ink); border-bottom: 2px solid var(--ink);
}
.inner-facts > div { padding: 0 24px; border-left: 1px solid var(--rule); }
.inner-facts > div:first-child { border-left: none; padding-left: 0; }
.inner-facts b { display: block; font-family: var(--font-display); font-size: 56px; color: var(--ink); line-height: 1; margin-bottom: 4px; }
.inner-facts span { font-family: var(--font-body); font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }

.inner-cta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.inner-cta {
  display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 20px;
  padding: 32px 36px; border-radius: var(--radius); text-decoration: none;
  transition: transform .15s ease;
}
.inner-cta:hover { transform: translateY(-3px); }
.inner-cta-kicker {
  font-family: var(--font-body); font-size: 11px; font-weight: 800;
  letter-spacing: .16em; text-transform: uppercase; margin-bottom: 10px;
}
.inner-cta-title { font-family: var(--font-display); font-size: 36px; line-height: 1; }
.inner-cta-arrow { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 50%; }
.inner-cta--red { background: var(--red); color: var(--on-dark); }
.inner-cta--red .inner-cta-kicker { color: rgba(255,255,255,.8); }
.inner-cta--red .inner-cta-arrow { background: rgba(255,255,255,.15); }
.inner-cta--ink { background: var(--ink); color: var(--on-dark); }
.inner-cta--ink .inner-cta-kicker { color: var(--mustard, #E6B94A); }
.inner-cta--ink .inner-cta-arrow { background: rgba(255,255,255,.15); }

/* ---- Herstory ---- */
.inner-origin-grid {
  display: grid; grid-template-columns: 1fr 1.2fr; gap: 72px;
  align-items: start; margin-bottom: 80px;
  padding-bottom: 72px; border-bottom: 1px solid var(--rule);
}
.inner-origin-copy p { font-size: 19px; line-height: 1.6; color: var(--text); margin: 0 0 18px; }
.inner-origin-copy em { font-style: italic; color: var(--ink); }

.inner-timeline { max-width: 900px; margin: 0 auto; }
.timeline-list { list-style: none; padding: 0; margin: 40px 0 0; display: grid; gap: 0; }
.timeline-list li {
  display: grid; grid-template-columns: 180px 1fr; gap: 36px;
  padding: 28px 0; border-top: 1px solid var(--rule);
}
.timeline-list li:last-child { border-bottom: 1px solid var(--rule); }
.timeline-year {
  font-family: var(--font-display); font-size: 72px; color: var(--red);
  line-height: 1; letter-spacing: -.01em;
}
.timeline-place {
  font-family: var(--font-body); font-size: 12px; font-weight: 800;
  letter-spacing: .14em; text-transform: uppercase; color: var(--purple);
  margin-bottom: 8px;
}
.timeline-body p { margin: 0; font-size: 18px; line-height: 1.55; color: var(--text); }

/* ---- Philosophy ---- */
.inner-philo-hero {
  display: grid; grid-template-columns: 1.4fr 1fr; gap: 56px;
  align-items: center; margin-bottom: 56px;
  padding-bottom: 56px; border-bottom: 1px solid var(--rule);
}
.inner-pullquote {
  margin: 0; font-family: var(--font-display); font-weight: 400;
  font-size: 42px; line-height: 1.15; color: var(--ink);
  position: relative; padding-left: 56px;
}
.inner-pullquote .quote-mark {
  position: absolute; left: 0; top: -24px;
  font-size: 140px; line-height: 1; color: var(--red);
}
.inner-pullquote cite {
  display: block; margin-top: 20px; font-family: var(--font-body);
  font-size: 13px; font-weight: 800; letter-spacing: .12em;
  text-transform: uppercase; color: var(--muted); font-style: normal;
}
.inner-philo-photo { justify-self: end; }

.inner-principles { list-style: none; padding: 0; margin: 0; max-width: 840px; }
.inner-principle {
  display: grid; grid-template-columns: 120px 1fr; gap: 40px;
  padding: 32px 0; border-top: 1px solid var(--rule);
}
.inner-principles li:last-child { border-bottom: 1px solid var(--rule); }
.principle-num {
  font-family: var(--font-display); font-size: 56px; color: var(--purple);
  line-height: 1;
}
.principle-title {
  font-family: var(--font-display); font-weight: 400; font-size: 32px;
  line-height: 1.1; color: var(--ink); margin: 0 0 10px;
}
.inner-principle p { margin: 0; font-size: 18px; line-height: 1.55; color: var(--text); max-width: 58ch; }

/* ---- FAQ ---- */
.inner-faq-grid {
  display: grid; grid-template-columns: 320px 1fr; gap: 72px;
  align-items: start;
}
.inner-faq-aside { position: sticky; top: 24px; }
.inner-aside-copy {
  margin: 24px 0 0; font-size: 14px; line-height: 1.55; color: var(--text-soft);
}
.inner-aside-copy a { color: var(--red); border-bottom: 1.5px solid var(--red); text-decoration: none; font-weight: 700; }

/* ---- Contact ---- */
.inner-contact-grid {
  display: grid; grid-template-columns: 1.2fr 1fr; gap: 64px;
  align-items: start;
}
.inner-form { display: grid; gap: 16px; max-width: 560px; }
.inner-form .inner-h2 { margin-bottom: 8px; }
.inner-label { display: grid; gap: 6px; }
.inner-label > span {
  font-family: var(--font-body); font-size: 11px; font-weight: 800;
  letter-spacing: .14em; text-transform: uppercase; color: var(--muted);
}
.inner-label input,
.inner-label select,
.inner-label textarea {
  font: 500 16px/1.5 var(--font-body); color: var(--text);
  background: var(--card); border: 1px solid var(--rule); border-radius: 10px;
  padding: 14px 16px; outline: none;
  transition: border-color .15s ease;
}
.inner-label select { appearance: none; height: 50px; padding-right: 36px; cursor: pointer;
  background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%);
  background-position: calc(100% - 18px) 50%, calc(100% - 13px) 50%;
  background-size: 5px 5px; background-repeat: no-repeat;
}
.inner-label input:focus,
.inner-label select:focus,
.inner-label textarea:focus { border-color: var(--red); }
.inner-submit {
  display: inline-flex; align-items: center; gap: 8px; justify-self: start;
  padding: 14px 22px; border-radius: 999px;
  background: var(--red); color: var(--on-dark); border: none;
  font: 800 14px/1 var(--font-body); letter-spacing: .04em;
  cursor: pointer; margin-top: 8px;
  transition: background .15s ease;
}
.inner-submit:hover { background: var(--ink); }

.inner-contact-aside { display: grid; gap: 28px; }
.inner-inboxes { display: grid; gap: 20px; }
.inner-inbox {
  padding: 18px 20px; background: var(--paper-2);
  border: 1px solid var(--rule); border-radius: 10px;
}
.inbox-label {
  font-family: var(--font-body); font-size: 11px; font-weight: 800;
  letter-spacing: .14em; text-transform: uppercase; color: var(--purple); margin-bottom: 4px;
}
.inbox-addr {
  display: block; font-family: var(--font-display); font-size: 22px;
  color: var(--ink); text-decoration: none; margin-bottom: 6px;
  border-bottom: 1.5px solid transparent;
}
.inbox-addr:hover { border-bottom-color: var(--red); color: var(--red); }
.inner-inbox p { margin: 0; font-size: 14px; line-height: 1.5; color: var(--text-soft); }
`;

Object.assign(window, { AboutPage, HerstoryPage, PhilosophyPage, FAQPage, ContactPage });
