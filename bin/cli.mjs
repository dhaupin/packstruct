#!/usr/bin/env node
// bin/cli.mjs - the packstruct CLI, zero dependencies.
//
//   packstruct lint <packs-dir> [--json] [--deep] [--against <path>]
//   packstruct audit-conformance [<repo-dir>] --loader "<cmd> {packs}" [--json]
//
// The lint subcommand token is stripped when present, and a bare
// `packstruct <dir>` keeps working (the dir positionally implies lint; a
// target dir genuinely named 'lint' must not break the parser either way).
//
// lint --deep (packstruct#2): after the manifest pass, probes each declared
// entry in a DISPOSABLE CHILD PROCESS (pack code runs nowhere near the
// linter's own process or exit code - the QC finding: a top-level exit()
// used to hijack the wire exit and a spin-lock entry hung the CLI), checks
// the default export exists, and censuses ids (module/attack/check/step
// names across the corpus) - mirrors the engine's shared-`seen` collision
// refusal (crashtest fc93ca6 src/packs/loader.js :389-391) at author time.
// Probe only: host contract shapes stay host-owned (SPEC section 3).
// Probing runs the entry's top-level code - in the child's domain, not
// the linter's; a 5s probe timeout makes stalls honest refusals.
//
// lint --against <file-or-dir> (packstruct#2, requires --deep): seed the
// census with the HOST LIBRARY ids so pack-vs-library collisions refuse at
// author time (`id-library-collision`). Accepts a JSON file or an ESM
// module / directory of modules whose default exports carry ids (any house
// profile shape, generically probed).
//
// audit-conformance (M2, SPEC section 7): materializes the bundled
// verdict-claiming fixture cases into scratch roots and runs the HOST's own
// loader command over each. A conforming loader accepts the clean case
// (exit 0) and refuses every violation case with a non-zero exit that NAMES
// the offending pack (SPEC section 5, identity match - the host may word
// its refusal however it likes). Exit contract: 0 all cases honored,
// 1 any case failed, 2 usage error - same ladder as lint.
import { lintPacks, deepLintPacks } from '../src/lint.mjs'
import { auditConformance } from '../src/audit.mjs'

let args = process.argv.slice(2)
const verb = args[0] === 'audit-conformance' ? 'audit-conformance' : 'lint'
if (args[0] === 'lint' || verb === 'audit-conformance') args = args.slice(1)

const exitUsage = (msg, usage) => {
  if (msg) console.error(msg)
  console.error(`Usage: ${usage}`)
  process.exit(2)
}

if (verb === 'audit-conformance') {
  const loaderIdx = args.indexOf('--loader')
  let loader
  if (loaderIdx !== -1) {
    loader = args[loaderIdx + 1]
    if (loader === undefined || loader.startsWith('-')) {
      exitUsage('--loader needs a value: --loader "<cmd> {packs}"', 'packstruct audit-conformance [<repo-dir>] --loader "<cmd> {packs}" [--json]')
    }
  }
  const positional = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--loader') { i++; continue }
    if (!args[i].startsWith('-')) positional.push(args[i])
  }
  if (loader === undefined) {
    exitUsage(undefined, 'packstruct audit-conformance [<repo-dir>] --loader "<cmd> {packs}" [--json]')
  }
  const repo = positional[0] ?? '.'
  const json = args.includes('--json')
  const r = await auditConformance({ loader, repo, json })
  if (json) {
    console.log(JSON.stringify({ schema: 1, mode: 'audit', repo, cases: r.caseCount, honored: r.honored, violations: r.violations }, null, 2))
  } else {
    console.log(`packstruct audit-conformance: ${r.honored}/${r.caseCount} case(s) honored by the loader over ${repo}`)
    for (const v of r.violations) console.log(`  AUDIT ${v.pack} [${v.norm}]: ${v.message}`)
  }
  process.exit(r.violations.length ? 1 : 0)
}

// --- lint verb (below unchanged contract) ---
const againstIdx = args.indexOf('--against')
let against
if (againstIdx !== -1) {
  against = args[againstIdx + 1]
  if (against === undefined || against.startsWith('-')) {
    exitUsage(undefined, 'packstruct lint <packs-dir> [--json] [--deep] [--against <library-path>]')
  }
}
const dirArgs = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--against') { i++; continue }
  dirArgs.push(args[i])
}

const dir = dirArgs.find(a => !a.startsWith('-'))
if (!dir) exitUsage(undefined, 'packstruct lint <packs-dir> [--json] [--deep] [--against <library-path>]')
const deep = dirArgs.includes('--deep') || args.includes('--deep')
if (against !== undefined && !deep) {
  exitUsage('--against requires --deep (the host-library census runs on the deep pass)', 'packstruct lint <packs-dir> [--json] [--deep] [--against <library-path>]')
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
