import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'
import { issueUrl } from '../issues.js'

const SITE_URL = 'https://packstruct.creadev.org'
const DOCS = 'https://docs.creadev.org/packstruct'

export default function Start() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/start',
    title: 'Start here | Packstruct',
    description:
      'New to packstruct? In five minutes: what a pack is, the one command that checks it, and how to write your first pack.json - no prior knowledge needed.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">Start here - no prior knowledge assumed</p>
          <h1>
            A pack is a folder.<br />
            <span className="accent">This is the rulebook for it.</span>
          </h1>
          <p className="lede">
            If you have ever dropped a folder of files into a project and hoped
            it would get picked up, you already understand the problem
            packstruct solves. It is one small written rule for what that folder
            must contain, so every tool agrees - and one command that tells you
            if you got it right, before anything runs.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href="#first-pack">Write your first pack</a>
            <Link className="btn btn-ghost" to="/lint">Check one in the browser</Link>
            <Link className="btn btn-ghost" to="/why">Why this exists</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>What is a "pack", really?</h2>
          <p className="sub">Three plain ideas, no jargon. Everything else on this site is detail on top of these.</p>
          <div className="grid">
            <div className="card"><h3><span className="glyph">1</span>A folder with a label</h3><p>A pack is just a directory - <code>packs/public/my-thing/</code>. Inside it sits one small file named <code>pack.json</code> that describes the folder: what it is called, a one-line description, and which file inside is the one that "starts" it. That is the whole idea.</p></div>
            <div className="card"><h3><span className="glyph">2</span>A host that reads it</h3><p>Something has to notice your folder. That something is a "host" - a program that keeps a list of which packs it loads. Your folder does not run by itself; the host runs it because its list names it. No magic discovery, no surprises.</p></div>
            <div className="card"><h3><span className="glyph">3</span>A check that says yes or no</h3><p>Before a host ever touches your folder, one command reads <code>pack.json</code> and tells you if it is correct - in plain words, naming the exact problem. If it says <code>ok</code>, you are done. If it complains, it tells you which field and why.</p></div>
          </div>
        </div>
      </section>

      <section className="section" id="first-pack">
        <div className="wrap">
          <h2>Your first pack, step by step</h2>
          <p className="sub">Copy this, change the names, run one command. That is the entire beginner path.</p>
          <pre className="code"><span className="dim"># 1. make the folder and its one required file</span>{'\n'}mkdir -p packs/public/hello-pack{'\n'}{'\n'}<span className="dim"># 2. describe it - this is the whole contract</span>{'\n'}packs/public/hello-pack/pack.json{'\n'}{'{'}{'\n'}  <span className="kw">"schemaVersion"</span>: 1,{'\n'}  <span className="kw">"name"</span>:          <span className="ok">"hello-pack"</span>,   <span className="dim"># must match the folder name</span>{'\n'}  <span className="kw">"description"</span>:   <span className="ok">"My first pack"</span>, <span className="dim"># one short line</span>{'\n'}  <span className="kw">"version"</span>:       <span className="ok">"1.0.0"</span>,{'\n'}  <span className="kw">"entry"</span>:         <span className="ok">"index.js"</span>     <span className="dim"># the file that starts it (must exist)</span>{'\n'}{'}'}{'\n'}{'\n'}<span className="dim"># 3. the entry file the line above names</span>{'\n'}packs/public/hello-pack/index.js{'\n'}{'\n'}<span className="dim"># 4. check it. exit 0 means you are done.</span>{'\n'}<span className="kw">npx</span> packstruct lint packs/</pre>
          <div className="callout">
            <p><strong>Four fields do the work:</strong> <code>schemaVersion</code> (always <code>1</code>), <code>name</code> (must equal the folder name), <code>description</code> (a human sentence), and <code>entry</code> (a real file in the folder). There is a fifth, <code>armedByKey</code>, you can ignore until much later.</p>
          </div>
          <p className="sub">
            Prefer to click instead of type? The <Link to="/lint">browser linter</Link>{' '}
            checks a pasted <code>pack.json</code> against the same rules, right
            in this tab - your file never leaves the page.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>What the check actually catches</h2>
          <p className="sub">The one mistake that used to cost hours, now caught in a second - before any code runs.</p>
          <div className="table-wrap">
            <table className="spec-table">
              <thead>
                <tr><th>If you get this wrong</th><th>What you see</th></tr>
              </thead>
              <tbody>
                <tr><td className="mod">entry names a file that is not there</td><td className="why">A named refusal: "entry &quot;index.js&quot; does not exist". Not a deep stack trace three screens into a program you did not write.</td></tr>
                <tr><td className="mod">name does not match the folder</td><td className="why">A refusal that names both values, so you fix it in one keystroke.</td></tr>
                <tr><td className="mod">schemaVersion is missing or wrong</td><td className="why">A refusal that says the version must be <code>1</code>.</td></tr>
                <tr><td className="mod">it is all correct</td><td className="why"><span className="ok">ok</span> and exit code <code>0</code>. Silence is success; you move on.</td></tr>
              </tbody>
            </table>
          </div>
          <p className="field-report">
            That first row is the whole reason the spec exists. It is the mistake
            crashtest filed as issue #16, and it is the class packstruct makes
            impossible to ship by accident.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Where to go next</h2>
          <p className="sub">Pick the door that matches you. Each one assumes only what it says it does.</p>
          <div className="grid">
            <div className="card"><h3>Just checking a pack</h3><p>You are done. Run <code>npx packstruct lint packs/</code> in any project with a <code>packs/</code> folder. Read the <Link to="/lint">linter page</Link> for the flags.</p></div>
            <div className="card"><h3>Building on it</h3><p>Want to write a pack that a host will run, or point a host at your own packs? Go to <Link to="/extend">extend</Link> - it assumes you know the basics above and nothing more.</p></div>
            <div className="card"><h3>Running a whole fleet</h3><p>Need one grammar across many repos, with conformance proof and governance? Go to <Link to="/enterprise">enterprise</Link>.</p></div>
            <div className="card"><h3>Reading the letter of the law</h3><p>The <Link to="/spec">spec page</Link> is the normative text, and <a href={`${DOCS}/`}>the docs</a> carry the long form. Both are here when you need the exact rule.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Stuck? That is a bug in the docs.</h2>
          <p className="sub">
            If a step above did not work, or a word was not defined, tell us -
            it is the fastest way to make this page better for the next person.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href={issueUrl({ template: 'bug', title: '[docs] ', body: '**What I was trying to do:**\n\n**What happened:**\n\n**What I expected:**\n\n**The step on the Start page that tripped me:**\n' })} target="_blank" rel="noreferrer">Report a docs problem</a>
            <Link className="btn btn-ghost" to="/extend">Next: extending packstruct</Link>
            <a className="btn btn-ghost" href={`${DOCS}/`}>Read the full docs</a>
          </div>
        </div>
      </section>
    </>
  )
}
