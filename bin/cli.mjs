#!/usr/bin/env node
// bin/cli.mjs - packstruct lint <packs-dir> [--json] [--deep] [--against <path>]
// Accepts either `packstruct lint <dir>` or `packstruct <dir>` (the lint
// subcommand token is stripped when present; a target dir genuinely named
// 'lint' must not break the parser either way).
//
// --deep (packstruct#2): after the manifest pass, imports each declared
// entry once in-process, checks the default export exists, and censuses
// ids (module/attack/check/step names across the corpus) - mirrors the
// engine's shared-`seen` collision refusal (crashtest fc93ca6
// src/packs/loader.js :389-391) at author time. Probe only: host contract
// shapes stay host-owned (SPEC section 3). Importing runs the entry's
// top-level code; data modules are inert, and hostile modules are the
// host's isolation domain, not the linter's.
//
// --against <file-or-dir> (packstruct#2, requires --deep): seed the census
// with the HOST LIBRARY ids so pack-vs-library collisions refuse at author
// time (`id-library-collision`). Accepts a JSON file or an ESM module /
// directory of modules whose default exports carry ids (any house profile
// shape, generically probed).
import { lintPacks, deepLintPacks } from '../src/lint.mjs'

let args = process.argv.slice(2)
if (args[0] === 'lint') args = args.slice(1)

// --against consumes the next arg as its value; strip both from the dir scan.
const againstIdx = args.indexOf('--against')
let against
if (againstIdx !== -1) {
  against = args[againstIdx + 1]
  if (against === undefined || against.startsWith('-')) {
    console.error('Usage: packstruct lint <packs-dir> [--json] [--deep] [--against <library-path>]')
    process.exit(2)
  }
}
const dirArgs = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--against') { i++; continue }
  dirArgs.push(args[i])
}

const dir = dirArgs.find(a => !a.startsWith('-'))
if (!dir) {
  console.error('Usage: packstruct lint <packs-dir> [--json] [--deep] [--against <library-path>]')
  process.exit(2)
}
const deep = dirArgs.includes('--deep') || args.includes('--deep')
if (against !== undefined && !deep) {
  console.error('--against requires --deep (the host-library census runs on the deep pass)')
  process.exit(2)
}

const r = deep
  ? await deepLintPacks(dir, { against })
  : lintPacks(dir)
if (dirArgs.includes('--json') || args.includes('--json')) {
  console.log(JSON.stringify({
    schema: 1,
    mode: deep ? 'deep' : 'manifest',
    packsChecked: r.packsChecked,
    modulesProbed: r.modulesProbed,
    idsCensused: r.idsCensused,
    libraryIds: r.libraryIds ?? 0,
    violations: r.violations,
  }, null, 2))
  process.exit(r.violations.length ? 1 : 0)
}
const mode = deep ? 'lint --deep' : 'lint'
const probe = deep
  ? ` - ${r.modulesProbed} module(s) probed, ${r.idsCensused} id(s) censused` +
    (against !== undefined ? `, ${r.libraryIds ?? 0} library id(s) seeded` : '')
  : ''
console.log(`packstruct ${mode}: ${r.packsChecked} pack(s) checked in ${dir}${probe}`)
for (const v of r.violations) console.log(`  VIOLATION ${v.pack} [${v.norm}]: ${v.message}`)
process.exit(r.violations.length ? 1 : 0)
