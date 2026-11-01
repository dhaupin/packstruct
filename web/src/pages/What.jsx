import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const SITE_URL = 'https://packstruct.creadev.org'
const DOCS = 'https://docs.creadev.org/packstruct'

export default function What() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/what',
    title: 'What | Packstruct',
    description:
      'One normative spec plus a zero-dependency lint CLI: the pack.json v1 manifest, the scenario and check entry profiles, and a conformance harness that proves a loader honors every case.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">what</p>
          <h1>
            One spec, <span className="accent">a lint CLI, a harness.</span>
          </h1>
          <p className="lede">
            packstruct is two artifacts: the normative SPEC that defines a
            <code>/packs</code> directory, and a zero-dependency CLI that
            checks a manifest against it.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/spec">The v1 spec</Link>
            <Link className="btn btn-ghost" to="/lint">Lint a pack.json</Link>
            <Link className="btn btn-ghost" to="/packs">The pack catalog</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>The manifest (pack.json, v1)</h2>
          <p className="sub">
            A pack is a directory under <code>packs/public/&lt;name&gt;/</code>{' '}
            carrying a frozen <code>pack.json</code>: <code>schemaVersion: 1</code>,
            a kebab-case <code>name</code> matching its directory, a dotted{' '}
            <code>version</code>, a one-line <code>description</code>, a
            relative <code>entry</code> that must exist, and an optional{' '}
            <code>armedByKey</code>. Every field is checked, and every refusal
            names the field it refused.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>The profiles</h2>
          <p className="sub">
            A pack declares what it is for through a profile. The{' '}
            <strong>scenario</strong> profile is what crashtest loads: a module
            that returns attack verdicts. The <strong>check</strong> profile is
            what poststruct loads: a module that returns pass/fail findings.
            One grammar, two declared shapes, so a host knows what a pack will
            do before it runs it.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>The CLI and the conformance harness</h2>
          <p className="sub">
            The linter walks a <code>/packs</code> directory and refuses a
            malformed manifest with a field-named message. The conformance
            harness goes further: it proves a loader honors every case in the
            spec, so a host cannot claim conformance it does not have.
          </p>
          <pre className="code"><span className="cm"># lint a /packs dir against SPEC v1</span>{'\n'}<span className="k">npx</span> packstruct lint packs --deep{'\n'}{'\n'}<span className="cm"># prove a host loader honors every spec case</span>{'\n'}<span className="k">npx</span> packstruct audit-conformance . --loader "node loader.mjs {'{packs}'}"</pre>
          <p style={{ marginTop: 22 }}>
            <Link to="/about" className="btn btn-ghost">Next: about the project</Link>
            <a className="btn btn-ghost" href={`${DOCS}/conformance`}>Conformance harness docs</a>
          </p>
        </div>
      </section>
    </>
  )
}
