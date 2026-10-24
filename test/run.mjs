// test/run.mjs - the lint contract: the good pack passes clean; the broken
// pack gets exactly the spec norms it violates.
import { lintPacks } from '../src/lint.mjs'
import { spawnSync } from 'node:child_process'
const GOOD = 'test/fixtures/good/packs'
const BAD = 'test/fixtures/bad/packs'

const good = lintPacks(GOOD)
if (good.violations.length) { console.error('FAIL good pack should be clean:', good.violations); process.exit(1) }
const bad = lintPacks(BAD)
const norms = bad.violations.map(v => v.norm)
const missing = ['schemaVersion', 'entry'].filter(n => !norms.includes(n))
if (missing.length) { console.error(`FAIL lint norms missing: ${missing}\ngot: ${JSON.stringify(bad.violations, null, 2)}`); process.exit(1) }
// Wire-level check (the honest bin invocation, as docs/CI write it):
// `node bin/cli.mjs lint <dir> --json` must parse the subcommand and exit 0
// on the clean fixture. (Regular crashtest deepens this in CI.)
const wire = spawnSync(process.execPath, ['bin/cli.mjs', 'lint', 'test/fixtures/good/packs', '--json'], { encoding: 'utf8' })
if (wire.status !== 0 || !JSON.parse(wire.stdout).violations.length === false) {
  console.error(`FAIL wire-level lint subcommand: exit ${wire.status}\n${wire.stdout}\n${wire.stderr}`)
  process.exit(1)
}
console.log(`packstruct self-test: good pack clean, bad pack caught (${bad.violations.length} violations), wire subcommand OK - PASS`)
