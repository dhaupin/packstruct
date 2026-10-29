// test/refusal-matrix.test.mjs - the refusal matrix is a receipt, so its
// honesty check must fail in BOTH directions and the committed artifact must
// match the linter. Two real defects this pins (packstruct#3):
//
//   1. A SUBSET honesty check (observed superset-of expected) passes a linter
//      that grew STRICTER than the SPEC promises - an extra norm on a shape
//      the SPEC says is fine is the "ship a check the SPEC never promised"
//      defect and must fail as loudly as a missing one.
//   2. CI ran the generator but never DIFFED it against the committed file,
//      so a flipped row was rewritten green and the stale receipt shipped.
//
// No mocks: a temp tree is a real copy of src/ + scripts/ + labs/, mutated and
// run through the real generator.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function makeTree() {
  const root = mkdtempSync(join(tmpdir(), 'packstruct-matrix-test-'))
  for (const entry of ['src', 'scripts', 'labs', 'package.json']) {
    cpSync(join(REPO_ROOT, entry), join(root, entry), { recursive: true })
  }
  mkdirSync(join(root, 'labs'), { recursive: true })
  return root
}

function runCheck(root) {
  return spawnSync('node', ['scripts/gen-refusal-matrix.mjs', '--check'], { cwd: root, encoding: 'utf8' })
}

test('the committed refusal matrix matches the linter', () => {
  const root = makeTree()
  try {
    const r = runCheck(root)
    assert.equal(r.status, 0, `--check should pass on a synced tree:\n${r.stdout}${r.stderr}`)
    assert.match(r.stdout, /in sync/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('a linter stricter than the SPEC (superset norm) fails the check', () => {
  const root = makeTree()
  try {
    const lintPath = join(root, 'src', 'lint.mjs')
    const original = readFileSync(lintPath, 'utf8')
    // Emit the expected norm AND an extra spurious one: expect.norms is
    // satisfied, so a subset check would call this honest.
    const mutated = original.replace(
      "norm: 'schemaVersion'",
      "norm: 'schemaVersion' }, { pack: 'shape-pack', norm: 'spurious-extra-norm', message: 'stricter than SPEC'",
    )
    assert.notEqual(mutated, original, 'test setup: the injection point must exist')
    writeFileSync(lintPath, mutated)

    const r = runCheck(root)
    assert.equal(r.status, 1, `a superset norm must fail the check:\n${r.stdout}${r.stderr}`)
    assert.match(r.stderr, /dishonest|STALE/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('a hand-edited (stale) matrix fails the check', () => {
  const root = makeTree()
  try {
    const matrixPath = join(root, 'labs', 'refusal-matrix.packstruct.json')
    const doc = JSON.parse(readFileSync(matrixPath, 'utf8'))
    doc.rows[0].expected.norms = ['hand-edited-lie']
    writeFileSync(matrixPath, JSON.stringify(doc, null, 2) + '\n')

    const r = runCheck(root)
    assert.equal(r.status, 1, `a stale matrix must fail the check:\n${r.stdout}${r.stderr}`)
    assert.match(r.stderr, /STALE/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('a tampered battery receipt fails the check', () => {
  const root = makeTree()
  try {
    const batteryPath = join(root, 'labs', 'refusal-battery', 'armedByKey-empty.json')
    writeFileSync(batteryPath, '{"tampered":true}\n')

    const r = runCheck(root)
    assert.equal(r.status, 1, `a tampered battery file must fail the check:\n${r.stdout}${r.stderr}`)
    assert.match(r.stderr, /armedByKey-empty\.json/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
