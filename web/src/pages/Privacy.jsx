import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const SITE_URL = 'https://packstruct.creadev.org'

export default function Privacy() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/privacy',
    title: 'Privacy | Packstruct',
    description: 'The site ships no analytics, no cookies, no trackers. The CLI reads only the paths you hand it and writes nothing outside its process.',
  })
  return (
    <section className="section" style={{ paddingTop: 56 }}>
      <div className="wrap legal">
        <p className="eyebrow">Nothing collected, by construction</p>
        <h2>Privacy</h2>
        <p className="sub">Web version 2026-10-24.</p>

        <h3>The site</h3>
        <p>
          This is a prerendered static site. It ships no analytics, no cookies, no
          trackers, no forms. Your visit is yours.
        </p>

        <h3>The tool</h3>
        <p>
          <code>packstruct lint</code> reads only the paths you hand it under{' '}
          <code>packs/</code> and writes nothing outside its process. No telemetry,
          no network calls, no phone-home - the CLI is zero-dependency and offline
          by construction.
        </p>

        <h3>The in-browser linter</h3>
        <p>
          The demo validator on the <Link to="/lint">Lint page</Link> runs entirely
          inside your tab. Pasted manifests never leave the browser.
        </p>

        <h3>Contact</h3>
        <p>Questions: hello [at] creadev [dot] org.</p>

        <p style={{ marginTop: 26 }}>
          <Link to="/" className="btn btn-ghost">Back to the spec</Link>
        </p>
      </div>
    </section>
  )
}
