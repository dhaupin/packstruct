// src/lint.mjs - packstruct lint: packstruct spec v1 manifest validation.
// The immediate payoff: kills the "manifest declares an entry that doesn't
// ship" class (crashtest#16) at author time, in any fleet repo.
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function lintPacks(dir) {
  const violations = []
  let packsChecked = 0
  if (!existsSync(dir)) {
    return { packsChecked, violations: [{ pack: dir, norm: 'usage', message: `no such directory: ${dir}` }] }
  }
  // Section 1 contract: packs live at <packs-root>/public/<name>/
  const publicDir = join(dir, 'public')
  if (!existsSync(publicDir)) {
    return { packsChecked, violations: [{ pack: dir, norm: 'directory-contract', message: `missing ${dir}/public/ - packs live at <packs-root>/public/<name>/` }] }
  }
  for (const name of readdirSync(publicDir)) {
    const packDir = join(publicDir, name)
    let isDir = true
    try { readdirSync(packDir) } catch { isDir = false }
    if (!isDir) continue
    const manifestPath = join(packDir, 'pack.json')
    if (!existsSync(manifestPath)) {
      violations.push({ pack: name, norm: 'manifest-missing', message: 'pack.json missing' })
      continue
    }
    packsChecked++
    let m
    try { m = JSON.parse(readFileSync(manifestPath, 'utf8')) } catch (e) {
      violations.push({ pack: name, norm: 'manifest-invalid', message: `pack.json is not valid JSON: ${e.message}` })
      continue
    }
    if (m.schemaVersion !== 1) violations.push({ pack: name, norm: 'schemaVersion', message: `schemaVersion must be 1 (got ${JSON.stringify(m.schemaVersion)})` })
    if (typeof m.name !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(m.name)) violations.push({ pack: name, norm: 'name-kebab-case', message: `name must be kebab-case (got ${JSON.stringify(m.name)})` })
    if (m.name !== name) violations.push({ pack: name, norm: 'name-dir-match', message: `name "${m.name}" does not match its directory "${name}"` })
    if (typeof m.version !== 'string' || !/^\d+\.\d+(\.\d+)?$/.test(m.version)) violations.push({ pack: name, norm: 'version', message: `version must be dotted MAJOR.MINOR[.PATCH] (got ${JSON.stringify(m.version)})` })
    if (typeof m.description !== 'string' || !m.description.trim()) violations.push({ pack: name, norm: 'description', message: 'description missing or empty' })
    if (typeof m.entry !== 'string' || !m.entry.trim() || m.entry.includes('..')) {
      violations.push({ pack: name, norm: 'entry', message: `entry must be a relative path inside the pack (got ${JSON.stringify(m.entry)})` })
    } else if (!existsSync(join(packDir, m.entry))) {
      violations.push({ pack: name, norm: 'entry', message: `entry file "${m.entry}" does not exist - instant refusal at load time (the crashtest#16 class)` })
    }
    if (m.armedByKey !== undefined && (typeof m.armedByKey !== 'string' || !m.armedByKey.trim())) {
      violations.push({ pack: name, norm: 'armedByKey', message: 'armedByKey, when present, must be a non-empty string' })
    }
  }
  return { packsChecked, violations }
}

