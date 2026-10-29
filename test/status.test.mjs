// test/status.test.mjs - the family status dialect battery (packstruct#36).
//
// The emitter's behavior is pinned with temp-dir fixtures, and the real
// tree's emitted counts are re-derived against the live ledgers so the
// dialect itself sits under CI the same way every other count here does.
// Behavior-only, temp dirs, no network.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from '../web/scripts/build-status.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const PASS_ROW = { id: 'pack-x/case-a', verdict: 'REFUSED', detail: 'x' }

function fixtureRepo({ findings, matrixRows, manifestPacks }) {
  const root = mkdtempSync(join(tmpdir(), 'packstruct-status-'))
  mkdirSync(join(root, 'labs'), { recursive: true })
  for (const p of manifestPacks) {
    mkdirSync(join(root, 'packs', 'public', p.dir), { recursive: true })
  }
  writeFileSync(join(root, 'labs', 'crashledger.json'), JSON.stringify({ schemaVersion: 1, findings }))
  writeFileSync(join(root, 'labs', 'refusal-matrix.packstruct.json'), JSON.stringify({ schema: 1, rows: matrixRows }))
  for (const p of manifestPacks) {
    writeFileSync(join(root, 'packs', 'public', p.dir, 'pack.json'), JSON.stringify(p.manifest))
  }
  return root
}

const MANIFEST_X = { dir: 'pack-x', manifest: { name: 'pack-x', schemaVersion: 1, version: '1.0.0', description: 'd', entry: 'index.js' } }

test('status: the dialect fields and leg rows derive from the committed ledgers', () => {
  const root = fixtureRepo({
    findings: [PASS_ROW, { id: 'pack-x/case-b', verdict: 'PASSED', detail: 'x' }, { id: 'input/oversized-field', verdict: 'REFUSED', detail: 'generic probe' }],
    matrixRows: [{ id: 'schemaVersion-num-2', honest: true }],
    manifestPacks: [MANIFEST_X],
  })
  try {
    const s = build(root)
    assert.equal(s.schema, 1)
    assert.equal(s.contract, 'family-status@1')
    assert.equal(s.repo, 'dhaupin/packstruct')
    assert.equal(s.site, 'https://packstruct.creadev.org/status')
    assert.ok(s.docs.startsWith('https://docs.creadev.org/packstruct'))
    const crashLeg = s.legs.find((l) => l.leg === 'crashtest')
    const matrixLeg = s.legs.find((l) => l.leg === 'refusal-matrix')
    // All findings count toward the crashtest leg, including generic probes.
    assert.deepEqual(crashLeg, { leg: 'crashtest', verdict: 'PASS', cases: 3, counts: { REFUSED: 2, PASSED: 1 }, ledger: 'labs/crashledger.json' })
    assert.deepEqual(matrixLeg, { leg: 'refusal-matrix', verdict: 'PASS', cases: 1, counts: { PASSED: 1 }, ledger: 'labs/refusal-matrix.packstruct.json' })
    // The pack row counts only the pack's own namespaced rows.
    assert.deepEqual(s.packs, [{ name: 'pack-x', spec: 'packstruct@1', manifest: 'packs/public/pack-x/pack.json', cases: 2 }])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('status: any case verdict outside the pass set degrades the leg to RED (never a fake PASS)', () => {
  const root = fixtureRepo({
    findings: [PASS_ROW, { id: 'pack-x/case-b', verdict: 'EXPLOITED', detail: 'x' }],
    matrixRows: [],
    manifestPacks: [MANIFEST_X],
  })
  const root2 = fixtureRepo({
    findings: [{ id: 'pack-x/case-a', verdict: 'MEANWHILE', detail: 'x' }],
    matrixRows: [],
    manifestPacks: [MANIFEST_X],
  })
  const root3 = fixtureRepo({
    findings: [PASS_ROW],
    matrixRows: [{ id: 'row-a', honest: false }],
    manifestPacks: [MANIFEST_X],
  })
  try {
    assert.equal(build(root).legs.find((l) => l.leg === 'crashtest').verdict, 'RED')
    // An unknown verdict is the same refusal - the dialect degrades, not guesses
    assert.equal(build(root2).legs.find((l) => l.leg === 'crashtest').verdict, 'RED')
    // A dishonest matrix row is exactly the RED the generator refuses to write.
    assert.equal(build(root3).legs.find((l) => l.leg === 'refusal-matrix').verdict, 'RED')
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(root2, { recursive: true, force: true })
    rmSync(root3, { recursive: true, force: true })
  }
})

test('status: the emitter refuses a committed pack with zero ledger rows loudly', () => {
  const root = fixtureRepo({
    findings: [PASS_ROW],
    matrixRows: [],
    manifestPacks: [MANIFEST_X, { dir: 'pack-y', manifest: { name: 'pack-y', schemaVersion: 1, version: '1.0.0', description: 'd', entry: 'index.js' } }],
  })
  try {
    assert.throws(() => build(root), /pack-y.*zero ledger rows/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('status: the real tree emits the live ledger counts (the receipt re-derives itself)', () => {
  const s = build(REPO_ROOT)
  const crash = JSON.parse(readFileSync(join(REPO_ROOT, 'labs', 'crashledger.json'), 'utf8')).findings
  const matrix = JSON.parse(readFileSync(join(REPO_ROOT, 'labs', 'refusal-matrix.packstruct.json'), 'utf8')).rows
  assert.equal(s.legs.find((l) => l.leg === 'crashtest').cases, crash.length)
  assert.equal(s.legs.find((l) => l.leg === 'refusal-matrix').cases, matrix.length)
  assert.ok(matrix.every((r) => r.honest), 'every matrix row must be honest before serving a PASS')
  for (const leg of s.legs) assert.equal(leg.verdict, 'PASS')
  for (const p of s.packs) assert.ok(p.cases > 0, `pack ${p.name} must carry ledger rows`)
})
