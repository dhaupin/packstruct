import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'
import { issueUrl, ISSUES_URL } from '../issues.js'

const SITE_URL = 'https://packstruct.creadev.org'
const DOCS = 'https://docs.creadev.org/packstruct'
const SPEC = 'https://github.com/dhaupin/packstruct/blob/main/spec/SPEC.md'
const NPM = 'https://www.npmjs.com/package/packstruct'

export default function Enterprise() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/enterprise',
    title: 'Fleet & enterprise | Packstruct',
    description:
      'One grammar across many repos: exact-pin companion receipts, conformance as a CI gate, governance as portable packs, and open-source adoption - all MIT.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">Fleet & enterprise - many repos, one contract</p>
          <h1>
            One pack grammar.<br />
            <span className="accent">Every repo, provably.</span>
          </h1>
          <p className="lede">
            The moment more than one team writes packs, "it loads on my machine"
            stops being good enough. packstruct is built for that scale: the
            spec is frozen and versioned, hosts carry an exact-pin receipt of
            the version they conform to, conformance is a command you can gate
            CI on, and governance itself can be expressed as packs. It is MIT,
            and it stays that way.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href={issueUrl({ template: 'adopt', title: '[adopt] ', body: '**Organization / project:**\n\n**How many repos would carry a /packs dir:**\n\n**What we need from the spec (governance, conformance gate, etc.):**\n' })} target="_blank" rel="noreferrer">Talk to us about adopting</a>
            <Link className="btn btn-ghost" to="/showcase">See who loads it</Link>
            <a className="btn btn-ghost" href={SPEC}>Read SPEC v1</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>What enterprise actually needs</h2>
          <p className="sub">Four properties that separate a hobby spec from one you can build a fleet on.</p>
          <div className="grid">
            <div className="card"><h3><span className="glyph">1</span>Frozen and versioned</h3><p>v1 does not drift. Additive changes keep the schema number; removing or renaming is a major bump that <em>must</em> carry a migration note - old shapes, new shapes, refusal wording (SPEC §11). No host is broken by surprise.</p></div>
            <div className="card"><h3><span className="glyph">2</span>Provable conformance</h3><p>A host does not <em>claim</em> conformance; it runs <code>packstruct audit-conformance</code> and passes. The claim is a command, so it is testable in CI and falsifiable by anyone.</p></div>
            <div className="card"><h3><span className="glyph">3</span>Receipts, not promises</h3><p>Each host carries the packstruct version it conforms to as an <strong>exact devDependency</strong> and a receipt row. Hosts may lag each other; what is forced is the <em>synchronized receipt</em> when a bump happens (SPEC §8).</p></div>
            <div className="card"><h3><span className="glyph">4</span>Governance as packs</h3><p>govstruct proves it: its compliance rules <em>are</em> check packs, so governance ships as a portable <code>/packs</code> surface instead of a wiki nobody re-reads.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>An adoption path that scales</h2>
          <p className="sub">Four steps from "we have a packs folder" to "our whole fleet is gated on one grammar."</p>
          <div className="pipeline">
            <div className="pipe-step"><span className="pipe-n">01</span><strong>Audit what you have</strong><span>Run <code>npx packstruct lint --deep</code> over each repo's <code>packs/</code> dir. You get a nameable list of every manifest that points at nothing, and every id collision.</span></div>
            <div className="pipe-step"><span className="pipe-n">02</span><strong>Pin the spec you adopt</strong><span>Add <code>packstruct</code> as an exact devDependency and a receipt row (version, the sha it was cut against, the lint result, the date). The pin is the promise; the receipt is the proof.</span></div>
            <div className="pipe-step"><span className="pipe-n">03</span><strong>Gate CI on the lanes</strong><span><code>lint</code> and <code>audit-conformance</code> both exit <code>0</code>/<code>1</code>/<code>2</code>. Wire them as a required check: a malformed manifest or a non-conforming loader fails the build by name.</span></div>
            <div className="pipe-step"><span className="pipe-n">04</span><strong>Declare your conformance</strong><span>Carry <code>implements: packstruct@1</code> in your docs, and serve your verdicts with the <code>family-status@1</code> dialect so every member can read every other member honestly.</span></div>
          </div>
          <p className="field-report">
            Every step above is already how the nine live hosts in the{' '}
            <Link to="/showcase">showcase</Link> run - you are adopting a lane
            with receipts, not a proposal.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Open source, and staying that way</h2>
          <p className="sub">
            packstruct is MIT-licensed. The spec, the CLI, and the harness are
            all open, and development happens in the open through pull requests
            with their gates run.
          </p>
          <div className="grid">
            <div className="card"><h3>MIT, no strings</h3><p>Read the code, run the linter, vendor the spec into your own governance. The honest summary of the license is: it is MIT. The <Link to="/terms">terms</Link> and <Link to="/privacy">privacy</Link> pages carry the surface facts in plain language.</p></div>
            <div className="card"><h3>Open development</h3><p>Changes land as pull requests with the battery green. The <a href="https://github.com/dhaupin/packstruct">repository</a> is the source of truth, and <a href={SPEC}>SPEC.md</a> is the normative document - this site is a readable mirror.</p></div>
            <div className="card"><h3>Zero dependencies</h3><p>The CLI ships with no runtime dependencies, so adopting it adds nothing to your supply chain. Published on npm as <a href={NPM}>packstruct</a>.</p></div>
            <div className="card"><h3>Extension is additive</h3><p>Need a new profile or a new host-owned key? The spec has a path for that (§8, §10) that does not fork the manifest - so your extension benefits the whole family instead of splitting it.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Bring us a problem - we will take the issue</h2>
          <p className="sub">
            The fastest way to shape where the spec goes is to file what you
            need. These links open GitHub's own issue composer with the right
            template prefilled - you review and press submit there. Nothing is
            sent from this site.
          </p>
          <div className="grid">
            <div className="card">
              <h3>Adopt packstruct</h3>
              <p>You run a fleet (or one repo) and want to standardize on the grammar. Tell us the shape and we will help map the adoption path.</p>
              <a className="btn btn-ghost" href={issueUrl({ template: 'adopt', title: '[adopt] ', body: '**Organization / project:**\n\n**How many repos would carry a /packs dir:**\n\n**What we need from the spec:**\n' })} target="_blank" rel="noreferrer">File an adoption issue</a>
            </div>
            <div className="card">
              <h3>Register a new host</h3>
              <p>You built an engine that loads packs and want a receipt row and a conformance lane. This is the traveler on-ramp (SPEC §10).</p>
              <a className="btn btn-ghost" href={issueUrl({ template: 'host', title: '[host] ', body: '**Host / engine name:**\n\n**Repo:**\n\n**Which profile it loads (scenario / check / new):**\n\n**Where its packs live:**\n' })} target="_blank" rel="noreferrer">Register a host</a>
            </div>
            <div className="card">
              <h3>Propose a spec change</h3>
              <p>A new optional field, a new host-owned key, or a new profile. Additive proposals are welcome; non-additive ones come with a migration note (SPEC §11).</p>
              <a className="btn btn-ghost" href={issueUrl({ template: 'feature', title: '[spec] ', body: '**The problem:**\n\n**Proposed change (additive?):**\n\n**Which hosts would adopt it:**\n' })} target="_blank" rel="noreferrer">Propose a change</a>
            </div>
            <div className="card">
              <h3>Report a bug</h3>
              <p>The linter, the harness, or the spec text. Paste what you ran and what happened - the repro is the whole value.</p>
              <a className="btn btn-ghost" href={issueUrl({ template: 'bug', title: '[bug] ', body: '**What I ran:**\n\n**What happened:**\n\n**What I expected:**\n\n**packstruct version:**\n' })} target="_blank" rel="noreferrer">File a bug</a>
            </div>
          </div>
          <p className="field-report">
            Prefer to see what is already open? Browse the{' '}
            <a href={ISSUES_URL}>issue tracker</a> first - a good issue is a
            searchable receipt that helps the next adopter.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Where to read more</h2>
          <div className="cta-row">
            <a className="btn btn-primary" href={SPEC}>SPEC v1 (normative)</a>
            <a className="btn btn-ghost" href={`${DOCS}/conformance`}>Conformance harness</a>
            <a className="btn btn-ghost" href={`${DOCS}/status`}>Family status dialect</a>
            <Link className="btn btn-ghost" to="/packs">The pack catalog</Link>
          </div>
        </div>
      </section>
    </>
  )
}
