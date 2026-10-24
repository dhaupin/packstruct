// test/fixtures/audit/loader-ok.mjs - the CONFORMING test loader, as a real
// file (the QC pass stopped trusting inline `-e` quoting: CI's shell mangled
// a correctly-written -e template into erratic child deaths; a fixture file
// has no such freedom).
//
// Contract: argv[2] is the packs root; this shim runs the repo's own CLI
// exactly the way a user and CI do (`node bin/cli.mjs lint <dir> --json`,
// output inherited). Honesty comes from borrowing the audited code path,
// not from reimplementing a verdict.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('../../../bin/cli.mjs', import.meta.url))
const packs = process.argv[2]
if (!packs) {
  console.error('pipeline: no packs root passed')
  process.exit(2)
}
const r = spawnSync(process.execPath, [cli, 'lint', packs, '--json'], { stdio: 'inherit' })
process.exit(r.status ?? 1)
