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
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

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
    if (m.armedByKey !== undefined && (typeof m.armedByKey !== 'string' || !m.armedByKey.trim())) {
      violations.push({ pack: name, norm: 'armedByKey', message: 'armedByKey, when present, must be a non-empty string' })
    }
  }
  return { packsChecked, violations }
}

// Ids a deep probe extracts from ONE default export (generic over the two
// house profiles: scenario `attacks[]/steps[]`, check `checks[]` - host
// shapes stay host-owned, this never assigns shared meaning to them).
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

// Load the host-library census reference (--against, packstruct#2 ask: the
// id-vs-host-library census). Accepts a file or a directory: .json parses
// directly, code modules import in-process and default-export ids in one of
// the house profile shapes (generically probed - the library's internal
// shapes stay the host's business).
async function loadLibraryAgainst(ref) {
  if (ref.endsWith('.json')) return JSON.parse(readFileSync(ref, 'utf8'))
  if (existsSync(ref) && (await import('node:fs')).statSync(ref).isDirectory()) {
    const entries = readdirSync(ref).filter(f => f.endsWith('.js') || f.endsWith('.mjs')).sort()
    let merged = null
    for (const f of entries) {
      const mod = (await import(pathToFileURL(resolve(ref, f)).href)).default
      merged = { parts: (merged?.parts ?? []).concat([{ file: f, mod }]) }
    }
    return merged
  }
  return (await import(pathToFileURL(resolve(ref)).href)).default
}

// Merge a dir-shaped library into one probeUnits list: [{id, at, from}].
function libraryProbeUnits(lib, ref) {
  if (lib?.parts) {
    const out = []
    for (const { file, mod } of lib.parts) {
      for (const u of probeIds(mod, DEEP_LIB_TAG)) out.push({ ...u, at: `${file}: ${u.at}` })
    }
    return out
  }
  return probeIds(lib, DEEP_LIB_TAG).map(u => ({ ...u, at: `ref: ${u.at}` }))
}

export async function deepLintPacks(dir, opts = {}) {
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
      const lib = await loadLibraryAgainst(opts.against)
      for (const { id, at } of libraryProbeUnits(lib, opts.against)) {
        if (idSeen.has(id)) continue // the library's own internals: not ours to judge
        idSeen.set(id, { pack: DEEP_LIB_TAG, at: `--against (${at})` })
        libraryIds++
      }
    } catch (err) {
      violations.push({ pack: DEEP_LIB_TAG, norm: 'library-ref', message: `--against "${opts.against}": failed to load the host library: ${err.message}` })
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
    let mod = null
    try {
      mod = await import(pathToFileURL(resolve(packDir, m.entry)).href)
    } catch (err) {
      violations.push({ pack: name, norm: 'entry-import', message: `entry "${m.entry}" failed to import: ${err.message}` })
      continue
    }
    if (mod === null || typeof mod !== 'object' || mod.default === undefined) {
      violations.push({ pack: name, norm: 'entry-default-export', message: `entry "${m.entry}" has no default export - the loader would report it as an entry failure (SPEC section 3)` })
      continue
    }
    modulesProbed++
    // Census (packstruct#2 ask 2): raw ids across the pack corpus, plus
    // within-pack duplicates - engine parity before the host ever loads.
    for (const { id, at } of probeIds(mod.default, name)) {
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

