import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const SITE_URL = 'https://packstruct.creadev.org'
const DOCS = 'https://docs.creadev.org/packstruct'
const RAW = 'https://github.com/dhaupin/packstruct/blob/main'

export default function Packs() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/packs',
    title: 'Packs | Packstruct',
    description:
      'The live pack catalog: the packstruct-lint-shapes dogfood pack and the family hosts that load the spec - crashtest (scenario), poststruct, eyestruct, govstruct (check), and monoforge (queued per the rule of three).',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">The live catalog</p>
          <h1>
            One <code>/packs</code> dir, <span className="accent">every host.</span>
          </h1>
          <p className="lede">
            A pack is a directory under <code>packs/public/&lt;name&gt;/</code>
            carrying a frozen <code>pack.json</code> and the entry it names.
            This page is the catalog of what actually ships: the dogfood pack
            that attacks the linter, and the family hosts that load the same
            SPEC v1 grammar.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/spec">Read the spec</Link>
            <Link className="btn btn-ghost" to="/lint">Lint a pack.json</Link>
            <a className="btn btn-ghost" href={`${DOCS}/conformance`}>Conformance harness</a>
            <a className="btn btn-ghost" href="https://github.com/dhaupin/packstruct">GitHub</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>What ships in packs/public/</h2>
          <p className="sub">
            packstruct carries one pack of its own, and it attacks the linter
            itself. Four attacks, one contract each - a new EXPLOITED or a
            regression of any recorded verdict fails CI.
          </p>
          <div className="table-wrap">
            <table className="spec-table">
              <thead>
                <tr><th>attack</th><th>profile</th><th>what it proves</th></tr>
              </thead>
              <tbody>
                <tr><td className="mod">hostile-manifest-fuzz</td><td>scenario</td><td className="why">every malformed <code>pack.json</code> answers in-bounds: parseable verdict JSON, violations carried with <code>{'{pack,norm,message}'}</code>, exit 0/1 - never 5xx, never a deep stack trace</td></tr>
                <tr><td className="mod">entry-path-containment</td><td>scenario</td><td className="why">entry values escaping the pack dir (traversal, absolute, file URL, null byte) are flagged by the entry norm - an outside file that happens to exist never silences the refusal</td></tr>
                <tr><td className="mod">over-strict-drift-canary</td><td>scenario</td><td className="why">spec-allowed shapes (extra manifest keys, empty <code>armedByKey</code>) are never over-strictly flagged - the linter is STRICT only against spec norms</td></tr>
                <tr><td className="mod">clean-pack-canary</td><td>scenario</td><td className="why">the happy path stays clean: a well-formed pack lints exit 0, so a green run is earned, not assumed</td></tr>
              </tbody>
            </table>
          </div>
          <p className="sub">
            The manifest grammar itself - <code>schemaVersion</code>, name,
            description, version, entry, <code>armedByKey</code> - is on the
            <Link to="/spec"> spec page</Link>; the dogfood source lives at
            <a href={`${RAW}/packs/public/packstruct-lint-shapes/index.js`}> packs/public/packstruct-lint-shapes/</a>.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>The family hosts</h2>
          <p className="sub">
            One manifest surface, two execution profiles. A host declares which
            profile it loads; the manifest never forks. Every host below lints
            its packs through the same <code>packstruct lint --deep</code>.
          </p>
          <div className="table-wrap">
            <table className="spec-table">
              <thead>
                <tr><th>host</th><th>profile</th><th>packs it loads</th></tr>
              </thead>
              <tbody>
                <tr><td className="mod">crashtest</td><td>scenario</td><td className="why">hostile scenarios against a transport, isolated; the dogfood double every member's <code>crashtest.config.js</code> drives</td></tr>
                <tr><td className="mod">poststruct</td><td>check</td><td className="why">pure-reading verifiers over files on disk: the eleven baked-site shape packs plus <code>eyes-reference</code></td></tr>
                <tr><td className="mod">eyestruct</td><td>check</td><td className="why">the capture and canon lanes (<code>eye-shapes</code>, <code>eye-text-leg</code>, <code>eye-ci-gate</code>), conformance-checked through packstruct 1.0.0</td></tr>
                <tr><td className="mod">govstruct</td><td>check</td><td className="why">the source-consistency profile: ten check packs over its own tree, plus a hostile member-block lane over <code>govstruct lint</code></td></tr>
                <tr><td className="mod">monoforge</td><td>queued</td><td className="why">none yet, per the factory's rule of three - a pack lands when a second real provider or a first real client pack appears</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Running a packdir</h2>
          <p className="sub">
            The linter validates the manifest grammar once, at author time and
            at load. The conformance harness verifies a host's loader honors
            the spec, so the <code>implements: packstruct@1</code> pin is
            verifiable, not honorary.
          </p>
          <pre className="code"><span className="dim"># manifest + entry + id-census grammar</span>{'\n'}<span className="kw">npx</span> packstruct lint packs/ <span className="kw">--deep</span>{'\n\n'}<span className="dim"># machine-readable verdict</span>{'\n'}<span className="kw">npx</span> packstruct lint packs/ <span className="kw">--json</span>{'\n\n'}<span className="dim"># verify a host loader honors the spec</span>{'\n'}<span className="kw">npx</span> packstruct audit-conformance .</pre>
          <p className="field-report">
            <code>packstruct@1.0.0</code> is on npm; the in-tree release is
            <code> 1.1.0</code>. The conformance harness ships with it, and the
            dogfood pack above is the proof-of-work.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href="https://www.npmjs.com/package/packstruct" target="_blank" rel="noreferrer">npm package</a>
            <Link className="btn btn-ghost" to="/status">See the family verdicts</Link>
            <a className="btn btn-ghost" href={`${DOCS}/conformance`}>Conformance docs</a>
          </div>
        </div>
      </section>
    </>
  )
}
