import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'
import { issueUrl } from '../issues.js'

const SITE_URL = 'https://packstruct.creadev.org'
const DOCS = 'https://docs.creadev.org/packstruct'
const SPEC = 'https://github.com/dhaupin/packstruct/blob/main/spec/SPEC.md'

export default function Extend() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/extend',
    title: 'Extend | Packstruct',
    description:
      'For builders: write a pack a host will run, point a host at your own packs, add a new host profile, and prove it with --deep lint and the conformance harness.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">Extend - you know the basics, now build on them</p>
          <h1>
            Write a pack.<br />
            <span className="accent">Point a host at it.</span>
          </h1>
          <p className="lede">
            Once you can write a valid <code>pack.json</code>, the next step is
            making it <em>do</em> something - and making a host actually load
            it. This page is the hobbyist path: the two entry profiles, the
            deeper check that imports your entry, and the conformance harness
            that proves a loader honors the spec. Everything here is grounded in{' '}
            <a href={SPEC}>SPEC v1</a>; nothing is invented.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/spec">The normative spec</Link>
            <Link className="btn btn-ghost" to="/packs">See real packs</Link>
            <a className="btn btn-ghost" href={`${DOCS}/profiles`}>Profile reference</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Step 1 - pick a profile</h2>
          <p className="sub">
            A pack's entry is an ES module with a default export. What that
            default export <em>is</em> depends on the profile the <strong>host</strong>{' '}
            declares - a pack never changes its own semantics based on who loads
            it. Two profiles ship today.
          </p>
          <div className="grid">
            <div className="card">
              <h3><span className="glyph">◆</span>scenario - attack the transport</h3>
              <p>Default export carries <code>name</code>, <code>description</code>, and an <code>attacks[]</code> array (kebab-case names, each with a <code>run</code> function or a <code>steps</code> chain). Hostile scenarios run against a transport; the host provides isolation (a fake transport, opt-out postures) and may use the <code>armedByKey</code> ceremony. Loaded by crashtest, vant, gistory, prestruct.</p>
              <a className="learn-more" href={`${DOCS}/profiles`}>Profile: scenario →</a>
            </div>
            <div className="card">
              <h3><span className="glyph">◆</span>check - read files on disk</h3>
              <p>Default export is <code>{'{ checks: [Check] }'}</code> - declarative, pure-reading verifiers over files. No transport, no network by default. Arming is just config enumeration: being listed in the host's <code>packs:</code> config <em>is</em> the arm. Loaded by poststruct, govstruct, eyestruct, monoforge.</p>
              <a className="learn-more" href={`${DOCS}/profiles`}>Profile: check →</a>
            </div>
          </div>
          <p className="field-report">
            The module-shape contract is host-owned in full - the profile page
            links to the host's reference rather than copying it, because doc
            drift is worse than indirection (SPEC §3).
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Step 2 - check it deeper</h2>
          <p className="sub">
            The shallow lint checks the manifest. <code>--deep</code> goes
            further: it imports each declared entry in an isolated child and
            censuses the ids, so the spec's own load-time refusals surface at
            author time instead of at load.
          </p>
          <pre className="code"><span className="dim"># shallow: manifest + directory contract</span>{'\n'}<span className="kw">npx</span> packstruct lint packs/{'\n\n'}<span className="dim"># deep: + import each entry in a child, census ids</span>{'\n'}<span className="kw">npx</span> packstruct lint packs/ <span className="kw">--deep</span>{'\n\n'}<span className="dim"># refuse id collisions against a host library</span>{'\n'}<span className="kw">npx</span> packstruct lint packs/ <span className="kw">--deep</span> --against ./host-lib.mjs</pre>
          <div className="table-wrap">
            <table className="spec-table">
              <thead>
                <tr><th>What --deep adds</th><th>Refusal it names</th></tr>
              </thead>
              <tbody>
                <tr><td className="mod">entry fails to import, or has no default export</td><td className="why"><code>entry-import</code> / <code>entry-default-export</code></td></tr>
                <tr><td className="mod">duplicate id within one pack</td><td className="why"><code>id-duplicate</code></td></tr>
                <tr><td className="mod">id collides across packs</td><td className="why"><code>id-collision</code></td></tr>
                <tr><td className="mod">id collides with the host's library</td><td className="why"><code>id-library-collision</code></td></tr>
              </tbody>
            </table>
          </div>
          <p className="field-report">
            A hostile entry is killed on a timeout or an output cap and refused
            nameably - it is never run in the linter's own process. These are the
            spec's own load-time refusals surfaced early, never new norms
            (SPEC §7).
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Step 3 - prove a loader honors the spec</h2>
          <p className="sub">
            Writing packs is one half. The other half is a host that loads them
            correctly - and "correctly" should be provable, not asserted. The
            conformance harness materializes bundled case packs and runs{' '}
            <em>your</em> loader over each.
          </p>
          <pre className="code"><span className="dim"># {`{packs}`} = the materialized case pack's directory path</span>{'\n'}<span className="kw">npx</span> packstruct audit-conformance . --loader "node loader.mjs {'{packs}'}"</pre>
          <div className="grid">
            <div className="card"><h3>What the harness checks</h3><p>A conforming loader exits <code>0</code> on the clean bundle and exits non-zero <em>and names the offending pack</em> on every violation bundle. Bundled cases cover each §5 refusal norm, a name-collision pair, and an <code>env-claims</code> accept case.</p></div>
            <div className="card"><h3>The loader contract</h3><p><code>{'{packs}'}</code> substitutes the case pack's directory path. The loader runs with CWD = the audited repo root, <strong>no network</strong>, and no implicit host config. A loader that times out or crashes is a failure, never a pass.</p></div>
            <div className="card"><h3>The claims lane</h3><p><code>--claims</code> additionally requires the loader to echo a pack's declared <code>env</code> block on one stdout line - so a loader that silently ignores claims is named, not passed (packstruct#71).</p></div>
          </div>
          <p className="field-report">
            Exit ladder, same as lint: <code>0</code> all cases honored /{' '}
            <code>1</code> any case failed / <code>2</code> usage.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Step 4 - add a new host (a "traveler")</h2>
          <p className="sub">
            Building a whole new engine that loads packs? You join the grammar by
            answering three questions the spec already structures - never by
            forking the manifest (SPEC §10).
          </p>
          <div className="pipeline">
            <div className="pipe-step"><span className="pipe-n">01</span><strong>What does the manifest see?</strong><span>The frozen v1 field table plus the host-owned acknowledged keys (<code>env</code>, <code>plugins</code>, <code>package</code>, <code>implements</code>). Nothing to fork or re-declare.</span></div>
            <div className="pipe-step"><span className="pipe-n">02</span><strong>What does the lint see?</strong><span>The same <code>packstruct lint</code> and <code>audit-conformance</code> lanes. A new profile only extends the <em>cases</em> reported, never the manifest grammar.</span></div>
            <div className="pipe-step"><span className="pipe-n">03</span><strong>What does "run" mean?</strong><span>The only new thing you own: a profile row (your execution semantics), an engine receipt per adopted behavior, and cases in <code>audit-conformance</code> keyed to your profile id.</span></div>
          </div>
          <p className="field-report">
            A traveler inherits the standing refusals unchanged: no remote packs,
            no runs inside lint, no <code>schemaVersion</code> bump for additive
            rows, and exact-pin companion receipts.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>House rules that keep packs honest</h2>
          <p className="sub">Four norms every pack and host follows. They are lifecycle rules, not manifest fields - so the schema never moves for them.</p>
          <div className="grid">
            <div className="card"><h3>Self-audit fixtures</h3><p>Every pack ships <code>test/fixtures/</code> proving its contents do what they claim. A pack whose fixtures fail fails its own CI, host-first.</p></div>
            <div className="card"><h3>Pack version is the pack's own</h3><p>A <code>pack.json</code> <code>version</code> bumps only when that pack's surface changes - never when the linter or a consumer ships. Frozen packs stay frozen.</p></div>
            <div className="card"><h3>Explicit loads only</h3><p>A pack runs because the host's config names it. No remote or npm packs in v1, no auto-download - adding that would need an explicit spec bump.</p></div>
            <div className="card"><h3>Interop through the front door</h3><p>If your pack needs a sibling tool, go through that tool's public CLI - never by importing its internals or guessing a path when an <code>npx</code> resolution exists (SPEC §8).</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Building something with it?</h2>
          <p className="sub">
            Two things help most: tell us your use case (so the spec does not
            grow in the wrong direction), and file the rough edges you hit.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href={issueUrl({ template: 'feature', title: '[build] ', body: '**What I am building:**\n\n**Which profile I am using (scenario / check / a new one):**\n\n**Where the spec helped, and where it got in the way:**\n' })} target="_blank" rel="noreferrer">Propose a use case</a>
            <a className="btn btn-ghost" href={issueUrl({ template: 'bug', title: '[build] ', body: '**What I ran:**\n\n**What happened:**\n\n**What I expected:**\n\n**packstruct version (`npx packstruct --version`):**\n' })} target="_blank" rel="noreferrer">Report a rough edge</a>
            <Link className="btn btn-ghost" to="/enterprise">Next: fleet & enterprise</Link>
          </div>
        </div>
      </section>
    </>
  )
}
