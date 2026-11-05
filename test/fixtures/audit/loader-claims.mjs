// test/fixtures/audit/loader-claims.mjs - a CONFORMING, env-HONORING test
// loader. It does what a real host loader does: run the packstruct lint over
// the bundle (accept conforming, refuse-with-the-pack-named on a violation),
// then ECHO the host-owned `env` claims block it honored as
//   packstruct:env-claims <claims-json>
// on stdout. That echo is the whole point of `audit-conformance --claims`:
// a loader that silently ignores `env` passes the default audit and fails
// this leg (packstruct#71 - the spec'd-but-undogfooded block).
//
// Honesty comes from borrowing the audited lint code path for the verdict,
// then reporting the manifest's own env block verbatim - never reimplementing
// a verdict and never inventing claims.
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('../../../bin/cli.mjs', import.meta.url))
const packs = process.argv[2]
if (!packs) {
  console.error('pipeline: no packs root passed')
  process.exit(2)
}
const r = spawnSync(process.execPath, [cli, 'lint', packs, '--json'], { stdio: 'inherit' })
if (r.status !== 0) process.exit(r.status ?? 1)

// Accepted: report every declared env block, exactly as the manifest states
// it (the host owns the semantics; the loader reports what it carried).
const publicDir = join(packs, 'public')
if (existsSync(publicDir)) {
  for (const dir of readdirSync(publicDir)) {
    const manifest = join(publicDir, dir, 'pack.json')
    if (!existsSync(manifest)) continue
    let m
    try { m = JSON.parse(readFileSync(manifest, 'utf8')) } catch { continue }
    if (m && m.env && typeof m.env === 'object') {
      process.stdout.write(`packstruct:env-claims ${JSON.stringify(m.env)}\n`)
    }
  }
}
process.exit(0)
