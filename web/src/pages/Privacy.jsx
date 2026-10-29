/**
 * pages/Privacy.jsx - packstruct's privacy statement, in the family's
 * plain-language shape (crashtest + poststruct canon). The tool is
 * local-first: files on disk, no server, no accounts, no telemetry - and
 * this page keeps the same honesty for the site itself. Parity held by
 * scripts/check-legal.cjs.
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const SITE_URL = 'https://packstruct.creadev.org'

export default function Privacy() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/privacy',
    title: 'Privacy | Packstruct',
    description: 'What packstruct and this site collect: the CLI collects nothing, the linter reads only the paths you hand it, and the site tracks nothing hidden.',
  })
  return (
    <section className="section" style={{ paddingTop: 56 }}>
      <div className="wrap legal">
        <p className="eyebrow">The short version first</p>
        <h1>Privacy</h1>
        <p className="sub">
          Web version 2026-10-29 - the long-form lives in the{' '}
          <a href="https://github.com/dhaupin/packstruct">repo</a>. The CLI
          collects <strong>nothing</strong>. It reads only the pack
          paths you hand it on your own disk - your manifests and findings
          never leave your machine. This site keeps its own honesty standard:
          no hidden state, no silent tracking - just docs.
        </p>

        <h3>The packstruct tool</h3>
        <ul>
          <li><strong>No telemetry</strong> - the CLI collects zero data, makes no network calls, phones no home. It reads the directories you point it at, on disk</li>
          <li><strong>Your findings stay yours</strong> - lint reports and JSON output are yours to commit or discard; nothing ships anywhere on its own</li>
          <li><strong>Zero dependencies</strong> - the package ships no runtime dependencies and opens no sockets, so there is no third-party code path to track</li>
          <li><strong>npm install traffic</strong> - npm's own registry logging applies, as with any package; we see none of it</li>
        </ul>

        <h3>The in-browser linter</h3>
        <p>
          The demo validator on the <Link to="/lint">Lint page</Link> runs
          entirely inside your tab. Pasted manifests never leave the browser.
        </p>

        <h3>This website</h3>
        <ul>
          <li><strong>No accounts, no forms, no in-browser state</strong> - information is not collected about you</li>
          <li><strong>Standard hosting logs</strong> - Cloudflare Pages may keep request logs (IP, timestamp); we neither buy, query, nor sell them</li>
          <li><strong>Analytics</strong> - none configured; if a hosting-added beacon is ever enabled by zone policy, it will be listed here rather than hiding</li>
          <li><strong>Cookies</strong> - none set by us; one browser-local preference only: your light/dark theme choice, saved under a localStorage key. It never leaves the browser</li>
        </ul>

        <h3>Third parties, named</h3>
        <p>
          This site runs on{' '}
          <a href="https://pages.cloudflare.com" target="_blank" rel="noopener">Cloudflare Pages</a>; the
          npm package lives on{' '}
          <a href="https://www.npmjs.com" target="_blank" rel="noopener">npmjs.com</a>.
          Their own policies govern their own logging. No other third parties
          are involved.
        </p>

        <h3>Data retention</h3>
        <p>
          Nothing of yours to retain. Your packs, fixtures, and reports stay
          in your repos, not ours.
        </p>

        <h3>Questions</h3>
        <p>
          Open an issue on the{' '}
          <a href="https://github.com/dhaupin/packstruct" target="_blank" rel="noopener">repository</a> -
          it is checked. If you want to inspect rather than ask: the CLI and
          the site are both open source, so treat this page as a summary of
          code you can go read.
        </p>

        <p style={{ marginTop: 26 }}>
          <Link to="/" className="btn btn-ghost">Back to the spec</Link>
        </p>
      </div>
    </section>
  )
}
