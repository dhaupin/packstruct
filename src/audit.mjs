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
// Loader caps (QC hardening): a HOST loader is arbitrary code in the shell
// it owns, and a refusal is instant - so a loader that HANGS is killed at
// the 120s audit timeout (neither verdict), and output past the 1MB cap is
// unverifiable output (neither verdict). Both surface as audit violations
// naming the case. The spawn is runCapped (async, exit-event-closed, no
// pipe-EOF hostage and no unaccounted scratch-file growth) - the two caps
// are the ONLY things that can end a loader early, and both are reported
// honestly, not graded through.
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { runCapped } from './run-capped.mjs'

export const AUDIT_TIMEOUT_MS = 120000
export const AUDIT_MAXBUFFER_BYTES = 1024 * 1024

export const CASES_DIR = fileURLToPath(new URL('../conformance/cases/', import.meta.url))

// Cases that carry the host-owned `env` claims block and exist to prove a
// loader does not REFUSE a spec'd key (SPEC section 2). They are accept
// cases by default; with --claims the loader must instead ECHO the declared
// claims (SPEC section 2: the host owns env semantics), so the block is
// exercised, not merely tolerated. A loader that silently ignores `env`
// passes the default audit and fails --claims - the undogfooded-block class
// packstruct#71 exists to name.
export const ENV_CLAIM_CASES = new Set(['env-claims'])
const CLAIM_MARKER = 'packstruct:env-claims '

// Cases that carry the host-owned `requires` relevance key (SPEC section 2,
// added v1.3.0) and exist to prove a loader does not REFUSE a pack for
// declaring the capabilities it needs. Accept cases: the key is spec'd, so a
// conforming loader must tolerate it (a loader that does not implement
// relevance still loads the pack - it just never skips it). The SKIP behavior
// itself is host-owned (a run root's `provides`/`ignore` are the host's
// vocabulary and channel, which the language-neutral harness cannot supply),
// so it is graded by the host's own suite - crashtest's
// test/pack-relevance.test.js is the engine receipt.
export const REQUIRES_CLAIM_CASES = new Set(['requires-claims'])

// The bundled cases: <case>/public/<pack-dir>/, each with a verdict claim.
// clean expects exit 0; every other case expects a refusing loader.
export function listCases() {
  return readdirSync(CASES_DIR).sort().filter(name => {
    try { return readdirSync(join(CASES_DIR, name)).length > 0 } catch { return false }
  })
}

// The declared env claims a case ships, read straight from the manifest - the
// audit asserts the loader echoes THESE, so the expectation derives from the
// fixture, never a hand copy.
export function caseEnvClaims(root) {
  const publicDir = join(root, 'public')
  if (!existsSync(publicDir)) return null
  for (const dir of readdirSync(publicDir)) {
    try {
      const m = JSON.parse(readFileSync(join(publicDir, dir, 'pack.json'), 'utf8'))
      if (m && typeof m === 'object' && m.env && typeof m.env === 'object') return m.env
    } catch { /* a manifest that does not parse is the case's own problem */ }
  }
  return null
}

// Canonicalize a claims object to a comparable form (sorted keys, sorted
// arrays) so the echo check matches CONTENT, not key order - a loader that
// normalizes differently is still honoring the block.
function canonicalClaims(claims) {
  if (claims === null || claims === undefined) return null
  if (Array.isArray(claims)) return [...claims].map(canonicalClaims).sort()
  if (typeof claims === 'object') {
    const out = {}
    for (const k of Object.keys(claims).sort()) out[k] = canonicalClaims(claims[k])
    return out
  }
  return claims
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

export async function auditConformance(opts = {}) {
  if (typeof opts.loader !== 'string' || !opts.loader.includes('{packs}')) {
    return { caseCount: 0, honored: 0, violations: [{ pack: 'usage', norm: 'usage', message: 'audit-conformance needs --loader "<cmd> {packs}" - {packs} is replaced by each materialized bundle root' }] }
  }
  const claims = opts.claims === true
  const repo = resolve(opts.repo ?? '.')
  const cases = listCases()
  const violations = []
  let honored = 0
  for (const c of cases) {
    // Accept cases: the clean bundle, the env-claims bundle (a pack that
    // merely carries the spec-allowed `env` block is conforming - SPEC
    // section 2), and the requires-claims bundle (a pack that declares the
    // spec-allowed `requires` relevance key is conforming too - SPEC section
    // 2, added v1.3.0). Every other case claims a refusal.
    const acceptCase = c === 'clean' || ENV_CLAIM_CASES.has(c) || REQUIRES_CLAIM_CASES.has(c)
    const expect = acceptCase ? 'accept' : 'refuse'
    const tmp = mkdtempSync(join(tmpdir(), 'packstruct-audit-'))
    try {
      cpSync(join(CASES_DIR, c), tmp, { recursive: true })
      const ids = casePackIdentities(tmp)
      const cmd = opts.loader.split('{packs}').join(`"${tmp}"`)
      const auditTimeoutMs = Number.isFinite(opts.auditTimeoutMs) ? opts.auditTimeoutMs : AUDIT_TIMEOUT_MS
      const r = await runCapped({ cmd, shell: true, cwd: repo, timeoutMs: auditTimeoutMs, maxBuffer: AUDIT_MAXBUFFER_BYTES, killSignal: 'SIGKILL' })
      if (r.spawnError) throw r.spawnError
      const out = `${r.stdout}\n${r.stderr}`
      let ok
      let why = ''
      if (r.capped) {
        ok = false
        why = `loader output exceeded the audit buffer (${AUDIT_MAXBUFFER_BYTES} bytes) - no verdict is observable past the cap, so the case carries no claim`
      } else if (r.timedOut) {
        ok = false
        why = `loader hung past the audit timeout (${auditTimeoutMs}ms, killed with ${r.signal ?? 'SIGKILL'}) - writes no verdict; a refusal is instant, hangs are neither accept nor refuse`
      } else {
        const claimed = r.status === 0
        if (claims && ENV_CLAIM_CASES.has(c)) {
          // The claims probe: the loader must ACCEPT and ECHO the declared
          // block. Refusing it is the "spec'd key a loader rejects" defect;
          // accepting without echoing is the silent-ignore defect. Both name
          // the case - a loader must prove it carries the claims, not that
          // it can look away.
          const want = caseEnvClaims(tmp)
          if (!claimed) {
            ok = false
            why = 'refused a pack carrying the spec-allowed `env` block (SPEC section 2: host-owned, never a refusal)'
          } else {
            const line = out.split(/\r?\n/).find(l => l.startsWith(CLAIM_MARKER))
            if (!line) {
              ok = false
              why = `accepted but did not echo the declared env claims - emit a line "${CLAIM_MARKER}<claims-json>" carrying the block it honored (a loader that silently ignores env passes the default audit; --claims is the leg that catches it)`
            } else {
              let echoed = null
              try { echoed = JSON.parse(line.slice(CLAIM_MARKER.length)) } catch { echoed = undefined }
              if (echoed === undefined) {
                ok = false
                why = `echoed env claims were not parseable JSON after "${CLAIM_MARKER}"`
              } else if (JSON.stringify(canonicalClaims(echoed)) !== JSON.stringify(canonicalClaims(want))) {
                ok = false
                why = `echoed env claims do not match the manifest - declared ${JSON.stringify(want)}, echoed ${JSON.stringify(echoed)}`
              } else {
                ok = true
              }
            }
          }
        } else if (expect === 'accept') {
          ok = claimed
        } else {
          ok = !claimed
          if (!ok) why = '' // exit 0 on a refuse case: the main message covers it
          else if (![...ids].some(id => out.includes(id))) {
            ok = false
            why = 'refused but did not name the pack (SPEC section 5: nameable refusals)'
          }
        }
      }
      if (ok) honored++
      else {
        const got = r.capped ? `output capped at ${AUDIT_MAXBUFFER_BYTES} bytes`
          : r.timedOut ? `killed at the ${auditTimeoutMs}ms timeout (${r.signal ?? 'SIGKILL'})`
          : r.status === null ? `killed on signal ${r.signal ?? '?'}`
          : r.status === 0 ? 'exit 0 (loader accepted)'
          : `exit ${r.status}`
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
