/**
 * src/pages/Showcase.jsx
 * ======================
 * The /showcase page: the portfolio of everything that speaks the packstruct
 * grammar. Static by design - the cards prerender at build time from
 * src/hosts.js (the pure-data law), so crawlers and no-JS visitors read the
 * whole board. This is the crosslink hub: every host links back to its repo,
 * its live site, and its docs, and every count is a receipt from the host's
 * own packs/public/ directory.
 */
import usePageMeta from '../hooks/usePageMeta.js'
import { HOSTS, DOGFOOD, FAMILY, PROFILES, TOTAL_HOSTS, TOTAL_PACKS, hostsByProfile } from '../hosts.js'

const SITE_URL = 'https://packstruct.creadev.org'
const DOCS = 'https://docs.creadev.org/packstruct'

function ProfileBadge({ profile }) {
  return <span className={`host-badge host-badge-${profile}`}>{profile}</span>
}

function HostCard({ host }) {
  return (
    <article className="host-card">
      <div className="host-head">
        <h3>{host.name}</h3>
        <ProfileBadge profile={host.profile} />
      </div>
      <p className="host-blurb">{host.blurb}</p>
      <div className="host-stats">
        <span><b>{host.packs}</b> {host.packs === 1 ? 'pack' : 'packs'}</span>
        {host.ids > 0 && <span><b>{host.ids}</b> ids</span>}
        <span><code>packstruct@{host.pin}</code></span>
      </div>
      <div className="host-links">
        {host.site && <a href={host.site} target="_blank" rel="noreferrer">site</a>}
        <a href={host.repo} target="_blank" rel="noreferrer">repo</a>
        <a href={`${DOCS}/packs`} target="_blank" rel="noreferrer">docs</a>
      </div>
    </article>
  )
}

export default function Showcase() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/showcase',
    title: 'Showcase | Packstruct',
    description:
      'The hosts that speak the packstruct grammar: crashtest, poststruct, govstruct, eyestruct, vant, gistory, monoforge, and prestruct - every pack count a receipt from the host\'s own packs/public/ directory.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">The showcase</p>
          <h1>
            One grammar, <span className="accent">many hosts.</span>
          </h1>
          <p className="lede">
            packstruct is only worth anything if real projects load it. They do:
            {' '}<strong>{TOTAL_PACKS} packs</strong> across{' '}
            <strong>{TOTAL_HOSTS} live hosts</strong>, every one linted clean
            through the same <code>packstruct lint --deep</code> lane. Each card
            below is a real repo with a real <code>packs/</code> directory - the
            counts are receipts from its own tree, not a claim on this page.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href="#hosts">See the hosts</a>
            <a className="btn btn-ghost" href="https://github.com/dhaupin/packstruct/blob/main/spec/SPEC.md" target="_blank" rel="noreferrer">Read the spec</a>
            <a className="btn btn-ghost" href="https://www.npmjs.com/package/packstruct" target="_blank" rel="noreferrer">npm package</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 id="hosts">The hosts</h2>
          <p className="sub">
            A host is a repo that ships a <code>packs/</code> directory and
            declares which entry profile it loads. The manifest never forks;
            only the execution semantics do.
          </p>
          <div className="host-grid">
            <article className="host-card host-card-dogfood">
              <div className="host-head">
                <h3>{DOGFOOD.name}</h3>
                <ProfileBadge profile={DOGFOOD.profile} />
              </div>
              <p className="host-blurb">{DOGFOOD.blurb}</p>
              <div className="host-stats">
                <span><b>{DOGFOOD.packs}</b> pack</span>
                <span><b>{DOGFOOD.ids}</b> ids</span>
                <span><code>packstruct@{DOGFOOD.pin}</code></span>
              </div>
              <div className="host-links">
                <a href={DOGFOOD.site} target="_blank" rel="noreferrer">site</a>
                <a href={DOGFOOD.repo} target="_blank" rel="noreferrer">repo</a>
              </div>
            </article>
            {HOSTS.map((host) => <HostCard key={host.id} host={host} />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>The entry profiles</h2>
          <p className="sub">
            Every pack declares what it is for through a profile the host owns.
            One grammar, four declared shapes.
          </p>
          <div className="grid">
            <div className="card">
              <h3><ProfileBadge profile="scenario" /> scenario</h3>
              <p>{PROFILES.scenario.what} Loaded by {['crashtest', 'vant', 'gistory', 'prestruct', 'packstruct'].join(', ')}.</p>
            </div>
            <div className="card">
              <h3><ProfileBadge profile="check" /> check</h3>
              <p>{PROFILES.check.what} Loaded by {['poststruct', 'govstruct', 'eyestruct', 'monoforge'].join(', ')}.</p>
            </div>
            <div className="card">
              <h3><ProfileBadge profile="memory" /> memory</h3>
              <p>{PROFILES.memory.what} Bound to <a href="https://github.com/dhaupin/memstruct" target="_blank" rel="noreferrer">memstruct</a>; engine receipt is vant's store.</p>
            </div>
            <div className="card">
              <h3><ProfileBadge profile="sync" /> sync</h3>
              <p>{PROFILES.sync.what} Bound to <a href="https://github.com/dhaupin/memstruct" target="_blank" rel="noreferrer">memstruct</a>; engine receipt is gistory's merge.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>The rest of the family</h2>
          <p className="sub">
            Engines and rigs that compose with the spec without shipping a
            <code>/packs</code> directory of their own.
          </p>
          <div className="host-grid">
            {FAMILY.map((f) => (
              <article className="host-card" key={f.id}>
                <div className="host-head">
                  <h3>{f.name}</h3>
                  <span className="host-badge host-badge-role">{f.role}</span>
                </div>
                <p className="host-blurb">{f.blurb}</p>
                <div className="host-links">
                  <a href={f.repo} target="_blank" rel="noreferrer">repo</a>
                </div>
              </article>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            <a className="btn btn-ghost" href={`${DOCS}/packs`}>Host onboarding in the docs</a>
          </p>
        </div>
      </section>
    </>
  )
}
