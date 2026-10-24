import usePageMeta from '../hooks/usePageMeta.js'

const SITE_URL = 'https://packstruct.creadev.org'

export default function Lint() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/lint',
    title: 'Lint CLI | Packstruct',
    description: 'npx packstruct lint packs/ - zero dependencies, kills the manifest-points-at-missing-entry class (crashtest#16) at author time, in any fleet repo. Try it in the browser right here.',
  })
  return (
    <section className="section" style={{ paddingTop: 56 }}>
      <div className="wrap">
        <p className="eyebrow">Zero dependencies, exit-code contract</p>
        <h2>The lint CLI</h2>
        <p className="sub">
          Kills the whole class crashtest filed upstream (#16: scaffolded manifests
          pointing at entries that don't exist) at author time, in any fleet repo,
          with one command.
        </p>

        <pre className="code"><span className="dim"># human, exit 0 clean / 1 violations / 2 usage</span>{'\n'}npx packstruct lint packs/{'\n\n'}<span className="dim"># machine-readable: {'{schema, packsChecked, violations}'}</span>{'\n'}npx packstruct lint packs/ <span className="kw">--json</span>{'\n\n'}<span className="dim"># what the linter validates (SPEC v1, nothing more):</span>{'\n'}<span className="ok">.  </span> schemaVersion === 1{'\n'}<span className="ok">.  </span> kebab-case name that matches its directory{'\n'}<span className="ok">.  </span> dotted MAJOR.MINOR[.PATCH] version, non-empty description{'\n'}<span className="ok">.  </span> relative entry path that physically exists (the #16 class){'\n'}<span className="ok">.  </span> armedByKey, when present, a string (empty = present-but-not-armed)</pre>

        <h2 style={{ marginTop: 34 }}>Try it now, in the browser</h2>
        <p className="sub">
          Island below runs the same SPEC v1 rules entirely client-side - your
          manifest never leaves the tab. It validates the JSON shape only (the
          CLI additionally checks that the entry file actually ships on disk,
          the part browsers can't see).
        </p>
        <pre-island data-pre-island="lint-demo">
          <div className="card"><p><a href="https://github.com/dhaupin/packstruct/blob/main/bin/cli.mjs" target="_blank" rel="noreferrer">Enable JavaScript</a> to use the in-browser linter, or run <code>npx packstruct lint packs/</code>.</p></div>
        </pre-island>
      </div>
    </section>
  )
}
