/**
 * scripts/build-status.mjs - the family status contract emitter
 * (family-status@1, packstruct#36).
 *
 * Generates web/public/status.json from the repo's own COMMITTED ledger
 * files (labs/crashledger.json + labs/refusal-matrix.packstruct.json) and
 * the pack manifests under packs/public/. Zero deps, zero hand-editing: the
 * file is regenerated on every web build, so the served dialect can never
 * lag the ledgers (the stale-copy drift class, killed by construction).
 *
 * The dialect (family-status@1, the four-repo contract):
 *   { schema:1, contract:"family-status@1", repo, site, docs, asOf,
 *     legs:[{leg, verdict, cases, counts, ledger}],
 *     packs:[{name, spec, manifest, cases}] }
 *
 * Verdict rule (additive-first): every case verdict in {REFUSED, PASSED,
 * BOUNDED} is a PASS; anything else degrades the leg to RED. The refusal
 * matrix carries `honest` booleans instead of verdict strings, so its leg
 * maps honest:true -> PASSED and honest:false -> FAILED (a RED). Verdicts
 * come from the ledger rows, never from prose.
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(HERE, '..', '..')
const OUT_PATH = join(REPO_ROOT, 'web', 'public', 'status.json')

const REPO = 'dhaupin/packstruct'
const SITE = 'https://packstruct.creadev.org/status'
const DOCS = 'https://docs.creadev.org/packstruct/status'

const PASS_VERDICTS = new Set(['REFUSED', 'PASSED', 'BOUNDED'])

function legOf(rows, { leg, ledger, verdictOf }) {
  const counts = {}
  let verdict = 'PASS'
  for (const row of rows) {
    const v = verdictOf ? verdictOf(row) : row.verdict
    if (v === undefined || v === null) {
      // A row without a verdict is a corruption the battery would refuse
      // elsewhere; here it degrades the leg honestly instead of guessing.
      verdict = 'RED'
      continue
    }
    if (!PASS_VERDICTS.has(v)) verdict = 'RED'
    counts[v] = (counts[v] || 0) + 1
  }
  return { leg, verdict, cases: rows.length, counts, ledger }
}

/**
 * build({ root }) -> the status object. Exported for the battery test.
 * Throws (refusing, never guessing) when a mandated input is unreadable.
 */
export function build(root = REPO_ROOT) {
  const crashLedger = JSON.parse(
    readFileSync(join(root, 'labs', 'crashledger.json'), 'utf8')
  )
  const matrix = JSON.parse(
    readFileSync(join(root, 'labs', 'refusal-matrix.packstruct.json'), 'utf8')
  )

  const findings = crashLedger.findings
  const matrixRows = matrix.rows

  // cases: count each committed pack's own ledger rows (findings namespaced
  // `<pack>/<case>`). Findings whose slug is not a committed pack belong to
  // the crashtest harness's generic probe catalog (auth/, input/, ...) - they
  // feed the crashtest leg, not a pack row, so they are never guessed into a
  // pack. A committed pack with ZERO rows is the real gap: the emitter
  // refuses it, never serves a hollow row.
  const casesByPack = {}
  for (const row of findings) {
    const slug = String(row.id || '').split('/')[0]
    if (slug) casesByPack[slug] = (casesByPack[slug] || 0) + 1
  }

  const manifests = []
  const packsDir = join(root, 'packs', 'public')
  for (const entry of readdirSync(packsDir).sort()) {
    if (!statSync(join(packsDir, entry)).isDirectory()) continue
    const manifestPath = join(packsDir, entry, 'pack.json')
    let spec
    try {
      spec = JSON.parse(readFileSync(manifestPath, 'utf8'))
    } catch (err) {
      throw new Error(`pack ${entry}: pack.json unreadable (${err.message}) - the status contract refuses a pack the campaign cannot count`)
    }
    if (!(spec.name in casesByPack)) {
      throw new Error(`pack ${spec.name}: committed pack has zero ledger rows - run the campaign before serving a status for it`)
    }
    manifests.push({ name: spec.name, spec: 'packstruct@1', manifest: `packs/public/${entry}/pack.json`, cases: casesByPack[spec.name] })
  }

  let asOf = 'worktree'
  try {
    // stderr is silenced: a fixture temp root (the battery's own case) has no
    // git context, and that honest fallback must not print a scary line.
    asOf = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    // no git context (zip download): say worktree, never a fake sha
  }

  return {
    schema: 1,
    contract: 'family-status@1',
    repo: REPO,
    site: SITE,
    docs: DOCS,
    asOf,
    legs: [
      legOf(findings, { leg: 'crashtest', ledger: 'labs/crashledger.json' }),
      legOf(matrixRows, {
        leg: 'refusal-matrix',
        ledger: 'labs/refusal-matrix.packstruct.json',
        // The matrix grades honesty, not verdict strings: an honest row is a
        // pass, a dishonest row is exactly the RED the generator refuses.
        verdictOf: (row) => (row.honest ? 'PASSED' : 'FAILED'),
      }),
    ],
    packs: manifests,
  }
}

export function write(root = REPO_ROOT, outPath = OUT_PATH) {
  const status = build(root)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(status, null, 2) + '\n')
  return { status, outPath }
}

// CLI: node scripts/build-status.mjs -> writes web/public/status.json.
// Silent success (npm scripts), refusal prints and exits nonzero.
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const { outPath } = write()
    console.log(`family status written: ${outPath}`)
  } catch (err) {
    console.error(`family status REFUSED: ${err.message}`)
    process.exit(1)
  }
}
