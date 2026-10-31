import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const SITE_URL = 'https://packstruct.creadev.org'
const DOCS = 'https://docs.creadev.org/packstruct'

export default function About() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/about',
    title: 'About | Packstruct',
    description:
      'Who builds packstruct, the struct family it anchors, the spec-frozen-at-v1 governance, and the MIT license and provenance terms.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">about</p>
          <h1>
            The spec the family <span className="accent">agreed on, written down.</span>
          </h1>
          <p className="lede">
            packstruct is the normative arm of the struct family: the one place
            the /packs contract lives, frozen so hosts and authors can trust it.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href="https://github.com/dhaupin/packstruct">See the repo</a>
            <Link className="btn btn-ghost" to="/spec">Read the spec</Link>
            <a className="btn btn-ghost" href={`${DOCS}/`}>Docs</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Who builds it</h2>
          <p className="sub">
            packstruct is built by{' '}
            <a href="https://creadev.org" target="_blank" rel="noopener">Rook @ Creadev.org</a>{' '}
            and by AI agents working in the open. Every change lands through a
            pull request with its gates run, and the repo history keeps the
            receipts.
          </p>
          <p className="sub" style={{ marginTop: 8 }}>
            The spec does not version-bump without a migration note: a major
            change to the frozen v1 surface carries the path from the old shape
            to the new one, so no host is broken by surprise.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>The struct family</h2>
          <p className="sub">
            packstruct anchors the family's pack grammar. The hosts that load
            it are <a href="https://github.com/dhaupin/crashtest">crashtest</a>{' '}
            (scenario profile) and{' '}
            <a href="https://github.com/dhaupin/poststruct">poststruct</a>{' '}
            (check profile), with more queued. The rest of the family:{' '}
            <a href="https://github.com/dhaupin/eyestruct">eyestruct</a>,{' '}
            <a href="https://github.com/dhaupin/govstruct">govstruct</a>, and{' '}
            <a href="https://github.com/dhaupin/monoforge">monoforge</a>.
          </p>
          <p style={{ marginTop: 22 }}>
            <Link to="/packs" className="btn btn-ghost">See the pack catalog</Link>
            <Link to="/status" className="btn btn-ghost">Family status</Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>License and provenance</h2>
          <p className="sub">
            packstruct is MIT-licensed. The spec and the CLI are both open
            source, so the honest summary is: read the code. The{' '}
            <Link to="/terms">terms</Link> and <Link to="/privacy">privacy</Link>{' '}
            pages carry the surface facts in plain language.
          </p>
        </div>
      </section>
    </>
  )
}
