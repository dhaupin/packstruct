// src/audit.mjs - audit-conformance (M2): the fixture packs a host loader
// must pass/fail as promised (SPEC section 7). Zero dependencies.
//
// How it stays honest: packstruct ships verdict-claiming fixtures - one clean
// pack plus one pack (or pair) per SPEC section 5 refusal norm, each
// claiming a verdict. The host's OWN loader command runs over each
// materialized bundle in a scratch root. A conforming loader: exits 0 on the
// clean bundle, exits non-zero AND names the offending pack on every
// violation bundle (SPEC section 5: "naming the pack"; the host may word the
// refusal its own way, so the audit matches identity, not jargon). Any other
// outcome is an audit violation naming the case - the harness refuses to
// grade, it only reports what the loader actually did.
//
// Loader caps (QC hardening): a HOST loader is arbitrary code in a shell it
// owns, and a refusal is instant - so a loader that hangs gets killed at the
// 120s audit timeout (neither verdict), and output above the 1MB spawn
// buffer counts as no-verdict rather than a harness crash. Both surface as
// audit violations naming the case, same as any other betrayal of the
// verdict contract.
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

export const AUDIT_TIMEOUT_MS = 120000
export const AUDIT_MAXBUFFER_BYTES = 1024 * 1024

export const CASES_DIR = fileURLToPath(new URL('../conformance/cases/', import.meta.url))

// The bundled cases: <case>/public/<pack-dir>/, each with a verdict claim.
// clean expects exit 0; every other case expects a refusing loader.
export function listCases() {
  return readdirSync(CASES_DIR).sort().filter(name => {
    try { return readdirSync(join(CASES_DIR, name)).length > 0 } catch { return false }
  })
}

// Pack identities a case's output must name on refusal: the pack directory
// names and the manifest `name` values (either counts - SPEC section 5 says
// "naming the pack", the host may identify by dir or manifest name).
function casePackIdentities(root) {
  const ids = new Set()
  const publicDir = join(root, 'public')
  if (!existsSync(publicDir)) return ids
  for (const dir of readdirSync(publicDir)) {
    ids.add(dir)
    try {
      const m = JSON.parse(readFileSync(join(publicDir, dir, 'pack.json'), 'utf8'))
      if (typeof m.name === 'string' && m.name) ids.add(m.name)
    } catch { /* identity by dir name is already in the set */ }
  }
  return ids
}

export function auditConformance(opts = {}) {
  if (typeof opts.loader !== 'string' || !opts.loader.includes('{packs}')) {
    return { caseCount: 0, honored: 0, violations: [{ pack: 'usage', norm: 'usage', message: 'audit-conformance needs --loader "<cmd> {packs}" - {packs} is replaced by each materialized bundle root' }] }
  }
  const repo = resolve(opts.repo ?? '.')
  const cases = listCases()
  const violations = []
  let honored = 0
  for (const c of cases) {
    const expect = c === 'clean' ? 'accept' : 'refuse'
    const tmp = mkdtempSync(join(tmpdir(), 'packstruct-audit-'))
    try {
      cpSync(join(CASES_DIR, c), tmp, { recursive: true })
      const ids = casePackIdentities(tmp)
      const cmd = opts.loader.split('{packs}').join(`"${tmp}"`)
      const auditTimeoutMs = Number.isFinite(opts.auditTimeoutMs) ? opts.auditTimeoutMs : AUDIT_TIMEOUT_MS
      const r = spawnSync(cmd, { shell: true, cwd: repo, encoding: 'utf8', timeout: auditTimeoutMs, killSignal: 'SIGKILL', maxBuffer: AUDIT_MAXBUFFER_BYTES })
      const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`
      let ok
      let why = ''
      if (r.error?.code === 'ENOBUFS') {
        ok = false
        why = `loader output exceeded the audit buffer (${AUDIT_MAXBUFFER_BYTES} bytes) - no verdict was observable, so the case carries no claim`
      } else if (r.status === null && r.signal) {
        // The kill path: a loader that hangs is neither an acceptance nor a
        // refusal (SPEC section 5 makes refusal INSTANT). Not honored either way.
        ok = false
        why = `loader hung past the audit timeout (${auditTimeoutMs}ms, killed with ${r.signal}) - sets no verdict observable`
      } else {
        const claimed = r.status === 0
        if (expect === 'accept') {
          ok = claimed
        } else {
          ok = !claimed
          if (!ok) why = '' // exit 0 on a refuse case: message covers it below
          else if (![...ids].some(id => out.includes(id))) {
            ok = false
            why = 'refused but did not name the pack (SPEC section 5: nameable refusals)'
          }
        }
      }
      if (ok) honored++
      else {
        const got = r.status === null && r.signal ? `killed on signal ${r.signal}` : r.status === 0 ? 'exit 0 (loader accepted)' : `exit ${r.status}`
        violations.push({
          pack: c,
          norm: `audit-${expect}`,
          message: `loader ${got} on case "${c}" - the spec verdict is ${expect}${why ? ` - ${why}` : ''}`,
        })
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  }
  return { caseCount: cases.length, honored, violations }
}
