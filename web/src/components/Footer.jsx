import { Link } from 'react-router-dom'
import { NAV_ITEMS, FOOTER_EXTRAS } from './navItems.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <span>📦 packstruct - the shared /packs spec · part of the struct family</span>
        {NAV_ITEMS
          .filter(i => ['Docs', 'GitHub'].includes(i.label))
          .map(i => (
            <a key={i.label} href={i.href} target="_blank" rel="noreferrer">{i.label}</a>
          ))}
        {FOOTER_EXTRAS.map(i => (
          i.href.startsWith('/')
            ? <Link key={i.label} to={i.href}>{i.label}</Link>
            : <a key={i.label} href={i.href} target="_blank" rel="noreferrer">{i.label}</a>
        ))}
        <span>© 2026 <a href="https://creadev.org" target="_blank" rel="noopener" className="madeby">Creadev.org</a></span>
      </div>
    </footer>
  )
}
