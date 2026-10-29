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
import FamilyStatusIsland from './components/FamilyStatusIsland.jsx'

export const islands = {
  // In-browser manifest check: validates pasted pack.json JSON against the
  // same SPEC v1 rules the CLI enforces (see islands/LintDemo.jsx). Static
  // fallback prerenders for crawlers; the interactive validator mounts in
  // the browser only.
  'lint-demo': LintDemo,
  // Family status (family-status@1, packstruct#36): fetches each sibling's
  // served /status.json and renders the family table honestly - absence is
  // rendered as absent, never guessed. Static fallback prerenders for
  // crawlers; the live table mounts in the browser only.
  'family-status': FamilyStatusIsland,
}
