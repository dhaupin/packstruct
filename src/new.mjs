// src/new.mjs - packstruct new: generate a conforming pack skeleton at
// author time (packstruct#24). Zero dependencies; no network.
//
// The charter is to kill broken pack manifests at author time. The cheapest
// break class - a new author guessing the field list from a friend's
// manifest, forgetting version's dotted form, getting name/dir parity wrong -
// dies even earlier if the starting point is GENERATED correct instead of
// post-hoc refused. Refusals are the net; a conforming skeleton is the
// trampoline. `new` is pure convenience: its output is just another manifest
// the lint grades, so the lint stays the one truth enforcer.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'

const KEBAB = /^[a-z0-9][a-z0-9-]*$/

// The default version: a fresh pack is pre-1.0 by convention (the shipped
// packstruct-lint-shapes pack and the deep fixtures all start at 0.1.0).
const DEFAULT_VERSION = '0.1.0'

// The packs ROOT for a run. --dir wins; else walk up from cwd looking for
// an existing `packs/` (the git-style discovery every host repo satisfies);
// else fall back to ./packs so the output is always a lint-clean tree
// (<root>/public/<name>/), never a bare pack dir the lint would refuse.
export function resolvePacksRoot(cwd, dir) {
  if (dir) return resolve(cwd, dir)
  let cur = resolve(cwd)
  for (;;) {
    const candidate = join(cur, 'packs')
    if (existsSync(join(candidate, 'public'))) return candidate
    const parent = dirname(cur)
    if (parent === cur) break
    cur = parent
  }
  return join(resolve(cwd), 'packs')
}

function entryStub(name) {
  // ESM default export (the #19 section 3 clarifier: the default export is
  // the loaded thing). Neutral shape - name + description only, no ids - so
  // it deep-lints clean with nothing to collide against.
  return `// ${name} - packstruct@1 pack entry.
// The default export is the loaded thing (ESM is the house default).
export default {
  name: '${name}',
  description: 'TODO: one-line description of ${name}.',
}
`
}

function manifestJson(name) {
  return JSON.stringify({
    schemaVersion: 1,
    name,
    description: `TODO: one-line description of ${name}.`,
    version: DEFAULT_VERSION,
    entry: 'index.js',
  }, null, 2) + '\n'
}

// newPack(name, { dir, cwd }). Returns { dir, packDir, files, violations }.
// Refusals are nameable and non-destructive: a bad name or an occupied
// target refuses without writing (never clobber).
export function newPack(name, opts = {}) {
  const cwd = opts.cwd ?? process.cwd()
  if (typeof name !== 'string' || !KEBAB.test(name)) {
    return { dir: null, packDir: null, files: [], violations: [{ norm: 'name-kebab-case', message: `pack name must be kebab-case (got ${JSON.stringify(name)}) - for example: packstruct new my-shapes` }] }
  }
  const dir = resolvePacksRoot(cwd, opts.dir)
  const packDir = join(dir, 'public', name)
  if (existsSync(packDir)) {
    return { dir, packDir, files: [], violations: [{ norm: 'pack-exists', message: `${packDir} already exists - refusing to clobber it (pick another name or remove the directory)` }] }
  }
  mkdirSync(packDir, { recursive: true })
  const manifestPath = join(packDir, 'pack.json')
  const entryPath = join(packDir, 'index.js')
  writeFileSync(manifestPath, manifestJson(name))
  writeFileSync(entryPath, entryStub(name))
  return { dir, packDir, files: [manifestPath, entryPath], violations: [] }
}
