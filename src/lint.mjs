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
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { runCapped } from './run-capped.mjs'

export function lintPacks(dir) {
  const violations = []
  let packsChecked = 0
  if (!existsSync(dir)) {
    return { packsChecked, violations: [{ pack: dir, norm: 'usage', message: `no such directory: ${dir}` }] }
  }
  // Section 1 contract: packs live at <packs-root>/public/<name>/
  const publicDir = join(dir, 'public')
  if (!existsSync(publicDir)) {
    return { packsChecked, violations: [{ pack: dir, norm: 'directory-contract', message: `missing ${dir}/public/ - packs live at <packs-root>/public/<name>/` }] }
  }
  for (const name of readdirSync(publicDir).sort()) {
    const packDir = join(publicDir, name)
    let isDir = true
    try { readdirSync(packDir) } catch { isDir = false }
    if (!isDir) continue
    const manifestPath = join(packDir, 'pack.json')
    if (!existsSync(manifestPath)) {
      violations.push({ pack: name, norm: 'manifest-missing', message: 'pack.json missing' })
      continue
    }
    packsChecked++
    let m
    try { m = JSON.parse(readFileSync(manifestPath, 'utf8')) } catch (e) {
      violations.push({ pack: name, norm: 'manifest-invalid', message: `pack.json is not valid JSON: ${e.message}` })
      continue
    }
    if (m.schemaVersion !== 1) violations.push({ pack: name, norm: 'schemaVersion', message: `schemaVersion must be 1 (got ${JSON.stringify(m.schemaVersion)})` })
    if (typeof m.name !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(m.name)) violations.push({ pack: name, norm: 'name-kebab-case', message: `name must be kebab-case (got ${JSON.stringify(m.name)})` })
    if (m.name !== name) violations.push({ pack: name, norm: 'name-dir-match', message: `name "${m.name}" does not match its directory "${name}"` })
    if (typeof m.version !== 'string' || !/^\d+\.\d+(\.\d+)?$/.test(m.version)) violations.push({ pack: name, norm: 'version', message: `version must be dotted MAJOR.MINOR[.PATCH] (got ${JSON.stringify(m.version)})` })
    if (typeof m.description !== 'string' || !m.description.trim()) violations.push({ pack: name, norm: 'description', message: 'description missing or empty' })
    if (typeof m.entry !== 'string' || !m.entry.trim() || m.entry.includes('..')) {
      violations.push({ pack: name, norm: 'entry', message: `entry must be a relative path inside the pack (got ${JSON.stringify(m.entry)})` })
    } else if (!existsSync(join(packDir, m.entry))) {
      violations.push({ pack: name, norm: 'entry', message: `entry file "${m.entry}" does not exist - instant refusal at load time (the crashtest#16 class)` })
    }
    // armedByKey: OPTIONAL string. Type-checked only - an EMPTY value is
    // "present, not yet armed" and the host owns presence semantics
    // (folded from crashtest#25: our non-empty refusal was a check the
    // SPEC didn't promise; the engine treats empty as valid).
    if (m.armedByKey !== undefined && typeof m.armedByKey !== 'string') {
      violations.push({ pack: name, norm: 'armedByKey', message: `armedByKey, when present, must be a string (got ${typeof m.armedByKey})` })
    }
  }
  return { packsChecked, violations }
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
  const shallow = lintPacks(dir)
  const violations = [...shallow.violations]
  const publicDir = join(dir, 'public')
  let libraryIds = 0
  if (!existsSync(publicDir)) {
    return { packsChecked: shallow.packsChecked, violations, modulesProbed: 0, idsCensused: 0, libraryIds }
  }
  const shallowFlagged = new Map()
  for (const v of shallow.violations) shallowFlagged.set(v.pack, v.norm)
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
  for (const name of readdirSync(publicDir).sort()) {
    const packDir = join(publicDir, name)
    let isDir = true
    try { readdirSync(packDir) } catch { isDir = false }
    if (!isDir) continue
    // Manifest-level parity with the engine's seen map (loader.js:389-391):
    // two packs claiming the same pack name = one loud error at author time.
    const flagged = shallowFlagged.get(name)
    if (flagged === 'manifest-missing' || flagged === 'manifest-invalid') continue
    let m = null
    try { m = JSON.parse(readFileSync(join(packDir, 'pack.json'), 'utf8')) } catch { continue }
    if (typeof m.name === 'string') {
      const before = nameSeen.get(m.name)
      if (before !== undefined && before !== name) {
        violations.push({ pack: name, norm: 'name-collision', message: `pack name "${m.name}" claimed by both ${before}/ and ${name}/ - one loud error (the engine's seen map at author time)` })
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
      violations.push({ pack: name, norm: 'entry-import', message: `entry "${m.entry}": ${err.message}` })
      continue
    }
    if (report.importError !== undefined) {
      violations.push({ pack: name, norm: 'entry-import', message: `entry "${m.entry}" failed to import: ${report.importError}` })
      continue
    }
    if (!report.defaultExport) {
      violations.push({ pack: name, norm: 'entry-default-export', message: `entry "${m.entry}" has no default export - the loader would report it as an entry failure (SPEC section 3)` })
      continue
    }
    modulesProbed++
    // Census (packstruct#2 ask 2): raw ids across the pack corpus, plus
    // within-pack duplicates - engine parity before the host ever loads.
    for (const { id, at } of report.ids) {
      idsCensused++
      if (idsCensused > MAX_IDS) {
        violations.push({ pack: name, norm: 'deep-floor', message: `census floor exceeded (>${MAX_IDS} ids) - refusing to walk further rather than pretending` })
        return { packsChecked: shallow.packsChecked, violations, modulesProbed, idsCensused, libraryIds }
      }
      const first = idSeen.get(id)
      if (first === undefined) { idSeen.set(id, { pack: name, at }); continue }
      if (first.pack === name) {
        if (!violations.some(v => v.norm === 'id-duplicate' && v.message.includes(`"${id}"`))) {
          violations.push({ pack: name, norm: 'id-duplicate', message: `id "${id}" appears twice within the pack (first: ${first.at})` })
        }
      } else {
        const vsLibrary = first.pack === DEEP_LIB_TAG
        const norm = vsLibrary ? 'id-library-collision' : 'id-collision'
        if (!violations.some(v => v.norm === norm && v.message.includes(`"${id}"`))) {
          const who = vsLibrary
            ? `the host library (${first.at})` : `${first.pack}/ (${first.at})`
          violations.push({ pack: name, norm, message: `id "${id}" claimed by both ${who} and ${name}/ (${at}) - the host id space cannot carry both` })
        }
      }
    }
  }
  return { packsChecked: shallow.packsChecked, violations, modulesProbed, idsCensused, libraryIds }
}

