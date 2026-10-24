import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const SITE_URL = 'https://packstruct.creadev.org'

export default function Home() {
  // Hook call lives in the COMPONENT BODY (prestruct's hook updates head tags
  // via its own effect). Calling it inside another effect was an invalid hook
  // call - React #321 in production tore the tree down - see crashtest's note.
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/',
    title: 'Packstruct - one /packs spec, many hosts',
    description: 'The shared packs spec for the struct family: one manifest, entry, and lifecycle contract for crashtest and poststruct packs, plus a zero-dependency lint CLI.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">The shared /packs spec</p>
          <h1>
            One manifest. Many hosts.<br />
            <span className="accent">Refusal instant and nameable.</span>
          </h1>
          <p className="lede">
            packstruct defines how a <code>/packs</code> directory works - manifest,
            entry contract, lifecycle, refusals - so an author who writes one pack
            knows how packs work everywhere. Currently hosted by{' '}
            <a href="https://github.com/dhaupin/crashtest">crashtest</a> (scenario
            profile) and <a href="https://github.com/dhaupin/poststruct">poststruct</a>{' '}
            (check profile).
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/spec">Read the spec</Link>
            <Link className="btn btn-ghost" to="/lint">Lint your pack.json</Link>
            <a className="btn btn-ghost" href="https://docs.creadev.org/packstruct/">Full docs</a>
            <a className="btn btn-ghost" href="https://github.com/dhaupin/packstruct" target="_blank" rel="noreferrer">View on GitHub</a>
          </div>
          <pre className="code"><span className="dim"># the directory contract</span>{'\n'}packs/{'\n'}  public/{'\n'}    &lt;pack-name&gt;/{'\n'}      pack.json      <span className="dim"># REQUIRED: schemaVersion 1, name matches dir, entry exists</span>{'\n'}      &lt;entry&gt;        <span className="dim"># REQUIRED: created by pack.json "entry"</span>{'\n\n'}<span className="ok">ok</span> tg/data-boundary       <span className="dim">v1.0.0 - entry ships, name matches its dir</span>{'\n'}<span className="bad">ERR</span> tg/broken-ref          <span className="dim">entry "index.js" does not exist - instant nameable refusal (crashtest#16)</span></pre>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>What froze at v1</h2>
          <p className="sub">The whole shared surface - tight by design. Full normative text on the <Link to="/spec">spec page</Link>.</p>
          <div className="grid">
            <div className="card"><h3><span className="glyph">section </span>The contract</h3><p><code>packs/public/&lt;name&gt;/</code> carries a frozen <code>pack.json</code> (schemaVersion 1, name matches directory, entry must exist) plus its entry module. A manifest declaring a file that doesn't ship is an instant, nameable refusal - never a deep import stack trace.</p></div>
            <div className="card"><h3><span className="glyph">section </span>The linter</h3><p><code>npx packstruct lint packs/</code> - zero dependencies, kills the missing-entry class at author time, in any fleet repo. Machine-readable with <code>--json</code>.</p></div>
            <div className="card"><h3><span className="glyph">section </span>Profiles</h3><p>The manifest surface never forks; execution semantics are declared as profiles: <strong>scenario</strong> (crashtest: hostile scenarios against a transport, isolated) and <strong>check</strong> (poststruct: pure-reading verifiers over files on disk).</p></div>
            <div className="card"><h3><span className="glyph">section </span>Lifecycle</h3><p>Packs are explicit - a pack runs only because the host's config enumerates it. Pack ids are namespaced by pack slug; every pack ships self-audit fixtures; extra manifest keys are minimum-spec and left alone.</p></div>
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
            <div className="card"><h3>One address for authors</h3><p>"How do I write a pack?" has one answer: read packstruct, pick your app's declared profile. No archaeology in two repos.</p></div>
            <div className="card"><h3>Frozen from reality</h3><p>v1 is what crashtest's eight production packs already ship, verified pack-by-pack: nothing to migrate, poststruct adopts fresh.</p></div>
            <div className="card"><h3>Cheap future consumers</h3><p>Any struct-family tool that wants a <code>/packs</code> dir adopts the spec instead of inventing a third dialect.</p></div>
            <div className="card"><h3>Conformance, not vibes</h3><p>The lint CLI is the first artifact; a conformance harness (<code>packstruct audit-conformance</code>) follows at the 1.0.0 ladder rung.</p></div>
          </div>
        </div>
      </section>
    </>
  )
}
