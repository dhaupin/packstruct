#!/usr/bin/env node
/**
 * scripts/gen-refusal-matrix.mjs - the packstruct column of the shared
 * refusal matrix (dhaupin/packstruct#3).
 *
 * No-fiction rule honored mechanically: every row's refusal verdict is
 * generated from the ACTUAL linter run over the actual bytes on disk, never
 * from what the code reads like it would do. A row whose observed verdict
 * disagrees with its expectation REFUSES THE RUN (exit 1) - the matrix can
 * never silently go stale or lie.
 *
 * Outputs, written only when every row proves honest:
 *   labs/refusal-matrix.packstruct.json  - the packstruct column
 *   labs/refusal-battery/<id>.json       - portable shape files: hosts run
 *     the same battery through THEIR loader and give back their column
 *     (dhaupin/packstruct#3's third column; crashtest ask filed from here).
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lintPacks } from '../src/lint.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PKG_VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version

const base = { schemaVersion: 1, name: 'shape-pack', version: '1.0.0', entry: 'probes-entry.js', description: 'battery base - clean otherwise' }

// The ONE manifest serialization, used by BOTH the temp materialization and
// the battery-file emitter. Divergence here was the schemaVersion-missing
// bug found by the crashtest#25 fold (the emitter ignored `drop`, so the
// portable file carried the key the row promised was gone): one code path,
// so the bytes and the row can never disagree again.
function manifestFor(shape) {
  if (shape.noManifest) return null
  if (shape.malformed) return 'INVALID JSON PLACEHOLDER - see gen-refusal-matrix.mjs'
  const manifest = { ...base }
  for (const k of shape.drop ?? []) delete manifest[k]
  Object.assign(manifest, shape.mutate ?? {})
  return JSON.parse(JSON.stringify(manifest))
}

const BATTERY = [
  { id: 'schemaVersion-num-2', mutate: { schemaVersion: 2 }, expect: { refused: true, norms: ['schemaVersion'] } },
  { id: 'schemaVersion-string-1', mutate: { schemaVersion: '1' }, expect: { refused: true, norms: ['schemaVersion'] } },
  { id: 'schemaVersion-missing', drop: ['schemaVersion'], expect: { refused: true, norms: ['schemaVersion'] } },
  { id: 'name-uppercase', mutate: { name: 'Shape-Pack' }, expect: { refused: true, norms: ['name-kebab-case', 'name-dir-match'] } },
  { id: 'name-dir-mismatch', mutate: { name: 'other-name' }, expect: { refused: true, norms: ['name-dir-match'] } },
  { id: 'version-major-only', mutate: { version: '1' }, expect: { refused: true, norms: ['version'] } },
  { id: 'version-two-part-ok', mutate: { version: '1.0' }, expect: { refused: false } },
  { id: 'description-empty', mutate: { description: '' }, expect: { refused: true, norms: ['description'] } },
  { id: 'entry-parent-escape', mutate: { entry: '../escape.js' }, expect: { refused: true, norms: ['entry'] } },
  { id: 'entry-missing-file', mutate: { entry: 'ghost.js' }, expect: { refused: true, norms: ['entry'] } },
  // Engine-first fold (crashtest#25): empty = present-not-yet-armed, valid.
  { id: 'armedByKey-empty', mutate: { armedByKey: '' }, expect: { refused: false, note: 'presence semantics only - crashtest loader treats empty as unarmed' } },
  { id: 'armedByKey-non-string', mutate: { armedByKey: 7 }, expect: { refused: true, norms: ['armedByKey'] } },
  { id: 'armedByKey-ok', mutate: { armedByKey: 'wp-money' }, expect: { refused: false } },
  { id: 'unknown-key-allowed', mutate: { snapshot: 'host-owned extra' }, expect: { refused: false } },
  { id: 'host-owned-env-allowed', mutate: { env: { kv: {} } }, expect: { refused: false } },
  { id: 'manifest-invalid-json', malformed: true, expect: { refused: true, norms: ['manifest-invalid'] } },
  { id: 'manifest-missing', noManifest: true, expect: { refused: true, norms: ['manifest-missing'] } },
]

// Materialize one packs-root per shape in a temp dir, run the ACTUAL linter.
const tmp = mkdtempSync(join(tmpdir(), 'packstruct-matrix-'))
let failures = 0
const rows = []
try {
  for (const shape of BATTERY) {
    const packsRoot = join(tmp, shape.id, 'packs')
    const packDir = join(packsRoot, 'public', 'shape-pack')
    mkdirSync(packDir, { recursive: true })
    if (!shape.noManifest) {
      const serialized = shape.malformed ? '{"schemaVersion":1,' : `${JSON.stringify(manifestFor(shape), null, 2)}\n`
      writeFileSync(join(packDir, 'pack.json'), serialized)
    }
    // The entry file: present unless the shape points somewhere else.
    if (shape.mutate?.entry === undefined && !shape.drop?.includes('entry')) {
      writeFileSync(join(packDir, 'probes-entry.js'), 'export default { name: "battery", description: "probe", attacks: [] }\n')
    }
    const r = lintPacks(packsRoot)
    // ALL pack-level violations form the verdict (a shape can break
    // multiple norms at once - name-uppercase breaks kebab AND dir-match).
    const shapeViolations = r.violations.filter(v => !['usage', 'directory-contract'].includes(v.norm))
    const observed = shapeViolations.length
      ? { refused: true, norms: shapeViolations.map(v => v.norm) }
      : { refused: false, norms: [] }
    // EXACT match, BOTH directions. A subset check (observed ⊇ expected)
    // would pass a linter that grew STRICTER than the SPEC promises - an
    // extra norm on a shape the SPEC says is fine is the "ship a check the
    // SPEC never promised" defect, and it must fail the matrix exactly as
    // loudly as a missing one. Sorted set compare, so norm order never
    // matters.
    const expectedNorms = [...(shape.expect.norms ?? [])].sort()
    const observedNorms = [...observed.norms].sort()
    const honest = observed.refused === shape.expect.refused
      && expectedNorms.length === observedNorms.length
      && expectedNorms.every((n, i) => n === observedNorms[i])
    if (!honest) {
      failures++
      console.error(`MATRIX DISAGREES! shape ${shape.id}:\n  expected ${JSON.stringify(shape.expect)}\n  observed ${JSON.stringify(observed)}\n  raw: ${JSON.stringify(r.violations)}`)
    }
    rows.push({
      id: shape.id,
      manifest: shape.noManifest ? '(no pack.json)' : (shape.malformed ? '(malformed JSON)' : { ...base, ...(shape.mutate ?? {}) }),
      packstruct: observed,
      expected: shape.expect,
      honest,
    })
  }
  // The missing-public shape (root-level contract): separate tiny root.
  const noPublicRoot = join(tmp, 'missing-public', 'packs')
  mkdirSync(noPublicRoot, { recursive: true })
  const r = lintPacks(noPublicRoot)
  const obs = r.violations.some(v => v.norm === 'directory-contract')
  rows.push({ id: 'missing-public-dir', packstruct: { refused: obs, norms: obs ? ['directory-contract'] : [] }, expected: { refused: true, norms: ['directory-contract'] }, honest: obs })
  if (!obs) { failures++; console.error('MATRIX DISAGREES! missing-public-dir not refused') }

  if (failures) {
    console.error(`refusal matrix: ${failures} row(s) dishonest - refusing to write the matrix (fix the linter or the expectation, never the check)`)
    process.exit(1)
  }
  const matrixPath = join(ROOT, 'labs', 'refusal-matrix.packstruct.json')
  const batteryDir = join(ROOT, 'labs', 'refusal-battery')

  // Every artifact is computed as {path, contents} FIRST, so generate, check,
  // and write share one code path - the bytes checked are the bytes written.
  const artifacts = [{
    path: matrixPath,
    contents: JSON.stringify({ schema: 1, tool: 'packstruct lint', version: PKG_VERSION, rows }, null, 2) + '\n',
  }]
  // Portable battery for host columns (crashtest next; poststruct when online).
  for (const shape of BATTERY) {
    artifacts.push({
      path: join(batteryDir, `${shape.id}.json`),
      contents: JSON.stringify({
        id: shape.id,
        dirName: 'shape-pack',
        manifest: manifestFor(shape),
        writeEntryFile: !(shape.mutate?.entry ?? '').includes('..') && shape.mutate?.entry !== 'ghost.js' && !shape.noManifest && !shape.malformed,
        expect: { refused: shape.expect.refused, norms: shape.expect.norms },
        note: 'Hosts: materialize dirName/pack.json (create pack.json only when manifest is non-null; substitute the placeholder bytes for malformed), run YOUR validator over it, return { id, host: refused, norms }. Column 3 of the golden matrix (dhaupin/packstruct#3).',
      }, null, 2) + '\n',
    })
  }
  artifacts.push({
    path: join(batteryDir, 'missing-public-dir.json'),
    contents: JSON.stringify({ id: 'missing-public-dir', note: 'empty packs root (no public/) - expect a directory-contract refusal' }, null, 2) + '\n',
  })

  // --check: every receipt must MATCH what the linter does right now. Without
  // this the generator still exits 0 while rewriting its files, so a linter
  // change that flips a row ships a stale receipt green (the "can never
  // silently go stale" promise was unenforced in CI). Read-only: it exits
  // before any write, so a stale tree is left exactly as found.
  if (process.argv.includes('--check')) {
    const stale = artifacts.filter((a) => {
      try { return readFileSync(a.path, 'utf8') !== a.contents } catch { return true }
    })
    if (stale.length) {
      console.error(`refusal matrix is STALE: ${stale.length} receipt file(s) do not match the linter`)
      for (const a of stale) console.error(`  ${a.path.replace(ROOT + '/', '')}`)
      console.error('  regenerate with: node scripts/gen-refusal-matrix.mjs')
      process.exit(1)
    }
    console.log(`refusal matrix: ${rows.length} row(s), all honest, all ${artifacts.length} receipt file(s) in sync`)
    process.exit(0)
  }

  mkdirSync(batteryDir, { recursive: true })
  for (const a of artifacts) writeFileSync(a.path, a.contents)
  console.log(`refusal matrix: ${rows.length} row(s), all honest - labs/refusal-matrix.packstruct.json + labs/refusal-battery/ written`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
