import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'
import { HOSTS, DOGFOOD, TOTAL_HOSTS, TOTAL_PACKS } from '../hosts.js'

const SITE_URL = 'https://packstruct.creadev.org'

export default function Home() {
  // Hook call lives in the COMPONENT BODY (prestruct's hook updates head tags
  // via its own effect). Calling it inside another effect was an invalid hook
  // call - React #321 in production tore the tree down - see crashtest's note.
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/',
    title: 'Packstruct - one /packs spec, many hosts',
    description: 'The shared packs spec: one manifest, entry, and lifecycle contract for a packs/ directory, plus a zero-dependency lint CLI. Written once, loaded by nine hosts.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">The shared /packs spec</p>
          <h1>
            Write one pack.<br />
            <span className="accent">Load it in nine hosts.</span>
          </h1>
          <p className="lede">
            packstruct is a tiny, frozen spec for one directory - a{' '}
            <code>packs/</code> folder full of <code>pack.json</code> manifests
            and the entry modules they name. It is the contract every host in
            the struct family already agrees on, written down once. A bad
            manifest is refused instantly and by name, so a pack that cannot
            load says why before anything runs.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/showcase">See who loads it</Link>
            <Link className="btn btn-ghost" to="/spec">Read the spec</Link>
            <Link className="btn btn-ghost" to="/lint">Lint your pack.json</Link>
            <a className="btn btn-ghost" href="https://docs.creadev.org/packstruct/">Full docs</a>
            <a className="btn btn-ghost" href="https://www.npmjs.com/package/packstruct" target="_blank" rel="noreferrer">npm package</a>
          </div>
          <pre className="code"><span className="dim"># 30 seconds: lint a packs directory against SPEC v1</span>{'\n'}<span className="kw">npx</span> packstruct lint packs/{'\n'}{'\n'}<span className="dim"># the directory contract - the whole surface</span>{'\n'}packs/{'\n'}  public/{'\n'}    &lt;pack-name&gt;/{'\n'}      pack.json      <span className="dim"># REQUIRED: schemaVersion 1, name matches dir, entry exists</span>{'\n'}      &lt;entry&gt;        <span className="dim"># REQUIRED: the file pack.json "entry" names</span>{'\n\n'}<span className="ok">ok</span>  tg/data-boundary       <span className="dim">v1.0.0 - entry ships, name matches its dir</span>{'\n'}<span className="bad">ERR</span> tg/broken-ref          <span className="dim">entry "index.js" does not exist - instant nameable refusal (crashtest#16)</span></pre>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>What is it, in one breath</h2>
          <p className="sub">A spec, a linter, and a conformance harness - nothing else. Three artifacts, one job each.</p>
          <div className="grid">
            <div className="card"><h3><span className="glyph">1</span>The spec</h3><p>A frozen <code>pack.json</code> field table (<code>schemaVersion 1</code>, kebab-case name matching its directory, dotted version, one-line description, an <code>entry</code> that <strong>must exist</strong>, optional <code>armedByKey</code>). One page of normative text, no ambiguity.</p></div>
            <div className="card"><h3><span className="glyph">2</span>The linter</h3><p><code>npx packstruct lint packs/</code> - zero dependencies, exit 0 clean / 1 violations / 2 usage. It kills the missing-entry class at author time, in any repo, before a host ever loads the pack.</p></div>
            <div className="card"><h3><span className="glyph">3</span>The harness</h3><p><code>packstruct audit-conformance</code> materializes bundled case packs and runs <em>your</em> loader over each - so an <code>implements: packstruct@1</code> pin is verifiable, not honorary.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Who loads it</h2>
          <p className="sub">
            {TOTAL_PACKS} packs across {TOTAL_HOSTS} live hosts, every one linted
            clean through the same lane. Crosslinks to each host's repo and site
            live on the <Link to="/showcase">showcase page</Link>.
          </p>
          <div className="host-grid">
            {HOSTS.slice(0, 6).map((host) => (
              <article className="host-card" key={host.id}>
                <div className="host-head">
                  <h3>{host.name}</h3>
                  <span className={`host-badge host-badge-${host.profile}`}>{host.profile}</span>
                </div>
                <p className="host-blurb">{host.blurb}</p>
                <div className="host-stats">
                  <span><b>{host.packs}</b> {host.packs === 1 ? 'pack' : 'packs'}</span>
                  {host.ids > 0 && <span><b>{host.ids}</b> ids</span>}
                </div>
                <div className="host-links">
                  {host.site && <a href={host.site} target="_blank" rel="noreferrer">site</a>}
                  <a href={host.repo} target="_blank" rel="noreferrer">repo</a>
                </div>
              </article>
            ))}
          </div>
          <p style={{ marginTop: 18 }}>
            <Link to="/showcase" className="btn btn-ghost">See all {TOTAL_HOSTS} hosts, including the dogfood pack that attacks the linter</Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>What froze at v1</h2>
          <p className="sub">The whole shared surface - tight by design. Full normative text on the <Link to="/spec">spec page</Link>.</p>
          <div className="grid">
            <div className="card"><h3><span className="glyph">section </span>The contract</h3><p><code>packs/public/&lt;name&gt;/</code> carries a frozen <code>pack.json</code> (schemaVersion 1, name matches directory, entry must exist) plus its entry module. A manifest declaring a file that doesn't ship is an instant, nameable refusal - never a deep import stack trace.</p></div>
            <div className="card"><h3><span className="glyph">section </span>Profiles</h3><p>The manifest surface never forks; execution semantics are declared as profiles: <strong>scenario</strong> (crashtest, vant, gistory, prestruct: hostile scenarios against a transport, isolated) and <strong>check</strong> (poststruct, govstruct, eyestruct, monoforge: pure-reading verifiers over files on disk).</p></div>
            <div className="card"><h3><span className="glyph">section </span>Lifecycle</h3><p>Packs are explicit - a pack runs only because the host's config enumerates it. Pack ids are namespaced by pack slug; every pack ships self-audit fixtures; extra manifest keys are minimum-spec and left alone.</p></div>
            <div className="card"><h3><span className="glyph">section </span>Frozen from reality</h3><p>v1 is what crashtest's production packs already shipped, verified pack-by-pack - nothing to migrate. The spec formalizes what the hosts do; it never re-designs them.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>The pipeline</h2>
          <p className="sub">How a pack goes from directory to loaded, everywhere.</p>
          <div className="pipeline">
            <div className="pipe-step"><span className="pipe-n">01</span><strong>Author the pack</strong><span>a directory under <code>packs/public/</code>, one <code>pack.json</code>, one entry module - any host, same three fields minimum.</span></div>
            <div className="pipe-step"><span className="pipe-n">02</span><strong>Lint it</strong><span><code>npx packstruct lint packs/</code> catches the manifest-points-at-nothing class before any host ever loads it.</span></div>
            <div className="pipe-step"><span className="pipe-n">03</span><strong>Host enumerates</strong><span>no implicit discovery: the pack runs because the host's config names it. Cross-namespace id collision = refuse to start.</span></div>
            <div className="pipe-step"><span className="pipe-n">04</span><strong>Host owns the profile</strong><span>the manifest says nothing about execution; the host's declared profile (scenario or check) owns sandboxing and arming.</span></div>
            <div className="pipe-step"><span className="pipe-n">05</span><strong>Spec evolves additively</strong><span>v2 may add optional fields; removing or renaming is a major bump with a migration note. Engines change first, the spec formalizes after.</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Why one spec</h2>
          <p className="sub">The contract already forked in practice - packstruct names the shared part so drift is declared, not accidental.</p>
          <div className="grid">
            <div className="card"><h3>One address for authors</h3><p>"How do I write a pack?" has one answer: read packstruct, pick your app's declared profile. No archaeology in nine repos.</p></div>
            <div className="card"><h3>Cheap future consumers</h3><p>Any struct-family tool that wants a <code>/packs</code> dir adopts the spec instead of inventing a tenth dialect. govstruct did exactly that.</p></div>
            <div className="card"><h3>Conformance, not vibes</h3><p>The lint CLI is live on npm (<code>packstruct@{DOGFOOD.pin}</code>); the conformance harness ships with it - bundled verdict-claiming packs verify a host loader honors the spec, so the <code>implements: packstruct@1</code> pin is verifiable.</p></div>
            <div className="card"><h3>Receipts, not invention</h3><p>Every host count on this site comes from running the linter over that host's own tree - the <Link to="/showcase">showcase</Link> re-cuts against the fleet, never from memory.</p></div>
          </div>
        </div>
      </section>
    </>
  )
}
