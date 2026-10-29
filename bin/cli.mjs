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
import { newPack } from '../src/new.mjs'

let args = process.argv.slice(2)
const verb = args[0] === 'audit-conformance' ? 'audit-conformance'
  : args[0] === 'new' ? 'new'
  : 'lint'
if (args[0] === 'lint' || verb === 'audit-conformance' || verb === 'new') args = args.slice(1)

const exitUsage = (msg, usage) => {
  if (msg) console.error(msg)
  console.error(`Usage: ${usage}`)
  process.exit(2)
}

// Usage strings, one per verb (the usage ladder's exit 2 surface).
const USAGE_LINT = 'packstruct lint <packs-dir> [--json] [--deep] [--local] [--against <library-path>]'
const USAGE_AUDIT = 'packstruct audit-conformance [<repo-dir>] --loader "<cmd> {packs}" [--json]'
const USAGE_NEW = 'packstruct new <pack-name> [--dir <packs-root>] [--json]'

// Unknown-flag rejection (packstruct#18): a typo'd mode flag used to be
// silently ignored, so `--jso` ran text mode and `--dep` ran shallow - the
// wrong mode with no signal, the exact misfire class the tool exists to
// kill. Every leading-dash token must now be a recognized flag or the run
// refuses with the usage ladder's exit 2.
const rejectUnknownFlag = (a, have, usage) => exitUsage(`unknown flag "${a}" (have: ${have})`, usage)

// new (packstruct#24): generate a conforming pack skeleton at author time.
// The cheapest break class - a new author guessing the field list - dies
// even earlier if the starting point is generated correct. Refusals are
// the net; `new` is the trampoline. Its output is just another manifest
// the lint grades, so the lint stays the one truth.
if (verb === 'new') {
  let dir
  const dirIdx = args.indexOf('--dir')
  if (dirIdx !== -1) {
    dir = args[dirIdx + 1]
    if (dir === undefined || dir.startsWith('-')) exitUsage('--dir needs a value (the packs root to write into)', USAGE_NEW)
  }
  const positional = []
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--dir') { i++; continue }
    if (a === '--json') continue
    if (a.startsWith('-')) rejectUnknownFlag(a, '--dir <packs-root>, --json', USAGE_NEW)
    positional.push(a)
  }
  const name = positional[0]
  if (!name) exitUsage(undefined, USAGE_NEW)
  if (positional.length > 1) exitUsage(`new takes one pack name (got ${positional.length})`, USAGE_NEW)
  const r = newPack(name, { dir })
  const json = args.includes('--json')
  if (json) {
    console.log(JSON.stringify({ schema: 1, mode: 'new', name, dir: r.dir, packDir: r.packDir, files: r.files, violations: r.violations }, null, 2))
  } else {
    if (r.violations.length) {
      for (const v of r.violations) console.error(`  REFUSED [${v.norm}]: ${v.message}`)
    } else {
      console.log(`packstruct new: created ${r.packDir}`)
      for (const f of r.files) console.log(`  created ${f}`)
      console.log(`  next: packstruct lint ${r.dir}`)
    }
  }
  process.exit(r.violations.length ? 1 : 0)
}

if (verb === 'audit-conformance') {
  const loaderIdx = args.indexOf('--loader')
  let loader
  if (loaderIdx !== -1) {
    loader = args[loaderIdx + 1]
    if (loader === undefined || loader.startsWith('-')) {
      exitUsage('--loader needs a value: --loader "<cmd> {packs}"', USAGE_AUDIT)
    }
  }
  const positional = []
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--loader') { i++; continue }
    if (a === '--json') continue
    if (a.startsWith('-')) rejectUnknownFlag(a, '--loader <cmd>, --json', USAGE_AUDIT)
    positional.push(a)
  }
  if (loader === undefined) {
    exitUsage(undefined, USAGE_AUDIT)
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
    exitUsage(undefined, USAGE_LINT)
  }
}
const dirArgs = []
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--against') { i++; continue }
  if (a === '--deep' || a === '--json' || a === '--local') continue
  if (a.startsWith('-')) rejectUnknownFlag(a, '--deep, --json, --local, --against <path>', USAGE_LINT)
  dirArgs.push(a)
}

const dir = dirArgs[0]
if (!dir) exitUsage(undefined, USAGE_LINT)
const deep = args.includes('--deep')
const local = args.includes('--local')
if (against !== undefined && !deep) {
  exitUsage('--against requires --deep (the host-library census runs on the deep pass)', USAGE_LINT)
}

const r = deep
  ? await deepLintPacks(dir, { against, local })
  : lintPacks(dir, { local })
if (args.includes('--json')) {
  console.log(JSON.stringify({
    schema: 1,
    mode: deep ? 'deep' : 'manifest',
    packsChecked: r.packsChecked,
    localChecked: r.localChecked ?? 0,
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
const localNote = local ? `, ${r.localChecked ?? 0} local pack(s)` : ''
console.log(`packstruct ${mode}: ${r.packsChecked} pack(s) checked in ${dir}${localNote}${probe}`)
for (const v of r.violations) console.log(`  VIOLATION ${v.pack}${v.lane === 'local' ? ' [local]' : ''} [${v.norm}]: ${v.message}`)
process.exit(r.violations.length ? 1 : 0)
