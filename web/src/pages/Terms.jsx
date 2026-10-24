import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const SITE_URL = 'https://packstruct.creadev.org'

export default function Terms() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/terms',
    title: 'Terms of Use | Packstruct',
    description: 'Plain terms: the spec, linter, and docs ship as is under MIT; you run the linter on your own repos and own the decisions it gates.',
  })
  return (
    <section className="section" style={{ paddingTop: 56 }}>
      <div className="wrap legal">
        <p className="eyebrow">Plain language, no theater</p>
        <h2>Terms of Use</h2>
        <p className="sub">Web version 2026-10-24 - the long-form lives in the <a href="https://github.com/dhaupin/packstruct">repo</a>.</p>

        <h3>Use of the site and tool</h3>
        <p>
          packstruct is an open-source tool distributed under the{' '}
          <a href="https://github.com/dhaupin/packstruct/blob/main/LICENSE">MIT license</a>.
          The spec, linter, and docs are provided as is, without warranty of any kind.
          You run the linter on your own repos; you own the decisions it gates and
          the fixes you apply.
        </p>

        <h3>IP</h3>
        <p>
          The packstruct name, spec, and docs are products of{' '}
          <a href="https://creadev.org" target="_blank" rel="noopener">Creadev.org</a>.
          The MIT license governs the code; the site copy is yours to link and
          quote, not to republish wholesale.
        </p>

        <h3>What you own</h3>
        <p>
          Every report the linter emits on your own runs belongs to <strong>you</strong>.
          We see nothing, hold nothing, and collect nothing (see{' '}
          <Link to="/privacy">privacy</Link>).
        </p>

        <h3>Fair use of the site</h3>
        <p>
          This site is documentation. Don't attack it, don't drown it, and don't
          represent yourself as <a href="https://creadev.org" target="_blank" rel="noopener">Creadev</a>{' '}
          unless you are. Site code is MIT like the package.
        </p>

        <h3>Changes</h3>
        <p>
          These terms may be adjusted as the project grows - material changes land
          with a date bump, and the repo history keeps every prior version.
        </p>

        <p style={{ marginTop: 26 }}>
          <Link to="/" className="btn btn-ghost">Back to the spec</Link>
        </p>
      </div>
    </section>
  )
}
