import usePageMeta from '../hooks/usePageMeta.js'

const SITE_URL = 'https://packstruct.creadev.org'

export default function Spec() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/spec',
    title: 'The spec | Packstruct',
    description: 'The frozen v1 surface: packs/public/<name>/ with pack.json (schemaVersion 1, name matches directory, entry exists, armedByKey optional) plus the declarable scenario/check profiles.',
  })
  return (
    <section className="section" style={{ paddingTop: 56 }}>
      <div className="wrap legal">
        <p className="eyebrow">Normative, frozen at schemaVersion 1</p>
        <h2>The spec</h2>
        <p className="sub">
          The long-form normative text is <a href="https://github.com/dhaupin/packstruct/blob/main/spec/SPEC.md">spec/SPEC.md</a>{' '}
          in the repo (and mirrored at <a href="https://docs.creadev.org/packstruct/">docs.creadev.org/packstruct</a>).
          This page is the readable surface.
        </p>

        <h3>Directories</h3>
        <p>
          Packs live at <code>packs/public/&lt;pack-name&gt;/</code>, carrying a required{' '}
          <code>pack.json</code> plus the entry file it declares. That is the whole surface.
        </p>

        <h3>The manifest, v1</h3>
        <p className="sub">Drawn from what crashtest's eight production packs already ship - verified pack-by-pack, no fleet migration.</p>
        <div className="table-wrap">
          <table className="spec-table">
            <thead>
              <tr><th>Field</th><th>Type</th><th>Rules</th></tr>
            </thead>
            <tbody>
              <tr><td className="mod">schemaVersion</td><td>integer</td><td className="why">MUST be <code>1</code>; bumps are additive-first (v2 adds optional fields; removals are a major bump with a migration note)</td></tr>
              <tr><td className="mod">name</td><td>string</td><td className="why">kebab-case, MUST match its directory - mismatch is a load error, never a silent success</td></tr>
              <tr><td className="mod">description</td><td>string</td><td className="why">one line, human-readable</td></tr>
              <tr><td className="mod">version</td><td>string</td><td className="why">dotted semver-ish MAJOR.MINOR[.PATCH]</td></tr>
              <tr><td className="mod">entry</td><td>string</td><td className="why">relative path inside the pack, MUST exist - declaring a file that doesn't ship is an instant refusal, not a stack trace (crashtest#16)</td></tr>
              <tr><td className="mod">armedByKey</td><td>string?</td><td className="why">OPTIONAL. Present = the host MAY require an arming key before activation. Absent = the host's own lifecycle governs</td></tr>
            </tbody>
          </table>
        </div>
        <p className="field-report">
          Host-owned keys the engine also recognizes (<code>env</code>, <code>plugins</code>,{' '}
          <code>package</code>) are acknowledged by name and never refused - the linter is strict
          against spec norms and only those norms.
        </p>

        <h3>Profiles (declared, not hidden)</h3>
        <ul>
          <li><strong>scenario</strong> - crashtest: default export <code>{'{ register(ctx) }'}</code>, hostile scenarios against a transport, so it requires the host's isolation guarantees (fake transport), and may use the armed-key ceremony</li>
          <li><strong>check</strong> - poststruct: default export <code>{'{ checks: [Check, ...] }'}</code>, declarative pure-reading verifiers over files on disk; no transport, no network by default</li>
        </ul>
        <p className="field-report">A pack declares nothing about profiles - the <em>host</em> declares which profile it loads. The scenario contract links to crashtest's reference rather than copying it (doc drift beats indirection).</p>

        <h3>Lifecycle rules (spec-fixed everywhere)</h3>
        <ul>
          <li><strong>Packs are explicit</strong> - a pack runs only because the host's config enumerates it; no implicit discovery</li>
          <li><strong>Ids are namespaced</strong> by pack slug inside the host's id space; cross-namespace collision at load = refuse to start</li>
          <li><strong>Local-path sources only</strong> in v1; remote/npm sources arrive as an explicit additive spec version, never silently</li>
          <li><strong>Self-audit fixtures ship with every pack</strong> - <code>test/fixtures/</code> proving the pack does what it claims; engines adopt this first, the spec formalizes after</li>
        </ul>
        <p className="field-report">App-owned (declared in the app's README, not the spec): arming ceremony details, execution sandbox, scheduling, output formats.</p>

        <h3>Versioning</h3>
        <p>
          Each app pins the spec version it implements ({'"'}implements{": "}{'"'}packstruct@1{'"'}) in its README.
          Engine changes land as code first; the spec formalizes after - never the reverse.
        </p>

        <p style={{ marginTop: 26 }}>
          <a href="https://github.com/dhaupin/packstruct/blob/main/spec/SPEC.md" className="btn btn-primary" target="_blank" rel="noreferrer">Read SPEC.md</a>
        </p>
      </div>
    </section>
  )
}
