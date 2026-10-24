import { useState } from 'react'

/**
 * src/islands/LintDemo.jsx
 * ========================
 * Browser-only island: validates a pasted pack.json against the same SPEC v1
 * rules the CLI enforces (a faithful port of the shape checks in src/lint.mjs,
 * minus the on-disk entry existence probe a browser can't do). Nothing is
 * uploaded - the manifest never leaves the tab.
 */

// Same grammar the CLI uses: dotted MAJOR.MINOR[.PATCH].
const VERSION_FLOOR = /^\d+\.\d+(\.\d+)?$/
const KEBAB = /^[a-z0-9][a-z0-9-]*$/

function validate(manifest, dirName) {
  const violations = []
  const m = manifest
  if (m.schemaVersion !== 1) {
    violations.push({ norm: 'schemaVersion', message: `schemaVersion must be 1 (got ${JSON.stringify(m.schemaVersion)})` })
  }
  if (typeof m.name !== 'string' || !KEBAB.test(m.name)) {
    violations.push({ norm: 'name-kebab-case', message: `name must be kebab-case (got ${JSON.stringify(m.name)})` })
  } else if (dirName.trim() && m.name !== dirName.trim()) {
    violations.push({ norm: 'name-dir-match', message: `name "${m.name}" does not match its directory "${dirName.trim()}"` })
  }
  if (typeof m.version !== 'string' || !VERSION_FLOOR.test(m.version)) {
    violations.push({ norm: 'version', message: `version must be dotted MAJOR.MINOR[.PATCH] (got ${JSON.stringify(m.version)})` })
  }
  if (typeof m.description !== 'string' || !m.description.trim()) {
    violations.push({ norm: 'description', message: 'description missing or empty' })
  }
  if (typeof m.entry !== 'string' || !m.entry.trim() || m.entry.includes('..')) {
    violations.push({ norm: 'entry', message: `entry must be a relative path inside the pack (got ${JSON.stringify(m.entry)})` })
  } else if (dirName.trim()) {
    // The browser can't stat the pack directory - say exactly what wasn't checked.
    violations.push({ norm: 'entry', message: `entry "${m.entry}" shape is valid - the CLI additionally confirms the file exists on disk (the crashtest#16 class)`, info: true })
  }
  if (m.armedByKey !== undefined && (typeof m.armedByKey !== 'string' || !m.armedByKey.trim())) {
    violations.push({ norm: 'armedByKey', message: 'armedByKey, when present, must be a non-empty string' })
  }
  return violations
}

function tryParse(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return { error: `pack.json is not valid JSON: ${e.message}` }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { error: 'a manifest is an object, not an array or scalar' }
  }
  // Prototype-pollution floor: a JSON.parse'd document can materialize
  // __proto__/constructor/prototype as own keys (revived or from JSON text).
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    if (Object.prototype.hasOwnProperty.call(parsed, key)) {
      return { error: `pollution key in manifest document (bytes withheld)` }
    }
  }
  return { parsed }
}

const SAMPLE = `{
  "schemaVersion": 1,
  "name": "my-pack",
  "description": "One line, human-readable.",
  "version": "0.1.0",
  "entry": "index.js"
}`

export default function LintDemo() {
  const [text, setText] = useState(SAMPLE)
  const [dirName, setDirName] = useState('my-pack')

  const result = tryParse(text)
  const violations = result.error
    ? [{ norm: 'manifest-invalid', message: result.error }]
    : validate(result.parsed, dirName)
  const errors = violations.filter(v => !v.info)
  const infos = violations.filter(v => v.info)
  const dirty = text !== SAMPLE || dirName !== 'my-pack'

  return (
    <div className="lint-demo">
      <div className="lint-demo-row">
        <label className="lint-demo-dir">
          <span>Pack directory name</span>
          <input
            type="text"
            value={dirName}
            onChange={e => setDirName(e.target.value)}
            placeholder="my-pack"
            spellCheck="false"
          />
        </label>
        {dirty && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { setText(SAMPLE); setDirName('my-pack') }}
          >
            Reset sample
          </button>
        )}
      </div>
      <textarea
        className="lint-demo-input"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={12}
        spellCheck="false"
        aria-label="pack.json manifest to validate"
      />
      {errors.length === 0 && infos.length === 0 ? (
        <div className="lint-demo-verdict is-pass">
          <strong>ok</strong> SPEC v1 shape holds {result.parsed?.name ? `for "${result.parsed.name}"` : ''}
        </div>
      ) : (
        <div className={errors.length > 0 ? 'lint-demo-verdict is-fail' : 'lint-demo-verdict is-pass'}>
          {errors.map((v, i) => (
            <div key={i} className="lint-demo-violation">
              <strong>ERR</strong> <code>{v.norm}</code> {v.message}
            </div>
          ))}
          {infos.map((v, i) => (
            <div key={i} className="lint-demo-violation dim">
              <strong>ok</strong> <code>{v.norm}</code> {v.message}
            </div>
          ))}
        </div>
      )}
      <p className="field-report">
        Extra keys and data files beside the entry are minimum-spec: the spec never
        refuses them, and neither does this validator.
      </p>
    </div>
  )
}
