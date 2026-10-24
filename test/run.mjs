// test/run.mjs - the lint contract: the good pack passes clean; the broken
// pack gets exactly the spec norms it violates. Deep mode (packstruct#2)
// adds load-level parity: entry imports, default export presence, and the
// id census - fixtures both ways, per the house rule "adding a rule = cases
// both sides".
import { lintPacks, deepLintPacks } from '../src/lint.mjs'
import { auditConformance } from '../src/audit.mjs'
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
// Phase markers ship with the suite: on CI a hang used to be invisible
// (no partial logs while the step is running), so every phase prints its
// start marker and duration when done. Diagnostic, not decoration.
const t0 = Date.now()
const mark = (phase) => console.log(`[run] ${phase} (${Date.now() - t0}ms in)`)
mark('manifest mode')
const missing = ['schemaVersion', 'entry'].filter(n => !norms.includes(n))
if (missing.length) { console.error(`FAIL lint norms missing: ${missing}\ngot: ${JSON.stringify(bad.violations, null, 2)}`); process.exit(1) }
mark('manifest mode: assert done')

// --- deep mode, good side: clean manifest AND clean deep probe ---
mark('deep good: start')
const deepGood = await deepLintPacks(DEEP_GOOD)
mark(`deep good: done (${deepGood.idsCensused} ids)`) // start marker precedes; the count lands here
mark('deep good: assert done')
if (deepGood.violations.length) {
  console.error('FAIL deep good fixture should be clean:', deepGood.violations); process.exit(1)
}
if (deepGood.modulesProbed !== 1 || deepGood.idsCensused !== 5) {
  // demo-scenario: module 'input-probe' + attacks 'noop-attack', 'noisy-chain'
  // + steps 'warm-up', 'strike' = 5 ids censused, 1 module probed.
  console.error(`FAIL deep good counts: probed=${deepGood.modulesProbed} ids=${deepGood.idsCensused}`); process.exit(1)
}

// --- deep mode, bad side: exact norms expected, nothing more ---
mark('deep bad: start')
const deepBad = await deepLintPacks(DEEP_BAD)
mark(`deep bad: done (${deepBad.violations.length} violations)`)
mark('deep bad: assert done')
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
mark('--against clean: start')
const libGood = await deepLintPacks(DEEP_GOOD, { against: 'test/fixtures/deep/library-good.mjs' })
mark('--against clean: done')
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

// --- audit-conformance (M2, SPEC section 7): the bundled verdict-claiming
// cases against the loader, tested both ways per the house rule. Our own
// CLI stands in as the conforming loader (dogfood); a loader that accepts
// everything and one that refuses (and names) nothing must both fail the
// audit loudly.
mark('edge probe isolation: start')
const conformingLoader = `${process.execPath} bin/cli.mjs lint {packs}`
const auditGood = await auditConformance({ loader: `${process.execPath} test/fixtures/audit/loader-ok.mjs {packs}` })
if (auditGood.caseCount !== 8 || auditGood.honored !== 8 || auditGood.violations.length) {
  console.error(`FAIL audit-conformance: our own loader should honor all 8 bundled cases\ngot: honored=${auditGood.honored}/${auditGood.caseCount}\n${JSON.stringify(auditGood.violations, null, 2)}`)
  process.exit(1)
}
const auditAllAccept = await auditConformance({ loader: `${process.execPath} test/fixtures/audit/loader-always-ok.mjs {packs}` })
if (auditAllAccept.honored !== 1 || auditAllAccept.violations.length !== 7) {
  console.error(`FAIL audit-conformance accept-all loader should fail 7 refuse-cases: honored=${auditAllAccept.honored} violations=${auditAllAccept.violations.length}\n${JSON.stringify(auditAllAccept.violations, null, 2)}`)
  process.exit(1)
}
const auditNoName = await auditConformance({ loader: `${process.execPath} test/fixtures/audit/loader-no-name.mjs {packs}` })
if (auditNoName.honored !== 0 || auditNoName.violations.length !== 8) {
  console.error(`FAIL audit-conformance silent-refuser should fail all 8 (refusals must NAME the pack): honored=${auditNoName.honored}\n${JSON.stringify(auditNoName.violations, null, 2)}`)
  process.exit(1)
}

// --- QC edge/vuln pass: the probe crash classes. Pack code must never
// drive the linter's own process - a top-level exit() hijacked the wire
// exit (deep used to die with the ENTRY's code, output-less) and a
// spin-lock entry hung the CLI forever. Child isolation + timeout must
// turn both into honest entry-import refusals with the 0/1 contract. ---
const edgeKill = await deepLintPacks('test/fixtures/edge/exit/packs')
if (!(edgeKill.violations.length === 1 && edgeKill.violations[0].norm === 'entry-import' && edgeKill.violations[0].message.includes('terminated the probe process'))) {
  console.error(`FAIL edge exit-hijack should be ONE honest entry-import refusal:\n${JSON.stringify(edgeKill.violations, null, 2)}`)
  process.exit(1)
}
const edgeKillWire = spawnSync(process.execPath, ['bin/cli.mjs', 'lint', 'test/fixtures/edge/exit/packs', '--deep', '--json'], { encoding: 'utf8' })
if (edgeKillWire.status !== 1) {
  console.error(`FAIL edge exit-hijack wire exit must be 1 (the CLI's own contract, never the ENTRY's exit code 7): got ${edgeKillWire.status}\n${edgeKillWire.stdout}${edgeKillWire.stderr}`)
  process.exit(1)
}
const edgeSpin = await deepLintPacks('test/fixtures/edge/spin/packs', { probeTimeoutMs: 800 })
if (!(edgeSpin.violations.length === 1 && edgeSpin.violations[0].norm === 'entry-import' && edgeSpin.violations[0].message.includes('timeout'))) {
  console.error(`FAIL edge spin-lock should be one entry-import timeout refusal:\n${JSON.stringify(edgeSpin.violations, null, 2)}`)
  process.exit(1)
}

// --- QC vuln pass: the audit loader caps. A HOST loader is arbitrary code
// in its own shell, so the audit caps what can surprise it: an output
// flood above the 1MB spawn buffer is a no-verdict violation (never a
// harness crash), and a hung loader is killed at the audit timeout (a
// refusal is instant - hangs are neither accept nor refuse). ---
const auditFlood = await auditConformance({ loader: `${process.execPath} test/fixtures/audit/loader-flood.mjs {packs}`, auditTimeoutMs: 5000 })
if (!(auditFlood.violations.length === 8 && auditFlood.violations.every(v => v.message.includes('audit buffer')))) {
  console.error(`FAIL audit output-flood should fail all 8 cases with the buffer cap named:\n${JSON.stringify(auditFlood.violations, null, 2)}`)
  process.exit(1)
}
const auditHung = await auditConformance({ loader: "sleep 9999 # {packs}", auditTimeoutMs: 400 })
if (!(auditHung.violations.length === 8 && auditHung.violations.every(v => v.message.includes('audit timeout')))) {
  console.error(`FAIL audit hung loader should fail all 8 cases with the timeout named:\n${JSON.stringify(auditHung.violations, null, 2)}`)
  process.exit(1)
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

// --- wire-level audit-conformance: honored run + the usage gate ---
const wireAudit = spawnSync(process.execPath, ['bin/cli.mjs', 'audit-conformance', '--loader', conformingLoader, '--json'], { encoding: 'utf8' })
let auditJson
try { auditJson = JSON.parse(wireAudit.stdout) } catch { auditJson = null }
if (wireAudit.status !== 0 || !auditJson || auditJson.mode !== 'audit' || auditJson.honored !== auditJson.cases || auditJson.violations.length !== 0) {
  console.error(`FAIL wire-level audit-conformance: exit ${wireAudit.status}\n${wireAudit.stdout}\n${wireAudit.stderr}`)
  process.exit(1)
}
mark('wire-level audit: start')
const wireAuditUsage = spawnSync(process.execPath, ['bin/cli.mjs', 'audit-conformance'], { encoding: 'utf8', timeout: 60000 })
mark('wire-level audit: done')
if (wireAuditUsage.status !== 2) {
  console.error(`FAIL audit-conformance without --loader should exit 2 (got ${wireAuditUsage.status})\n${wireAuditUsage.stderr}`)
  process.exit(1)
}

console.log(`packstruct self-test: good pack clean, bad pack caught (${bad.violations.length} violations), wire subcommand OK, deep pass/bad both ways (${deepGood.idsCensused} ids censused good-side, ${deepBad.violations.length} deep violations bad-side), --against both ways (${libGood.libraryIds} seeded clean, ${libBad.violations.filter(v => v.norm === 'id-library-collision').length} library collisions), audit-conformance both ways (${auditGood.honored}/${auditGood.caseCount} honored by our own loader, accept-all loader ${auditAllAccept.violations.length} audit failures, silent refuser ${auditNoName.violations.length}), edge probe isolation (exit-hijack and spin-lock refuse honestly, wire exit 1), audit caps (output flood ${auditFlood.violations.length}/8, hung loader ${auditHung.violations.length}/8) - PASS`)
