import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const SITE_URL = 'https://packstruct.creadev.org'

// notFound identity copied from ssr.config.js (app files must not import the
// engine config - ssrLoadModule would pull it into the app graph).
const notFound = {
  heading: 'Route not on the manifest',
  body: "Like a pack outside the host's config queue, this URL never runs.",
  primaryCta: { label: 'Back to the spec', href: '/' },
}

export default function NotFound() {
  usePageMeta({
    siteUrl: SITE_URL,
    path: '/404',
    title: 'Route not on the manifest | Packstruct',
    description: notFound.body,
  })
  return (
    <section className="nf">
      <div className="wrap">
        <h1>{notFound.heading}</h1>
        <p>{notFound.body}</p>
        <Link to={notFound.primaryCta.href} className="btn btn-primary">{notFound.primaryCta.label}</Link>
      </div>
    </section>
  )
}
