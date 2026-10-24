#!/usr/bin/env node
// bin/cli.mjs - packstruct lint <packs-dir> [--json] [--deep]
// Accepts either `packstruct lint <dir>` or `packstruct <dir>` (the lint
// subcommand token is stripped when present; a target dir genuinely named
// 'lint' must not break the parser either way).
//
// --deep (packstruct#2): after the manifest pass, imports each declared
// entry once in-process, checks the default export exists, and censuses
// ids (module/attack/check/step names across the corpus) - mirrors the
// engine's
// shared-`seen` collision refusal (crashtest fc93ca6 src/packs/loader.js
// :389-391) at author time. Probe only: host contract shapes stay
// host-owned (SPEC section 3). importing runs the entry's top-level code;
// data modules are inert, and hostile modules are the host's isolation
// domain, not the linter's.
import { lintPacks, deepLintPacks } from '../src/lint.mjs'

let args = process.argv.slice(2)
if (args[0] === 'lint') args = args.slice(1)
const dir = args.find(a => !a.startsWith('-'))
if (!dir) {
  console.error('Usage: packstruct lint <packs-dir> [--json] [--deep]')
  process.exit(2)
}
const deep = args.includes('--deep')
const r = deep
  ? await deepLintPacks(dir)
  : lintPacks(dir)
if (args.includes('--json')) {
  console.log(JSON.stringify({
    schema: 1,
    mode: deep ? 'deep' : 'manifest',
    packsChecked: r.packsChecked,
    modulesProbed: r.modulesProbed,
    idsCensused: r.idsCensused,
    violations: r.violations,
  }, null, 2))
  process.exit(r.violations.length ? 1 : 0)
}
const mode = deep ? 'lint --deep' : 'lint'
const probe = deep
  ? ` - ${r.modulesProbed} module(s) probed, ${r.idsCensused} id(s) censused`
  : ''
console.log(`packstruct ${mode}: ${r.packsChecked} pack(s) checked in ${dir}${probe}`)
for (const v of r.violations) console.log(`  VIOLATION ${v.pack} [${v.norm}]: ${v.message}`)
process.exit(r.violations.length ? 1 : 0)
