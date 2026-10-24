// test/run.mjs - the lint contract: the good pack passes clean; the broken
// pack gets exactly the spec norms it violates. Deep mode (packstruct#2)
// adds load-level parity: entry imports, default export presence, and the
// id census - fixtures both ways, per the house rule "adding a rule = cases
// both sides".
import { lintPacks, deepLintPacks } from '../src/lint.mjs'
import { spawnSync } from 'node:child_process'
const GOOD = 'test/fixtures/good/packs'
const BAD = 'test/fixtures/bad/packs'
const DEEP_GOOD = 'test/fixtures/deep/good/packs'
const DEEP_BAD = 'test/fixtures/deep/bad/packs'

// --- manifest mode (unchanged contract) ---
const good = lintPacks(GOOD)
if (good.violations.length) { console.error('FAIL good pack should be clean:', good.violations); process.exit(1) }
const bad = lintPacks(BAD)
const norms = bad.violations.map(v => v.norm)
const missing = ['schemaVersion', 'entry'].filter(n => !norms.includes(n))
if (missing.length) { console.error(`FAIL lint norms missing: ${missing}\ngot: ${JSON.stringify(bad.violations, null, 2)}`); process.exit(1) }

// --- deep mode, good side: clean manifest AND clean deep probe ---
const deepGood = await deepLintPacks(DEEP_GOOD)
if (deepGood.violations.length) {
  console.error('FAIL deep good fixture should be clean:', deepGood.violations); process.exit(1)
}
if (deepGood.modulesProbed !== 1 || deepGood.idsCensused !== 5) {
  // demo-scenario: module 'input-probe' + attacks 'noop-attack', 'noisy-chain'
  // + steps 'warm-up', 'strike' = 5 ids censused, 1 module probed.
  console.error(`FAIL deep good counts: probed=${deepGood.modulesProbed} ids=${deepGood.idsCensused}`); process.exit(1)
}

// --- deep mode, bad side: exact norms expected, nothing more ---
const deepBad = await deepLintPacks(DEEP_BAD)
const deepNorms = new Set(deepBad.violations.map(v => v.norm))
for (const want of ['entry-default-export', 'id-collision', 'id-duplicate']) {
  if (!deepNorms.has(want)) {
    console.error(`FAIL deep norms missing: ${want}\ngot: ${JSON.stringify(deepBad.violations, null, 2)}`); process.exit(1)
  }
}
// duplicate-attack within a pack is also caught by the census (id-duplicate)
if (!deepNorms.has('id-duplicate')) {
  console.error(`FAIL deep norms missing: id-duplicate\ngot: ${JSON.stringify(deepBad.violations, null, 2)}`); process.exit(1)
}

// --- deep + --against (host-library census): clean library = 2 ids seeded,
// no collisions; colliding library = id-library-collision rows ---
const libGood = await deepLintPacks(DEEP_GOOD, { against: 'test/fixtures/deep/library-good.mjs' })
if (libGood.violations.length) {
  console.error('FAIL deep --against clean library should not violate:', libGood.violations); process.exit(1)
}
if (libGood.libraryIds !== 2) {
  console.error(`FAIL --against clean library seeded ${libGood.libraryIds} ids (want 2)`); process.exit(1)
}
const libBad = await deepLintPacks(DEEP_GOOD, { against: 'test/fixtures/deep/library-bad.mjs' })
if (!libBad.violations.some(v => v.norm === 'id-library-collision')) {
  console.error(`FAIL colliding library should yield id-library-collision:\n${JSON.stringify(libBad.violations, null, 2)}`); process.exit(1)
}

// --- wire-level checks (the honest bin invocation, as docs/CI write it) ---
const wire = spawnSync(process.execPath, ['bin/cli.mjs', 'lint', GOOD, '--json'], { encoding: 'utf8' })
if (wire.status !== 0 || JSON.parse(wire.stdout).violations.length !== 0) {
  console.error(`FAIL wire-level lint subcommand: exit ${wire.status}\n${wire.stdout}\n${wire.stderr}`)
  process.exit(1)
}
const wireDeep = spawnSync(process.execPath, ['bin/cli.mjs', 'lint', DEEP_GOOD, '--deep', '--json'], { encoding: 'utf8' })
let deepJson
try { deepJson = JSON.parse(wireDeep.stdout) } catch { deepJson = null }
if (wireDeep.status !== 0 || !deepJson || deepJson.mode !== 'deep' || deepJson.violations.length !== 0) {
  console.error(`FAIL wire-level --deep: exit ${wireDeep.status}\n${wireDeep.stdout}\n${wireDeep.stderr}`)
  process.exit(1)
}
const wireDeepBad = spawnSync(process.execPath, ['bin/cli.mjs', 'lint', DEEP_BAD, '--deep', '--json'], { encoding: 'utf8' })
if (wireDeepBad.status === 0) {
  console.error(`FAIL deep bad fixture should exit 1 on the wire (got 0):\n${wireDeepBad.stdout}`)
  process.exit(1)
}

const wireAgainst = spawnSync(process.execPath, ['bin/cli.mjs', 'lint', DEEP_GOOD, '--deep', '--against', 'test/fixtures/deep/library-good.mjs', '--json'], { encoding: 'utf8' })
const againstJson = JSON.parse(wireAgainst.stdout)
if (wireAgainst.status !== 0 || againstJson.libraryIds !== 2) {
  console.error(`FAIL wire-level --against: exit ${wireAgainst.status}\n${wireAgainst.stdout}\n${wireAgainst.stderr}`)
  process.exit(1)
}
console.log(`packstruct self-test: good pack clean, bad pack caught (${bad.violations.length} violations), wire subcommand OK, deep pass/bad both ways (${deepGood.idsCensused} ids censused good-side, ${deepBad.violations.length} deep violations bad-side), --against both ways (${libGood.libraryIds} seeded clean, ${libBad.violations.filter(v => v.norm === 'id-library-collision').length} library collisions) - PASS`)
