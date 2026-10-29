// test/run.mjs - the lint contract: the good pack passes clean; the broken
// pack gets exactly the spec norms it violates. Deep mode (packstruct#2)
// adds load-level parity: entry imports, default export presence, and the
// id census - fixtures both ways, per the house rule "adding a rule = cases
// both sides".
import { lintPacks, deepLintPacks } from '../src/lint.mjs'
import { auditConformance } from '../src/audit.mjs'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const GOOD = 'test/fixtures/good/packs'
const BAD = 'test/fixtures/bad/packs'
const DEEP_GOOD = 'test/fixtures/deep/good/packs'
const DEEP_BAD = 'test/fixtures/deep/bad/packs'
const LOCAL_GOOD = 'test/fixtures/local/good/packs'
const LOCAL_BAD = 'test/fixtures/local/bad/packs'

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

// --- packstruct#16: the local lane is opt-in. Default stays public-only
// (byte-compatible); --local surfaces the gitignored WIP lane's defects,
// each tagged lane:'local' so a CI consumer can tell the lanes apart.
// Fixtures both ways, per the house rule. ---
mark('local lane: start')
const localDefaultGood = lintPacks(LOCAL_GOOD)
if (localDefaultGood.violations.length) { console.error('FAIL local-good default should be clean:', localDefaultGood.violations); process.exit(1) }
const localDefaultBad = lintPacks(LOCAL_BAD)
if (localDefaultBad.violations.length) { console.error('FAIL the local lane is invisible by default (the public side is clean):', localDefaultBad.violations); process.exit(1) }
const localOnGood = lintPacks(LOCAL_GOOD, { local: true })
if (localOnGood.violations.length || localOnGood.localChecked !== 1) {
  console.error(`FAIL local-good --local should be clean and count 1 local pack: ${JSON.stringify(localOnGood)}`); process.exit(1)
}
const localOnBad = lintPacks(LOCAL_BAD, { local: true })
const localViol = localOnBad.violations.filter(v => v.lane === 'local')
if (localViol.length !== 1 || localViol[0].norm !== 'manifest-invalid' || localViol[0].pack !== 'wip-broken' || localOnBad.localChecked !== 1) {
  console.error(`FAIL local-bad --local should surface ONE lane-tagged manifest-invalid refusal:\n${JSON.stringify(localOnBad.violations, null, 2)}`); process.exit(1)
}
const deepLocalGood = await deepLintPacks(LOCAL_GOOD, { local: true })
if (deepLocalGood.violations.length || deepLocalGood.localChecked !== 1 || deepLocalGood.modulesProbed !== 2) {
  console.error(`FAIL deep --local good should probe both lanes cleanly: ${JSON.stringify(deepLocalGood)}`); process.exit(1)
}
mark('local lane: assert done')

// --- packstruct#13/#17/#18: the wrong-argument + unknown-flag lanes. The
// natural first-time gestures (the public/ dir itself, one pack dir, the
// repo root) answer with a `usage` hint naming the fix - never the
// doubled-segment directory-contract nonsense that blamed the hypothetical
// packs under the arg. A typo'd mode flag refuses with exit 2 instead of
// silently running the wrong mode. ---
mark('usage lanes: start')
const cli = (args) => spawnSync(process.execPath, ['bin/cli.mjs', ...args], { encoding: 'utf8' })
const hintCases = [
  { args: ['lint', 'packs/public'], want: /public\/ directory itself/ },
  { args: ['lint', `${GOOD}/public/demo-pack`], want: /single pack/ },
  { args: ['lint', `${GOOD}/public/demo-pack/entry.mjs`], want: /is a file/ },
  { args: ['lint', '.'], want: /repo root/ },
]
for (const c of hintCases) {
  const r = cli(c.args)
  if (r.status !== 1 || !r.stdout.includes('[usage]') || !c.want.test(r.stdout)) {
    console.error(`FAIL usage hint for '${c.args.join(' ')}': exit ${r.status}\n${r.stdout}${r.stderr}`); process.exit(1)
  }
}
const unknownFlag = cli(['lint', GOOD, '--jso'])
if (unknownFlag.status !== 2 || !/unknown flag "--jso"/.test(unknownFlag.stderr)) {
  console.error(`FAIL unknown flag should exit 2 naming it: exit ${unknownFlag.status}\n${unknownFlag.stderr}`); process.exit(1)
}
const unknownAuditFlag = cli(['audit-conformance', '--loader', 'true {packs}', '--jso'])
if (unknownAuditFlag.status !== 2) { console.error(`FAIL unknown audit flag should exit 2: got ${unknownAuditFlag.status}`); process.exit(1) }
mark('usage lanes: assert done')

// --- wire-level --local JSON (additive key, lane-tagged rows) ---
const wireLocalDefault = cli(['lint', LOCAL_BAD, '--json'])
const localDefaultJson = JSON.parse(wireLocalDefault.stdout)
if (wireLocalDefault.status !== 0 || localDefaultJson.localChecked !== 0 || localDefaultJson.violations.some(v => v.lane)) {
  console.error(`FAIL wire --local default should stay public-only, exit 0:\n${wireLocalDefault.stdout}`); process.exit(1)
}
const wireLocal = cli(['lint', LOCAL_BAD, '--local', '--json'])
const localJson = JSON.parse(wireLocal.stdout)
if (wireLocal.status !== 1 || localJson.localChecked !== 1 || !localJson.violations.some(v => v.lane === 'local')) {
  console.error(`FAIL wire --local should exit 1 with a lane-tagged local row:\n${wireLocal.stdout}`); process.exit(1)
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
// in its own shell, so the audit caps what can surprise it: output past
// the 1MB spawn buffer and a hung loader are BOTH honest no-verdict
// outcomes (a refusal is instant - hangs and floods are neither accept
// nor refuse). The invariant asserted is that the loader graded nothing:
// every row must be killed and unobservable, by cap OR by timeout. Which
// mechanism fires is platform-dependent (node 22 flushes a sync flood
// straight to the pipe; node 20 queues it in the child until killed - so
// CI trips the timeout floor while local tripped the cap), and grading
// the mechanism would flake by runner, not by contract. The machine-
// specific path lives in runCapped; the contract lives here. ---
const auditFlood = await auditConformance({ loader: `${process.execPath} test/fixtures/audit/loader-flood.mjs {packs}`, auditTimeoutMs: 5000 })
const floodUnobservable = v => v.message.includes('audit buffer') || v.message.includes('audit timeout')
if (!(auditFlood.violations.length === 8 && auditFlood.violations.every(floodUnobservable) && auditFlood.violations.some(v => v.message.includes('audit buffer') || v.message.includes('audit timeout')))) {
  console.error(`FAIL audit flood loader must grade nothing on all 8 cases (cap or timeout, both honest):\n${JSON.stringify(auditFlood.violations, null, 2)}`)
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

// --- packstruct#24: `new` scaffolds a pack the lint accepts clean the
// moment it lands (the trampoline before the nets), and refuses the two
// author mistakes by name without writing anything. ---
mark('new scaffold: start')
const newRoot = mkdtempSync(join(tmpdir(), 'packstruct-new-'))
mkdirSync(join(newRoot, 'packs', 'public'), { recursive: true })
const newRun = spawnSync(process.execPath, ['bin/cli.mjs', 'new', 'scaffold-pack', '--dir', join(newRoot, 'packs'), '--json'], { encoding: 'utf8', cwd: process.cwd() })
const newJson = JSON.parse(newRun.stdout)
if (newRun.status !== 0 || newJson.violations.length || newJson.files.length !== 2) {
  console.error(`FAIL new should scaffold clean: exit ${newRun.status}\n${newRun.stdout}${newRun.stderr}`); process.exit(1)
}
// The generated skeleton is just another manifest: the lint must pass it
// clean, deep included (its stub exports a default with no colliding ids).
const newLint = spawnSync(process.execPath, ['bin/cli.mjs', 'lint', join(newRoot, 'packs'), '--deep', '--json'], { encoding: 'utf8' })
if (newLint.status !== 0 || JSON.parse(newLint.stdout).violations.length !== 0) {
  console.error(`FAIL the scaffolded pack should lint clean (deep): exit ${newLint.status}\n${newLint.stdout}${newLint.stderr}`); process.exit(1)
}
// Refusals by name, non-destructive: bad name, then the occupied target.
const newBadName = spawnSync(process.execPath, ['bin/cli.mjs', 'new', 'BadName', '--dir', join(newRoot, 'packs'), '--json'], { encoding: 'utf8' })
if (newBadName.status !== 1 || JSON.parse(newBadName.stdout).violations[0].norm !== 'name-kebab-case') {
  console.error(`FAIL new should refuse a bad name by name: exit ${newBadName.status}\n${newBadName.stdout}`); process.exit(1)
}
const newOccupied = spawnSync(process.execPath, ['bin/cli.mjs', 'new', 'scaffold-pack', '--dir', join(newRoot, 'packs'), '--json'], { encoding: 'utf8' })
if (newOccupied.status !== 1 || JSON.parse(newOccupied.stdout).violations[0].norm !== 'pack-exists') {
  console.error(`FAIL new should refuse to clobber an occupied target: exit ${newOccupied.status}\n${newOccupied.stdout}`); process.exit(1)
}
const newNoName = spawnSync(process.execPath, ['bin/cli.mjs', 'new'], { encoding: 'utf8' })
if (newNoName.status !== 2) { console.error(`FAIL new with no name should exit 2 (usage): got ${newNoName.status}`); process.exit(1) }
rmSync(newRoot, { recursive: true, force: true })
mark('new scaffold: assert done')

console.log(`packstruct self-test: good pack clean, bad pack caught (${bad.violations.length} violations), wire subcommand OK, deep pass/bad both ways (${deepGood.idsCensused} ids censused good-side, ${deepBad.violations.length} deep violations bad-side), --against both ways (${libGood.libraryIds} seeded clean, ${libBad.violations.filter(v => v.norm === 'id-library-collision').length} library collisions), local lane (${localOnGood.localChecked} opt-in pack clean, ${localViol.length} lane-tagged refusal both ways), usage lanes (${hintCases.length} wrong-arg hints, unknown flag exit 2), audit-conformance both ways (${auditGood.honored}/${auditGood.caseCount} honored by our own loader, accept-all loader ${auditAllAccept.violations.length} audit failures, silent refuser ${auditNoName.violations.length}), edge probe isolation (exit-hijack and spin-lock refuse honestly, wire exit 1), audit caps (output flood ${auditFlood.violations.length}/8, hung loader ${auditHung.violations.length}/8), new scaffold (lint-clean by construction, refusals named both ways) - PASS`)
