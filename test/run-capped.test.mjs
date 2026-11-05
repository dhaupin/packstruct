// test/run-capped.test.mjs - the one gated child runner's honesty cap.
//
// Regression (found 2026-11-06): the stderr handler lacked the `capped`
// guard the stdout handler carried, and neither stream truncated a chunk
// that straddled the cap - so a loader flooding stderr returned output
// PAST maxBuffer (a single 1MB chunk against a 4KB cap returned ~146KB),
// the exact "unaccounted bytes" the cap exists to refuse. The cap must
// bound what comes back, on BOTH streams, or it is a lie.
//
// No mocks: real child processes, real pipes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runCapped } from '../src/run-capped.mjs'

const node = process.execPath

test('a stdout flood is capped: returned bytes never exceed maxBuffer', async () => {
  const flood = "const c=Buffer.alloc(1024*1024,120); setInterval(()=>process.stdout.write(c),0)"
  const r = await runCapped({ cmd: node, args: ['-e', flood], timeoutMs: 2000, maxBuffer: 4096 })
  assert.equal(r.capped, true, 'the cap must fire')
  assert.equal(r.timedOut, false, 'the cap, not the clock, must end the flood')
  assert.ok(Buffer.byteLength(r.stdout) <= 4096, `stdout ${Buffer.byteLength(r.stdout)} must not exceed the 4096 cap`)
})

test('a stderr flood is capped the same way (the missing-guard regression)', async () => {
  const flood = "const c=Buffer.alloc(1024*1024,120); setInterval(()=>process.stderr.write(c),0)"
  const r = await runCapped({ cmd: node, args: ['-e', flood], timeoutMs: 2000, maxBuffer: 4096 })
  assert.equal(r.capped, true, 'the cap must fire on stderr too')
  assert.equal(r.timedOut, false, 'the cap, not the clock, must end the flood')
  assert.ok(Buffer.byteLength(r.stderr) <= 4096, `stderr ${Buffer.byteLength(r.stderr)} must not exceed the 4096 cap`)
})

test('the combined stdout+stderr budget honors one cap', async () => {
  const flood = "const c=Buffer.alloc(65536,120); setInterval(()=>{process.stdout.write(c);process.stderr.write(c)},0)"
  const r = await runCapped({ cmd: node, args: ['-e', flood], timeoutMs: 2000, maxBuffer: 8192 })
  const total = Buffer.byteLength(r.stdout) + Buffer.byteLength(r.stderr)
  assert.ok(total <= 8192, `combined output ${total} must not exceed the 8192 cap`)
})

test('a clean child that stays under the cap is untouched', async () => {
  const r = await runCapped({ cmd: node, args: ['-e', "process.stdout.write('ok'); process.stderr.write('note')"], timeoutMs: 2000, maxBuffer: 4096 })
  assert.equal(r.capped, false)
  assert.equal(r.timedOut, false)
  assert.equal(r.status, 0)
  assert.equal(r.stdout, 'ok')
  assert.equal(r.stderr, 'note')
})
