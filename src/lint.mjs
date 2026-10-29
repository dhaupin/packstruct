// src/lint.mjs - packstruct lint: packstruct spec v1 manifest validation.
// The immediate payoff: kills the "manifest declares an entry that doesn't
// ship" class (crashtest#16) at author time, in any fleet repo.
//
// deepLintPacks (packstruct#2) adds the load-level parity the manifest-only
// CLI never checks: import the entry once in-process, check the default
// export exists, and census ids (module/attack/check names + step names)
// across packs - mirroring the loader's shared-`seen` collision refusal
// (crashtest `fc93ca6` src/packs/loader.js:389-391) at author time.
// PROBE ONLY: host module-shape norms stay host-owned (SPEC section 3) -
// deep censes ids, it does not police the host's contract shapes.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, relative, isAbsolute, dirname, basename, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { runCapped } from './run-capped.mjs'

const LANES = ['public', 'local']

// The wrong-argument lane (packstruct#13, #17): the packs ROOT is the
// argument, but the natural first-time gestures - the `public/` dir itself
// (that is exactly what the tree shows), one pack dir, the repo root - all
// produced the same doubled-segment `directory-contract` nonsense that
// blames the hypothetical packs under the arg instead of naming the fix.
// Those shapes answer with a `usage` hint naming the probable intent; a
// genuinely empty root still refuses `directory-contract` (the refusal
// matrix's missing-public-dir row depends on it).
function wrongArgHint(dir) {
  const abs = resolve(dir)
  if (existsSync(join(abs, 'pack.json'))) {
    const parent = dirname(dir)
    const root = /(^|[\\/])(public|local)$/.test(parent) ? dirname(parent) : parent
    return `'${dir}' looks like a single pack (pack.json found inside) - pass the packs ROOT (the parent of public/), for example: packstruct lint ${root}`
  }
  let isFile = false
  try { isFile = statSync(abs).isFile() } catch { /* missing path: the caller's existence check owns it */ }
  if (isFile) {
    return `'${dir}' is a file - pass the packs ROOT (the directory whose public/ holds the packs), for example: packstruct lint ${dirname(dir)}`
  }
  if (/(^|[\\/])(public|local)[\\/]?$/.test(String(dir))) {
    const lane = basename(abs)
    return `'${dir}' looks like a ${lane}/ directory itself - pass the packs ROOT (the parent of ${lane}/), for example: packstruct lint ${dirname(dir)}`
  }
  if (existsSync(join(abs, 'packs'))) {
    return `'${dir}' looks like a repo root - the packs live in packs/, try: packstruct lint ${join(dir, 'packs')}`
  }
  return null
}

// Is `entry` a relative path that STAYS INSIDE `packDir` (SPEC section 2)?
// The old check was a `..` substring proxy: it false-refused a legitimate
// filename like `a..b.js`, yet PASSED an absolute path (`/index.js`), which
// node's `join` silently re-roots inside the pack (so shallow said clean)
// while `resolve` (the deep probe) treated as `/index.js` and refused - the
// two passes disagreed on the same manifest. Containment is a real test:
// reject non-strings, NUL, and absolute paths (POSIX or Windows-drive), then
// resolve against the pack dir and require the result to stay under it.
function entryEscape(packDir, entry) {
  if (typeof entry !== 'string' || !entry.trim()) return true
  if (entry.includes('\0')) return true
  if (entry.startsWith('/') || entry.startsWith('\\') || /^[A-Za-z]:[\\/]/.test(entry)) return true
  const abs = resolve(packDir, entry)
  const rel = relative(packDir, abs)
  return rel === '' || rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)
}

// Manifest validation for ONE pack dir (SPEC v1 section 2). Returns the
// violations plus whether the pack counted as checked (a pack.json exists).
// The caller tags lane and tallies; the checks never learn which lane they
// run in - public and local packs obey the same frozen manifest contract.
//
// `warnings` (SPEC v1.1 section 2) are advisory rows: they never redden a
// run, never change the exit code, and are reported separately from
// violations. The first warning shape is `implements` format.
function manifestViolations(packDir, name) {
  const violations = []
  const warnings = []
  const manifestPath = join(packDir, 'pack.json')
  if (!existsSync(manifestPath)) {
    return { checked: false, violations: [{ pack: name, norm: 'manifest-missing', message: 'pack.json missing' }], warnings }
  }
  let m
  try { m = JSON.parse(readFileSync(manifestPath, 'utf8')) } catch (e) {
    return { checked: true, violations: [{ pack: name, norm: 'manifest-invalid', message: `pack.json is not valid JSON: ${e.message}` }], warnings }
  }
  if (m.schemaVersion !== 1) violations.push({ pack: name, norm: 'schemaVersion', message: `schemaVersion must be 1 (got ${JSON.stringify(m.schemaVersion)})` })
  if (typeof m.name !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(m.name)) violations.push({ pack: name, norm: 'name-kebab-case', message: `name must be kebab-case (got ${JSON.stringify(m.name)})` })
  if (m.name !== name) violations.push({ pack: name, norm: 'name-dir-match', message: `name "${m.name}" does not match its directory "${name}"` })
  if (typeof m.version !== 'string' || !/^\d+\.\d+(\.\d+)?$/.test(m.version)) violations.push({ pack: name, norm: 'version', message: `version must be dotted MAJOR.MINOR[.PATCH] (got ${JSON.stringify(m.version)})` })
  if (typeof m.description !== 'string' || !m.description.trim()) violations.push({ pack: name, norm: 'description', message: 'description missing or empty' })
  if (entryEscape(packDir, m.entry)) {
    violations.push({ pack: name, norm: 'entry', message: `entry must be a relative path inside the pack (got ${JSON.stringify(m.entry)})` })
  } else {
    // MUST exist AND be a file: SPEC §3 says an entry is an ES module, so a
    // path that is a directory is not one. Checking existence alone let a
    // directory entry pass shallow while the deep probe's import refused it -
    // the same shallow/deep disagreement the containment fix closed.
    let entryStat = null
    try { entryStat = statSync(join(packDir, m.entry)) } catch { /* absent */ }
    if (!entryStat) {
      violations.push({ pack: name, norm: 'entry', message: `entry file "${m.entry}" does not exist - instant refusal at load time (the crashtest#16 class)` })
    } else if (!entryStat.isFile()) {
      violations.push({ pack: name, norm: 'entry', message: `entry "${m.entry}" is not a file - an entry is an ES module (SPEC section 3)` })
    }
  }
  // armedByKey: OPTIONAL string. Type-checked only - an EMPTY value is
  // "present, not yet armed" and the host owns presence semantics
  // (folded from crashtest#25: our non-empty refusal was a check the
  // SPEC didn't promise; the engine treats empty as valid).
  if (m.armedByKey !== undefined && typeof m.armedByKey !== 'string') {
    violations.push({ pack: name, norm: 'armedByKey', message: `armedByKey, when present, must be a string (got ${typeof m.armedByKey})` })
  }
  // implements (SPEC v1.1 section 2): OPTIONAL host-owned acknowledgement of
  // the spec the pack builds against, formatted `packstruct@<MAJOR>` or an
  // exact `packstruct@1.0.0`. FORMAT ONLY, and format drift is a WARNING,
  // never a refusal - absence is the quiet default and never colors a
  // verdict (the row's own cost-to-host: none).
  if (m.implements !== undefined && (typeof m.implements !== 'string' || !/^packstruct@\d+(\.\d+){0,2}$/.test(m.implements))) {
    warnings.push({ pack: name, norm: 'implements', message: `implements, when present, should be "packstruct@<major>" or an exact pin like "packstruct@1.0.0" (got ${JSON.stringify(m.implements)}) - advisory only, never a refusal` })
  }
  // armedCoverage (packstruct#27, optional assist): a declared claim that
  // this pack lane has an armed end-to-end row (a test file that simulates
  // its target with the vocabulary armed). The lint CONFIRMS the declared
  // file exists - it never runs the row (runs are the host's business).
  // A declared claim that names a file that isn't there is the vacuous-green
  // class this key exists to make loud; an absent key is the quiet default.
  if (m.armedCoverage !== undefined) {
    if (entryEscape(packDir, m.armedCoverage)) {
      violations.push({ pack: name, norm: 'armed-coverage', message: `armedCoverage, when present, must be a relative path inside the pack (got ${JSON.stringify(m.armedCoverage)})` })
    } else if (!existsSync(join(packDir, m.armedCoverage))) {
      violations.push({ pack: name, norm: 'armed-coverage', message: `armedCoverage declares "${m.armedCoverage}" but that file does not ship - the declared armed row is vacuous (packstruct#27)` })
    }
  }
  return { checked: true, violations, warnings }
}

// List the pack directories of one lane (<root>/<lane>/<name>/). Anything
// that is not a directory is skipped, as the public lane always has been.
function lanePackDirs(dir, lane) {
  const laneDir = join(dir, lane)
  if (!existsSync(laneDir)) return []
  const out = []
  for (const name of readdirSync(laneDir).sort()) {
    try { readdirSync(join(laneDir, name)) } catch { continue }
    out.push({ name, packDir: join(laneDir, name) })
  }
  return out
}

// opts.local (packstruct#16): opt-in, contract-preserving. The v1 default
// stays public-only; `--local` also lints the gitignored WIP lane every
// consumer repo keeps. Local violations carry `lane: 'local'` so a CI
// consumer can tell the lanes apart; public rows stay byte-identical.
export function lintPacks(dir, opts = {}) {
  const violations = []
  const warnings = []
  let packsChecked = 0
  let localChecked = 0
  if (!existsSync(dir)) {
    return { packsChecked, localChecked, violations: [{ pack: dir, norm: 'usage', message: `no such directory: ${dir}` }], warnings }
  }
  // Section 1 contract: packs live at <packs-root>/public/<name>/
  const publicDir = join(dir, 'public')
  if (!existsSync(publicDir)) {
    const hint = wrongArgHint(dir)
    if (hint) return { packsChecked, localChecked, violations: [{ pack: dir, norm: 'usage', message: hint }], warnings }
    return { packsChecked, localChecked, violations: [{ pack: dir, norm: 'directory-contract', message: `missing ${dir}/public/ - packs live at <packs-root>/public/<name>/` }], warnings }
  }
  for (const { name, packDir } of lanePackDirs(dir, 'public')) {
    const r = manifestViolations(packDir, name)
    if (r.checked) packsChecked++
    violations.push(...r.violations)
    warnings.push(...r.warnings)
  }
  if (opts.local) {
    for (const { name, packDir } of lanePackDirs(dir, 'local')) {
      const r = manifestViolations(packDir, name)
      if (r.checked) localChecked++
      for (const v of r.violations) violations.push({ ...v, lane: 'local' })
      for (const w of r.warnings) warnings.push({ ...w, lane: 'local' })
    }
  }
  return { packsChecked, localChecked, violations, warnings }
}

// Ids ONE default export carries (generic over the two house profiles:
// scenario `attacks[]/steps[]`, check `checks[]` - host shapes stay
// host-owned, this never assigns shared meaning to them). Runs in-process
// ONLY on inert data (JSON libraries); code modules are probed in a child
// process via childProbe below - their top-level code must never run inside
// the linter (it could exit() the CLI or spin it forever).
function probeIds(def, pack) {
  const out = []
  const push = (id, at) => { if (typeof id === 'string' && id) out.push({ id, pack, at }) }
  if (!def || typeof def !== 'object') return out
  push(def.name, 'module name')
  for (const key of ['attacks', 'checks', 'scenarios']) {
    const arr = def[key]
    if (!Array.isArray(arr)) continue
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue
      push(item.id ?? item.name, `${key}[]`)
      for (const sub of ['steps', 'phases']) {
        if (!Array.isArray(item[sub])) continue
        for (const s of item[sub]) {
          if (!s || typeof s !== 'object') continue
          push(s.id ?? s.name, `${key}[].${sub}[]`)
        }
      }
    }
  }
  return out
}

const DEEP_LIB_TAG = '(host-library)'

// QC finding (crash class, fixed): deep used to import entries in-process,
// so an entry and its own top-level code could drive the probe's process -
// process.exit(7) made the CLI wire-exit 7 with no output, and an infinite
// top-level loop hung it forever. Probes now run in a disposable child
// (no shared module cache/no shared process). Kill on the timeout: a
// refusal is instant, and a pack that stalls the exit-code contract is an
// entry-import violation, not a hint.
export const PROBE_TIMEOUT_MS = 5000
const PROBE_MARKER = 'PROBE::'

function childProbeScript(fileUrl) {
  return `
try {
  const m = await import(${JSON.stringify(fileUrl)});
  const d = m && m.default;
  const out = { defaultExport: d !== undefined && d !== null, ids: [] };
  const push = (id, at) => { if (typeof id === 'string' && id) out.ids.push({ id, at }) };
  if (d && typeof d === 'object') {
    push(d.name, 'module name');
    for (const key of ['attacks', 'checks', 'scenarios']) {
      const arr = d[key];
      if (!Array.isArray(arr)) continue;
      for (const item of arr) {
        if (!item || typeof item !== 'object') continue;
        push(item.id ?? item.name, key + '[]');
        for (const sub of ['steps', 'phases']) {
          if (!Array.isArray(item[sub])) continue;
          for (const s of item[sub]) {
            if (!s || typeof s !== 'object') continue;
            push(s.id ?? s.name, key + '[].' + sub + '[]');
          }
        }
      }
    }
  }
  process.stdout.write(${JSON.stringify(PROBE_MARKER)} + JSON.stringify(out));
} catch (e) {
  process.stdout.write(${JSON.stringify(PROBE_MARKER)} + JSON.stringify({ importError: String((e && e.message) || e) }));
}
`
}

// Probe one code module in the child. Returns the probe report or throws a
// plain Error carrying the reason the probe could not report.
//
// Stdio through runCapped (async): a killed probe must never wait on
// pipe-EOF that an orphaned grandchild spawned by the entry can hold
// forever, and an output-flooding entry hits the 1MB cap (an honest
// entry-import refusal), not a scratch-file flood that fills the disk.
async function childProbe(absPath, timeoutMs = PROBE_TIMEOUT_MS) {
  const fileUrl = pathToFileURL(absPath).href
  const r = await runCapped({
    cmd: process.execPath,
    args: ['--input-type=module', '--no-warnings', '-e', childProbeScript(fileUrl)],
    timeoutMs,
    maxBuffer: 1024 * 1024,
    killSignal: 'SIGKILL',
  })
  if (r.spawnError && r.spawnError.code === 'ENOENT') throw new Error(`no node runtime to probe with`)
  const out = r.stdout
  const idx = out.lastIndexOf(PROBE_MARKER)
  if (idx === -1) {
    if (r.capped) throw new Error(`probe output hit the ${1 << 20}B cap before the probe reported (an entry flooding its own stdout) - a pack that floods the probe is refusing the exit-code contract, and a refusal is instant`)
    if (r.timedOut) throw new Error(`probe killed after the ${timeoutMs}ms timeout (signal ${r.signal ?? 'SIGKILL'}) - a pack stalling the probe is refusing the exit-code contract, and a refusal is instant`)
    throw new Error(`entry terminated the probe process (exit ${r.status ?? 'null'}) before the probe could report`)
  }
  let report
  try {
    report = JSON.parse(out.slice(idx + PROBE_MARKER.length).trim())
  } catch {
    throw new Error('probe output was not parseable as a probe report')
  }
  return report
}

// Load the host-library census reference (--against, packstruct#2 ask: the
// id-vs-host-library census). Accepts a file or a directory: .json parses
// in-process (inert data - no code execution needed); code modules are
// child-probed one by one, same as pack entries. The library's internal
// shapes stay the host's business.
async function collectLibraryUnits(ref, timeoutMs) {
  const units = []
  if (ref.endsWith('.json')) {
    const obj = JSON.parse(readFileSync(ref, 'utf8'))
    for (const u of probeIds(obj, DEEP_LIB_TAG)) units.push({ id: u.id, at: `json ref: ${u.at}` })
    return units
  }
  let files
  if (existsSync(ref) && statSync(ref).isDirectory()) {
    files = readdirSync(ref).filter(f => f.endsWith('.js') || f.endsWith('.mjs')).sort().map(f => join(ref, f))
  } else {
    files = [resolve(ref)]
  }
  for (const file of files) {
    let report
    try {
      report = await childProbe(file, timeoutMs)
    } catch (err) {
      throw new Error(`${file}: ${err.message}`)
    }
    if (report.importError !== undefined) throw new Error(`${file}: failed to import: ${report.importError}`)
    for (const { id, at } of report.ids) units.push({ id, at: `${file}: ${at}` })
  }
  return units
}

export async function deepLintPacks(dir, opts = {}) {
  const timeoutMs = Number.isFinite(opts.probeTimeoutMs) ? opts.probeTimeoutMs : PROBE_TIMEOUT_MS
  // Lanes to walk: public always, local only when asked (packstruct#16).
  const lanes = opts.local ? LANES : ['public']
  const tagLane = (v, lane) => (lane === 'local' ? { ...v, lane: 'local' } : v)
  const shallow = lintPacks(dir, { local: opts.local })
  const violations = [...shallow.violations]
  const warnings = [...(shallow.warnings ?? [])]
  const localChecked = shallow.localChecked ?? 0
  const publicDir = join(dir, 'public')
  let libraryIds = 0
  if (!existsSync(publicDir)) {
    return { packsChecked: shallow.packsChecked, localChecked, violations, warnings, modulesProbed: 0, idsCensused: 0, libraryIds }
  }
  const shallowFlagged = new Map()
  for (const v of shallow.violations) shallowFlagged.set(`${v.lane ?? 'public'}/${v.pack}`, v.norm)
  const idSeen = new Map() // raw id -> first origin {pack, at}
  const nameSeen = new Map() // manifest pack name -> dir
  const MAX_IDS = 100000 // census floor: refuse pathological corpora loudly
  let modulesProbed = 0
  let idsCensused = 0
  // Seed the census with the host library (--against): pack ids colliding
  // with library ids refuse as id-library-collision (SPEC section 4's
  // namespaced-ids norm, engine side: the #19 44-vs-49 zero-collision claim).
  if (opts.against !== undefined) {
    try {
      const lib = await collectLibraryUnits(opts.against, timeoutMs)
      for (const { id, at } of lib) {
        if (idSeen.has(id)) continue // the library's own internals: not ours to judge
        idSeen.set(id, { pack: DEEP_LIB_TAG, at: `--against (${at})` })
        libraryIds++
      }
    } catch (err) {
      violations.push({ pack: DEEP_LIB_TAG, norm: 'library-ref', message: `--against "${opts.against}": ${err.message}` })
    }
  }
  for (const lane of lanes) {
    const laneDir = join(dir, lane)
    if (!existsSync(laneDir)) continue
    for (const name of readdirSync(laneDir).sort()) {
      const packDir = join(laneDir, name)
      let isDir = true
      try { readdirSync(packDir) } catch { isDir = false }
      if (!isDir) continue
      // Manifest-level parity with the engine's seen map (loader.js:389-391):
      // two packs claiming the same pack name = one loud error at author time.
      const flagged = shallowFlagged.get(`${lane}/${name}`)
      if (flagged === 'manifest-missing' || flagged === 'manifest-invalid') continue
      let m = null
      try { m = JSON.parse(readFileSync(join(packDir, 'pack.json'), 'utf8')) } catch { continue }
      if (typeof m.name === 'string') {
        const before = nameSeen.get(m.name)
        if (before !== undefined && before !== name) {
          violations.push(tagLane({ pack: name, norm: 'name-collision', message: `pack name "${m.name}" claimed by both ${before}/ and ${name}/ - one loud error (the engine's seen map at author time)` }, lane))
        }
        nameSeen.set(m.name, name)
      }
      // Entry probe (packstruct#2 ask 1): import once, in-process.
      if (flagged === 'entry') continue // missing/invalid entry: shallow already refused
      if (typeof m.entry !== 'string' || !existsSync(join(packDir, m.entry))) continue
      let report
      try {
        report = await childProbe(resolve(packDir, m.entry), timeoutMs)
      } catch (err) {
        violations.push(tagLane({ pack: name, norm: 'entry-import', message: `entry "${m.entry}": ${err.message}` }, lane))
        continue
      }
      if (report.importError !== undefined) {
        violations.push(tagLane({ pack: name, norm: 'entry-import', message: `entry "${m.entry}" failed to import: ${report.importError}` }, lane))
        continue
      }
      if (!report.defaultExport) {
        violations.push(tagLane({ pack: name, norm: 'entry-default-export', message: `entry "${m.entry}" has no default export - the loader would report it as an entry failure (SPEC section 3)` }, lane))
        continue
      }
      modulesProbed++
      // Census (packstruct#2 ask 2): raw ids across the pack corpus, plus
      // within-pack duplicates - engine parity before the host ever loads.
      for (const { id, at } of report.ids) {
        idsCensused++
        if (idsCensused > MAX_IDS) {
          violations.push(tagLane({ pack: name, norm: 'deep-floor', message: `census floor exceeded (>${MAX_IDS} ids) - refusing to walk further rather than pretending` }, lane))
          return { packsChecked: shallow.packsChecked, localChecked, violations, warnings, modulesProbed, idsCensused, libraryIds }
        }
        const first = idSeen.get(id)
        if (first === undefined) { idSeen.set(id, { pack: name, at }); continue }
        if (first.pack === name) {
          if (!violations.some(v => v.norm === 'id-duplicate' && v.message.includes(`"${id}"`))) {
            violations.push(tagLane({ pack: name, norm: 'id-duplicate', message: `id "${id}" appears twice within the pack (first: ${first.at})` }, lane))
          }
        } else {
          const vsLibrary = first.pack === DEEP_LIB_TAG
          const norm = vsLibrary ? 'id-library-collision' : 'id-collision'
          if (!violations.some(v => v.norm === norm && v.message.includes(`"${id}"`))) {
            const who = vsLibrary
              ? `the host library (${first.at})` : `${first.pack}/ (${first.at})`
            violations.push(tagLane({ pack: name, norm, message: `id "${id}" claimed by both ${who} and ${name}/ (${at}) - the host id space cannot carry both` }, lane))
          }
        }
      }
    }
  }
  return { packsChecked: shallow.packsChecked, localChecked, violations, warnings, modulesProbed, idsCensused, libraryIds }
}

