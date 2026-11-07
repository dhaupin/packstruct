/**
 * issues.js - prefilled GitHub issue links, built in the browser, sent nowhere.
 * ===========================================================================
 * Same shape as vant's contact composer: a link to GitHub's own new-issue
 * page with title/body/template params, opened in a new tab for the human to
 * review and submit. Nothing is POSTed from this site; the visitor is the
 * only one who can create the issue. Kept as a tiny pure module so the pages
 * that offer a "file this" link all build the URL the same way.
 */

const REPO = 'https://github.com/dhaupin/packstruct'

/** Templates shipped in .github/ISSUE_TEMPLATE/ (name: is the label GitHub shows). */
export const TEMPLATES = {
  bug: 'bug_report.md',
  feature: 'feature_request.md',
  adopt: 'adoption.md',
  host: 'new_host.md',
}

/**
 * Build a prefilled new-issue URL. `template` is a key of TEMPLATES; omit it
 * for a blank issue. Long bodies ride the `body` param (GitHub truncates the
 * URL at ~8k chars, so keep the preamble short and let the visitor expand).
 */
export function issueUrl({ template, title, body } = {}) {
  const params = new URLSearchParams()
  const t = template && TEMPLATES[template]
  if (t) params.set('template', t)
  if (title) params.set('title', title)
  if (body) params.set('body', body)
  const qs = params.toString()
  return REPO + '/issues/new' + (qs ? '?' + qs : '')
}

/** The bare issues list, for "see what's open" links. */
export const ISSUES_URL = REPO + '/issues'
