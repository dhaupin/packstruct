// crashtest.config.js - packstruct's crashtest run root (dogfood).
//
// The component under attack is packstruct lint's OWN contract (SPEC v1
// section 5: instant, nameable refusal; never a deep stack trace; never
// silent success). The transport is an in-process double that materializes
// one pack.json per request into a per-request temp dir and shells the CLI
// exactly the way a user and CI do (`node bin/cli.mjs lint <dir> --json`).
// Nothing in the repo is written during a run.
//
// Run:
//   crashtest run              (from the packstruct repo root)
//
// In CI the crashtest lane runs after `npm test` (see
// .github/workflows/crashtest.yml).

import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));

// Hard-named CLI of the tool under test (the honest wire): `node bin/cli.mjs lint <dir> --json`.
// Args order is load-bearing: the CLI treats the FIRST non-flag arg as the
// target dir, so 'lint', <dir>, '--json' (correct) - not 'lint', '--json',
// <dir>. The mis-order made the first crashtest run lint a path literally
// named 'lint' (usage error everywhere) - exactly the class the pack exists
// to catch, caught in the pack's own wiring first.
const CLI_SPEC = ['bin/cli.mjs', 'lint'];

// Manifests the lint engine MUST flag (hostile) and MUST NOT flag (spec
// tolerance). Shapes map to one pack.json each, written into a per-request
// temp root whose directory name is the pack name (name/dir-match lives in
// the corpus, not the compromise).
const CLEAN = JSON.stringify({
  schemaVersion: 1, name: 'corpus-pack', description: 'Conforming corpus pack.', version: '0.1.0', entry: 'e.mjs',
});
const EXTRA_KEYS = JSON.stringify({
  schemaVersion: 1, name: 'corpus-pack', description: 'Extra keys are minimum-spec (SPEC 3.4).', version: '0.1.0', entry: 'e.mjs',
  houseRules: { strictness: 'advisory' },
});

function writeDir(root, name, packJson, extraFiles = []) {
  const dir = join(root, name, 'public', 'corpus-pack');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'pack.json'), packJson);
  writeFileSync(join(dir, 'e.mjs'), 'export default {}\n');
  for (const f of extraFiles) writeFileSync(join(dir, f.name), f.body);
}

async function lintOne(shape) {
  const root = mkdtempSync(join(tmpdir(), 'packstruct-ct-'));
  try {
    if (shape in HOSTILE) writeDir(root, 't', HOSTILE[shape]);
    else if (shape in ESCAPES) writeDir(root, 't', ESCAPES[shape]);
    else if (shape === 'entry-is-directory') {
      // The entry names a DIRECTORY: not an ES module (SPEC 3), so it must
      // refuse on the manifest pass - not only when deep tries to import it.
      writeDir(root, 't', JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: 'e.mjs' }));
      const entry = join(root, 't', 'public', 'corpus-pack', 'e.mjs');
      rmSync(entry, { force: true });
      mkdirSync(entry, { recursive: true });
    }
    else if (shape === 'clean-pack') writeDir(root, 't', CLEAN);
    else if (shape === 'extra-keys') writeDir(root, 't', EXTRA_KEYS);
    else if (shape === 'extra-files') writeDir(root, 't', CLEAN, [{ name: 'snapshot.json', body: '{}' }]);
    else return { status: 404, body: JSON.stringify({ error: `unknown shape ${shape}` }) };

    const r = spawnSync(process.execPath, [...CLI_SPEC, join(root, 't'), '--json'], {
      cwd: REPO_ROOT, encoding: 'utf8', timeout: 30_000,
    });
    return {
      status: 200,
      body: JSON.stringify({ exit: r.status ?? (r.signal ? 'signal:' + r.signal : 2), stdout: r.stdout ?? '', stderr: r.stderr ?? '' }),
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// Hostile corpus (never flaggable shapes; the lint must refuse nameably).
const HOSTILE = {
  'boom-json': '{ not: valid JSON at all!!!',
  'wrongtypes': JSON.stringify({ schemaVersion: '1', name: 123, description: [], version: {}, entry: 42 }),
  'deep-nest': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'x', version: '0.1.0', entry: 'e.mjs', extra: (function deep(n) { return n ? [deep(n - 1)] : 'leaf'; })(256) }),
  'huge-string': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'y'.repeat(1024 * 512), version: '0.1.0', entry: 'e.mjs' }),
};
const ESCAPES = {
  'entry-traversal': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: '../../package.json' }),
  'entry-absolute': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: '/etc/passwd' }),
  // Absolute yet resolving INSIDE the pack (node's `join` would re-root it,
  // so the old substring check passed it while `resolve` refused - the two
  // passes disagreed). Containment refuses it on both.
  'entry-absolute-inpack': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: '/e.mjs' }),
  'entry-dot': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: '.' }),
  'entry-file-url': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: 'file:///etc/passwd' }),
  'entry-null-byte': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: 'e.mjs\u0000/../passwd' }),
};

/**
 * The lint double. {request} -> Response like the fleet's lab doubles
 * (crashtest's fixtures/site precedent). The URL carries the shape name;
 * the response body is the honest subprocess record.
 */
function makeLintHandler() {
  return async ({ request }) => {
    let shape;
    try { shape = new URL(request.url).searchParams.get('shape'); } catch { shape = null; }
    if (!shape) return new Response(JSON.stringify({ error: 'shape param required' }), { status: 400 });
    const r = await lintOne(shape);
    return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/json' } });
  };
}

export default {
  baseUrl: 'https://packstruct.local',
  routes: {
    lint: makeLintHandler(),
  },
  // Adopt OUR pack surface (absolute path - the run root may load from any cwd).
  packs: [join(REPO_ROOT, 'packs')],
  seed: 0xC0FFEE,
};
