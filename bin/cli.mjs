#!/usr/bin/env node
// bin/cli.mjs - packstruct lint <packs-dir> [--json]
import { lintPacks } from '../src/lint.mjs'

const args = process.argv.slice(2)
const dir = args.find(a => !a.startsWith('-'))
if (!dir) {
  console.error('Usage: packstruct lint <packs-dir> [--json]')
  process.exit(2)
}
const r = lintPacks(dir)
if (args.includes('--json')) {
  console.log(JSON.stringify({ schema: 1, packsChecked: r.packsChecked, violations: r.violations }, null, 2))
  process.exit(r.violations.length ? 1 : 0)
}
console.log(`packstruct lint: ${r.packsChecked} pack(s) checked in ${dir}`)
for (const v of r.violations) console.log(`  VIOLATION ${v.pack} [${v.norm}]: ${v.message}`)
process.exit(r.violations.length ? 1 : 0)
