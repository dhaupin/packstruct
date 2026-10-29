/**
 * pages/Terms.jsx - packstruct's terms, in the family's plain-language shape
 * (crashtest + poststruct canon: eyebrow, dated web version, surface facts,
 * no theater). Short by design: the MIT license in the repository carries
 * the real legal weight; this page states the surface facts in plain
 * language. Parity held by scripts/check-legal.cjs.
 */
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
        <h1>Terms of Use</h1>
        <p className="sub">Web version 2026-10-29 - the long-form lives in the <a href="https://github.com/dhaupin/packstruct">repo</a>.</p>

        <h3>Use of the site and tool</h3>
        <p>
          packstruct is an open-source tool distributed under the{' '}
          <a href="https://github.com/dhaupin/packstruct/blob/main/LICENSE">MIT license</a>{' '}
          (the family ships MIT; the LICENSE file in the repository is the
          governing text). The spec, linter, docs, and this site are provided
          as is, without warranty of any kind. You run the linter on your own
          repos; you own the decisions it gates and the fixes you apply.
        </p>

        <h3>What it is for</h3>
        <p>
          packstruct validates pack manifests under <code>packs/public/</code>:
          files your own repo carries. It reads the directories you point it
          at and reports what does not match the contract. Point it at trees
          you are entitled to read: your site, your team's site, or a project
          you audit under an agreement with its owner.
        </p>

        <h3>What you own</h3>
        <p>
          Every report the linter emits on your own runs belongs to <strong>you</strong>.
          We see nothing, hold nothing, and collect nothing (see{' '}
          <Link to="/privacy">privacy</Link>).
        </p>

        <h3>Fair use of the site</h3>
        <p>
          This site is documentation. Do not attack it, do not drown it, and
          do not represent yourself as{' '}
          <a href="https://creadev.org" target="_blank" rel="noopener">Creadev</a>{' '}
          unless you are. Site code is MIT like the package.
        </p>

        <h3>Changes</h3>
        <p>
          These terms may be adjusted as the project grows - material changes
          land with a date bump, and the repo history keeps every prior
          version.
        </p>

        <p style={{ marginTop: 26 }}>
          <Link to="/" className="btn btn-ghost">Back to the spec</Link>
        </p>
      </div>
    </section>
  )
}
