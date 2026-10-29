import usePageMeta from '../hooks/usePageMeta.js'

const SITE_URL = 'https://packstruct.creadev.org'

export default function Status() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/status',
    title: 'Family status | Packstruct',
    description: 'The family-status@1 dialect: every struct-family member serves its committed-ledger verdicts at /status.json, generated on every web build, and reads the others with the same schema.',
  })
  return (
    <section className="section" style={{ paddingTop: 56 }}>
      <div className="wrap">
        <p className="eyebrow">One schema, four repos</p>
        <h2>Family status</h2>
        <p className="sub">
          packstruct serves its own adversarial verdicts at{' '}
          <code>/status.json</code>, generated on every web build straight from
          the committed ledgers - never hand-edited, so the served numbers can
          never lag the receipts. The page below reads every family member's
          file with the same schema and renders what each one serves, or its
          honest absence.
        </p>

        <pre className="code"><span className="dim"># the dialect (family-status@1)</span>{'\n'}{'{'}{'\n'}  <span className="kw">schema</span>: 1, <span className="kw">contract</span>: <span className="ok">"family-status@1"</span>,{'\n'}  <span className="kw">repo</span>, <span className="kw">site</span>, <span className="kw">docs</span>, <span className="kw">asOf</span>,{'\n'}  <span className="kw">legs</span>:  [{'{'} leg, verdict, cases, counts, ledger {'}'}],{'\n'}  <span className="kw">packs</span>: [{'{'} name, spec, manifest, cases {'}'}]{'\n'}{'}'}</pre>

        <h3 style={{ marginTop: 30 }}>packstruct's own legs</h3>
        <ul>
          <li><strong>crashtest</strong> (<code>labs/crashledger.json</code>) - the dogfood run of the <code>packstruct-lint-shapes</code> pack against the real CLI, plus the harness's generic probe catalog.</li>
          <li><strong>refusal-matrix</strong> (<code>labs/refusal-matrix.packstruct.json</code>) - the self-verifying battery: 18 hostile and spec-allowed shapes, each row's verdict generated from an ACTUAL linter run.</li>
        </ul>

        <h3 style={{ marginTop: 30 }}>The family table</h3>
        <pre-island data-pre-island="family-status">
          <div className="card"><p>Enable JavaScript to read the family's served <code>/status.json</code> files, or fetch them directly at each member's origin.</p></div>
        </pre-island>
      </div>
    </section>
  )
}
