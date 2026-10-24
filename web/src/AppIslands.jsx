/**
 * src/AppIslands.jsx
 * ==================
 * TEMPLATE FILE -- register your island components here.
 *
 * Each entry maps a data-pre-island name to a React component.
 * The name must match exactly what you put in the HTML attribute.
 *
 * Island components:
 *   - Run only in the browser, never during SSR prerender.
 *   - Receive no props. Read data from localStorage, fetch, or a global store.
 *   - Replace any fallback content inside the <pre-island> element.
 *
 * Add your components below and uncomment the import lines.
 * Remove unused examples before shipping.
 */

import LintDemo from './islands/LintDemo.jsx'

export const islands = {
  // In-browser manifest check: validates pasted pack.json JSON against the
  // same SPEC v1 rules the CLI enforces (see islands/LintDemo.jsx). Static
  // fallback prerenders for crawlers; the interactive validator mounts in
  // the browser only.
  'lint-demo': LintDemo,
}
