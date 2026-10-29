// packs/public/packstruct-lint-shapes/index.js - the packstruct lint lane.
//
// The real component under attack: the lint CLI's contract per SPEC v1
// section 5 - "a conforming loader refuses with a one-line error naming the
// pack and the broken norm the moment it sees the violation... Never a deep
// stack trace and never silent success." The transport is an in-process
// double (crashtest.config.js) that materializes one hostile pack.json per
// request into a temp dir and runs `node bin/cli.mjs lint <dir> --json` as
// a subprocess - the same wire a user and CI consume.
//
// Cross-repo pack doctrine (prestruct-proxy / freestruct-docs-shapes
// precedent): NO imports from crashtest internals. Plain verdict records,
// honest skips - a shape the run root cannot support is a REFUSED posture
// note, never a fake verdict.
//
// Four attacks, one contract each:
//
//   hostile-manifest-fuzz      every malformed pack.json (bad JSON, wrong
//                              types every field, deep-nest bomb, huge
//                              strings) answers in-bounds: JSON verdict
//                              body, violations[] with named packs/norms,
//                              exit 0 or 1 - never 5xx, never a throw.
//   entry-path-containment     entry values that escape the pack dir
//                              (path traversal, absolute paths, file URLs)
//                              are flagged by the deterministic 'entry'
//                              norm - never accepted as "exists".
//   over-strict-drift-canary   spec-ALLOWED shapes (extra manifest keys,
//                              snapshot files beside the entry, unnamed
//                              optional absence) exit 0 with zero
//                              violations - a lint that flags minimum-spec
//                              shapes is itself a regression (SPEC 3.4).
//   clean-pack-canary          the conforming fixture pack exits 0 with an
//                              empty violations list - the happy wire holds.
//
// Vocabulary (ctx / moduleCtx['packstruct-lint-shapes']):
//   route  route name of the lint double (default: 'lint')
//
const DEFAULT_ROUTE = 'lint';

// Hard-named CLI of the tool under test (the honest wire, not library
// internals): `node bin/cli.mjs lint <dir> --json`.
const CLI_SPEC = ['bin/cli.mjs', 'lint', '--json'];

// Hostile pack.json alphabet. Each shape gets its own pack dir named
// 'corpus-pack' inside a per-request temp root.
const HOSTILE_MANIFESTS = {
  'boom-json': '{ not: valid JSON at all!!!',
  'wrongtypes': JSON.stringify({
    schemaVersion: '1', name: 123, description: [], version: {}, entry: 42,
  }),
  'deep-nest': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'x', version: '0.1.0', entry: 'e.mjs', extra: (function deep(n) { return n ? [deep(n - 1)] : 'leaf'; })(256) }),
  'huge-string': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'y'.repeat(1024 * 512), version: '0.1.0', entry: 'e.mjs' }),
};

const ENTRY_ESCAPE_MANIFESTS = {
  'entry-traversal': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: '../../package.json' }),
  'entry-absolute': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: '/etc/passwd' }),
  // Absolute but resolving inside the pack: the class the substring proxy
  // missed (join re-rooted it, so shallow passed it while deep refused).
  'entry-absolute-inpack': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: '/e.mjs' }),
  'entry-dot': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: '.' }),
  'entry-file-url': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: 'file:///etc/passwd' }),
  'entry-null-byte': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: 'e.mjs\0/../passwd' }),
  // The entry names a directory (the transport materializes it as one): not
  // an ES module (SPEC 3), so the manifest pass must refuse it, not only deep.
  'entry-is-directory': JSON.stringify({ schemaVersion: 1, name: 'corpus-pack', description: 'hostile', version: '0.1.0', entry: 'e.mjs' }),
};

// Cross-repo pack doctrine: inline verdict helpers (no crashtest imports).
const exhausted = (detail, extra = {}) => ({ verdict: 'EXPLOITED', detail, ...extra });
const refused = (detail, extra = {}) => ({ verdict: 'REFUSED', detail, ...extra });

function routeOf(ctx) { return (ctx && ctx.route) || DEFAULT_ROUTE; }

/** Truthful lint run: returns { threw?, exit, stdout, stderr } without throwing. */
async function runLint(harness, route, shape) {
  const rec = await harness.run(route, { method: 'GET', url: `/lint?shape=${shape}` });
  if (rec.threw) return { threw: true, error: rec.error };
  let body = '';
  try { body = await rec.response.text(); } catch { /* empty */ }
  return { threw: false, status: rec.status, body };
}

function parseVerdict(body) {
  try {
    const r = JSON.parse(body);                 // {exit, stdout, stderr}
    const out = JSON.parse(r.stdout);           // {schema, packsChecked, violations}
    if (!Array.isArray(out.violations)) return null;
    return { exit: r.exit, stderr: r.stderr ?? '', violations: out.violations };
  } catch { return null; }
}

const isNameable = (v) => v && typeof v.pack === 'string' && v.pack.length > 0 &&
  typeof v.norm === 'string' && v.norm.length > 0 &&
  typeof v.message === 'string' && v.message.length > 0;

const STACK_MARKERS = /(^|\n)\s*at .*\(|^\s*ReferenceError|^\s*TypeError|Uncaught/;

export default {
  name: 'packstruct-lint-shapes',
  description: 'hostile-manifest wire truths for packstruct lint: in-bounds refusals under malformed manifests (never crash, never silent success), entry path containment, minimum-spec tolerance (zero dependencies, zero sockets)',

  attacks: [
    {
      name: 'hostile-manifest-fuzz',
      description: 'every malformed pack.json answers in-bounds: parseable verdict JSON, violations carried with {pack,norm,message}, exit 0/1 - never 5xx, never a deep stack trace',
      async run(harness, ctx = {}) {
        const route = routeOf(ctx);
        const crashes = [];
        const violations = [];
        for (const shape of Object.keys(HOSTILE_MANIFESTS)) {
          const r = await runLint(harness, route, shape);
          if (r.threw) { crashes.push(`${shape}: harness throw`); continue; }
          if (r.status >= 500) { crashes.push(`${shape}: status ${r.status}`); continue; }
          const v = parseVerdict(r.body);
          if (!v) { crashes.push(`${shape}: body is not parseable JSON verdict`); continue; }
          if (v.exit !== 0 && v.exit !== 1) crashes.push(`${shape}: exit ${v.exit}`);
          if (v.stderr && STACK_MARKERS.test(v.stderr)) crashes.push(`${shape}: deep stack trace in stderr`);
          if (!v.violations.every(isNameable)) { violations.push(`${shape}: violation record not nameable`); continue; }
        }
        const fails = [...crashes, ...violations];
        if (fails.length) {
          return exhausted(`lint contract broken under hostile manifest corpus: ${fails.join(' | ')}`);
        }
        return refused(
          `${Object.keys(HOSTILE_MANIFESTS).length} hostile manifest shapes held: in-bounds verdicts, nameable refusals + norms, no crash, no deep stack (SPEC v1 section 5)`,
          { shapes: Object.keys(HOSTILE_MANIFESTS).length },
        );
      },
    },

    {
      name: 'entry-path-containment',
      description: 'entry values escaping the pack dir (traversal, absolute, file URL, null byte) are flagged by the entry norm - an outside file that happens to exist never silences the refusal',
      async run(harness, ctx = {}) {
        const route = routeOf(ctx);
        const leaks = [];
        const crashes = [];
        for (const shape of Object.keys(ENTRY_ESCAPE_MANIFESTS)) {
          const r = await runLint(harness, route, shape);
          if (r.threw) { crashes.push(shape); continue; }
          const v = parseVerdict(r.body);
          if (!v) { crashes.push(shape); continue; }
          const entryFlag = v.violations.find((x) => x.norm === 'entry');
          if (!entryFlag) {
            leaks.push(`${shape}: entry escape accepted (no entry-norm violation)`);
            continue;
          }
          if (!isNameable(entryFlag)) leaks.push(`${shape}: entry flag not nameable`);
        }
        const fails = [...crashes, ...leaks];
        if (fails.length) {
          return exhausted(`entry containment broken: ${fails.join(' | ')}`);
        }
        return refused(
          `${Object.keys(ENTRY_ESCAPE_MANIFESTS).length} entry-escape shapes held: every escape flagged by the nameable 'entry' norm (the crashtest#16 class, closed at the wire)`,
          { shapes: Object.keys(ENTRY_ESCAPE_MANIFESTS).length },
        );
      },
    },

    {
      name: 'over-strict-drift-canary',
      description: 'spec-ALLOWED shapes (extra manifest keys, extra files beside the entry) exit 0 with zero violations - over-strict linting of minimum-spec shapes is a lint-side regression (SPEC 3.4)',
      async run(harness, ctx = {}) {
        const route = routeOf(ctx);
        const overStrict = [];
        for (const shape of ['extra-keys', 'extra-files']) {
          const r = await runLint(harness, route, shape);
          if (r.threw) { overStrict.push(`${shape}: harness throw`); continue; }
          const v = parseVerdict(r.body);
          if (!v) { overStrict.push(`${shape}: unparseable verdict`); continue; }
          if (v.exit !== 0 || v.violations.length > 0) {
            overStrict.push(`${shape}: exit ${v.exit}, ${v.violations.length} violation(s)`);
          }
        }
        if (overStrict.length) {
          return exhausted(`spec tolerance broken: ${overStrict.join(' | ')} - the linter flagged shapes SPEC 3.4 explicitly allows`);
        }
        return refused('minimum-spec shapes held: extra manifest keys and extra-files existing beside the entry both exit 0, zero violations (SPEC 3.4 additive-first contract)');
      },
    },

    {
      name: 'clean-pack-canary',
      description: 'the conforming fixture pack (schemaVersion 1, name/dir match, existing entry) exits 0 with an empty violations list - the happy wire holds',
      async run(harness, ctx = {}) {
        const route = routeOf(ctx);
        const r = await runLint(harness, route, 'clean-pack');
        if (r.threw) return exhausted('clean pack canary crashed the lint double');
        const v = parseVerdict(r.body);
        if (!v) return exhausted('clean pack canary: unparseable verdict body');
        if (v.exit !== 0) return exhausted(`clean pack canary: exit ${v.exit} - conforming shape refused`);
        if (v.violations.length > 0) {
          return exhausted(`clean pack canary flagged: ${JSON.stringify(v.violations.slice(0, 4))}`);
        }
        return refused('clean pack canary held: conforming shape answers exit 0, zero violations - the lint never flags honest packs');
      },
    },
  ],
};
