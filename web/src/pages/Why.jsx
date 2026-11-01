import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const SITE_URL = 'https://packstruct.creadev.org'
const DOCS = 'https://docs.creadev.org/packstruct'

export default function Why() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/why',
    title: 'Why | Packstruct',
    description:
      'Many hosts, one pack grammar. Why a shared /packs spec exists: so an author who writes one pack knows how packs work everywhere, and a bad manifest is refused instantly and by name.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">why</p>
          <h1>
            Many hosts, <span className="accent">one pack grammar.</span>
          </h1>
          <p className="lede">
            Every host that loads packs can invent its own manifest shape. When
            they do, an author learns one host's rules and guesses at the next
            host's, and the guess is where packs break.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/what">What packstruct is</Link>
            <Link className="btn btn-ghost" to="/spec">Read the spec</Link>
            <Link className="btn btn-ghost" to="/packs">See the catalog</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>The problem: a pack shape per host</h2>
          <p className="sub">
            crashtest loads scenario packs; poststruct loads check packs; more
            hosts are queued. If each one defines its own manifest fields, its
            own entry rules, and its own refusals, then "a pack" means nothing
            portable. The same directory loads here and fails there, and the
            failure is a stack trace instead of a sentence.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>The thesis: frozen manifest, nameable refusal</h2>
          <p className="sub">
            packstruct is the spec that hosts already agreed on, written down
            and frozen at schema version 1. One manifest, one entry contract,
            one lifecycle. The law is two sentences long: the manifest is
            frozen, and a refusal is instant and nameable. A pack that cannot
            load says why, by field name, before anything runs.
          </p>
          <p className="sub" style={{ marginTop: 8 }}>
            The spec is a picture of what the hosts already do - crashtest's
            production manifest fields, verified against real packs - not a
            re-design of them. That is why adopting it costs a host nothing and
            buys every author a portable pack.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Who it is for</h2>
          <p className="sub">
            Pack authors who want to write once and load anywhere; host
            maintainers who want a validation contract instead of ad-hoc
            parsing; and CI that has to refuse a malformed manifest before it
            reaches a runner.
          </p>
          <p style={{ marginTop: 22 }}>
            <Link to="/what" className="btn btn-ghost">Next: what packstruct is</Link>
            <a className="btn btn-ghost" href={`${DOCS}/`}>Read the docs</a>
          </p>
        </div>
      </section>
    </>
  )
}
