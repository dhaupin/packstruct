// test/run.mjs - the lint contract: the good pack passes clean; the broken
// pack gets exactly the spec norms it violates.
import { lintPacks } from '../src/lint.mjs'
const GOOD = 'test/fixtures/good/packs'
const BAD = 'test/fixtures/bad/packs'

const good = lintPacks(GOOD)
if (good.violations.length) { console.error('FAIL good pack should be clean:', good.violations); process.exit(1) }
const bad = lintPacks(BAD)
const norms = bad.violations.map(v => v.norm)
const missing = ['schemaVersion', 'entry'].filter(n => !norms.includes(n))
if (missing.length) { console.error(`FAIL lint norms missing: ${missing}\ngot: ${JSON.stringify(bad.violations, null, 2)}`); process.exit(1) }
console.log(`packstruct self-test: good pack clean, bad pack caught (${bad.violations.length} violations) - PASS`)
