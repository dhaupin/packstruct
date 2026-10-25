// src/run-capped.mjs - the one gated child runner both spawned surfaces use
// (the audit's HOST loader and the deep probe's entry reader). Zero deps.
//
// Why async spawn and not spawnSync pipes (the QC finding, CI-reproduced):
// a sync pipe read waits for EOF on stdout, and EOF needs every writer gone -
// a timeout-killed loader that leaves an ORPHANED grandchild holding the
// pipe makes spawnSync block forever. Killing is fine; waiting on the
// orphan's EOF is not. This runner resolves on the direct child's `exit`
// event - never on EOF - so an orphan can't hold the harness hostage.
//
// Caps, both hard (kill on exceed, no soft drift):
//   timeoutMs  - the child is SIGKILLed at the deadline; `timedOut` reports it
//   maxBuffer  - accumulated stdout+stderr bytes; past the cap the child is
//                killed and `capped` reports it (the cap is an honesty cap:
//                output beyond it is unverifiable output)
// After `exit` (or a kill), later data events from orphans are ignored and
// only the bytes captured before exit are returned.
//
// Group kill (2026-10-25 leak finding): caps that kill the child alone
// leaked /bin/sh's node grandchildren when the shell forked instead of
// exec'ing - a flood loader that survives its own death keeps console.log
// buffering into a pipe nobody reads, gigabytes per child in seconds (4
// leaked children ballooned this workspace 104MB -> 3.3GB and starved CI
// runners mid-suite). The child now spawns detached - its own process
// group - and every kill path signals the NEGATIVE pid: the direct child,
// any forked shell, and every grandchild, in one shot.
//
// Battlefield note (2026-10-24 QC): the predecessor of this file was the
// audit's sync spawn with file-stdio scratch - under an output-flooding
// loader there was NO cap on file growth, and a 20GB scratch file filled the
// disk before the 120s deadline. The flood name in the tests is the same,
// but the killer is now the cap, not the clock.
import { spawn } from 'node:child_process'

function makeKill(p, killSignal) {
  // Negated pid = the whole process group (the child is a group leader
  // because the spawn is detached). Falls back to the direct-child kill
  // when the group is already gone; both no-op if the child never spawned.
  return () => {
    if (!p.pid) return
    try { process.kill(-p.pid, killSignal) }
    catch { try { p.kill(killSignal) } catch { /* already gone */ } }
  }
}

export function runCapped({ cmd, args = [], shell = false, cwd, timeoutMs = 5000, maxBuffer = 1024 * 1024, killSignal = 'SIGKILL' }) {
  return new Promise((resolve) => {
    let done = false
    let total = 0
    let capped = false
    let timedOut = false
    let spawnError = null
    const chunks = []
    const stderrChunks = []
    // detached on POSIX: the child leads its own process group, which is
    // what makes the negated-pid group kill total (shell forks die too).
    const p = spawn(cmd, args, { shell, cwd, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] })
    const killTree = makeKill(p, killSignal)
    const timer = setTimeout(() => {
      timedOut = true
      killTree()
    }, timeoutMs)
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(timer)
      try { p.stdout.destroy(); p.stderr.destroy() } catch { /* already dead */ }
      resolve({
        status: p.exitCode,
        signal: p.signalCode,
        stdout: Buffer.concat(chunks).toString('utf8'),
        stderr: stderrChunks.join(''),
        capped,
        timedOut,
        spawnError,
      })
    }
    // stdout is capped hard: past maxBuffer the child dies. stderr counts
    // against the same gate so a stderr flood cannot OOM the harness either.
    p.stdout.on('data', (d) => {
      if (done || capped) return
      total += d.length
      chunks.push(d)
      if (total > maxBuffer) { capped = true; killTree() }
    })
    p.stderr.on('data', (d) => {
      if (done) return
      total += d.length
      stderrChunks.push(d)
      if (total > maxBuffer) { capped = true; killTree() }
    })
    p.on('error', (e) => { spawnError = e; finish() })
    p.on('exit', finish)
  })
}
