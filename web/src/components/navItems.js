/**
 * The site's nav vocabulary - ONE list that the header, the burger sidebar,
 * and the footer all render from. Group semantics:
 * 'site' = internal route (NavLink-active), 'out' = external surface.
 *
 * npm joined the surface list the day packstruct@0.9.0 landed on the
 * registry (honesty over aspiration - the link exists because the package
 * exists; it never arrived early).
 */
export const NAV_ITEMS = [
  // primary app routes. `header: false` keeps an item out of the inline
  // desktop header (which has a fixed 960px wrap) while leaving it in the
  // burger sidebar at every viewport, the footer, and page crosslinks - so
  // the header never overflows and nothing becomes unreachable.
  { label: 'Home', to: '/', end: true, group: 'site' },
  { label: 'Start', to: '/start', group: 'site' },
  { label: 'Why', to: '/why', group: 'site' },
  { label: 'What', to: '/what', group: 'site' },
  { label: 'Extend', to: '/extend', group: 'site', header: false },
  { label: 'Enterprise', to: '/enterprise', group: 'site', header: false },
  { label: 'About', to: '/about', group: 'site', header: false },
  { label: 'Packs', to: '/packs', group: 'site' },
  { label: 'Spec', to: '/spec', group: 'site' },
  { label: 'Lint', to: '/lint', group: 'site' },
  { label: 'Showcase', to: '/showcase', group: 'site' },
  // outbound surfaces
  { label: 'Docs', href: 'https://docs.creadev.org/packstruct/', group: 'out' },
  { label: 'GitHub', href: 'https://github.com/dhaupin/packstruct', group: 'out' },
  { label: 'npm', href: 'https://www.npmjs.com/package/packstruct', group: 'out' },
]

/** Footer-only extras (legal). Terms/Privacy are site-internal routes. */
export const FOOTER_EXTRAS = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
]
