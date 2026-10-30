# Changelog

All notable changes to packstruct will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **The family status table now reads the full family.** The `/status` island
  (`family-status@1`) gained the `govstruct` and `monoforge` rows (both now
  serve the dialect), and the `crashtest` row's page pointer moves
  `/dashboard` -> `/status` (the family status left crashtest's dashboard for
  its own route). The served CSP `connect-src` allows both new origins, so
  their fetches pass.

### Fixed
- **The `entry` check was a substring proxy, not a containment test
  (packstruct#2).** `entry.includes('..')` both over- and under-refused:
  (a) it PASSED an absolute path like `entry: "/index.js"` - node's `join`
  re-roots it inside the pack, so the shallow pass said clean while the deep
  probe's `resolve` treated it as `/index.js` and refused: the same manifest
  drew two verdicts, and SPEC §2 says entry MUST be a relative path inside
  the pack dir; (b) it FALSE-REFUSED a legitimate in-pack filename like
  `a..b.js`. Both checks now share one real containment test
  (`entryEscape`): reject non-strings, NUL, and absolute paths (POSIX or
  Windows-drive), then resolve against the pack dir and require the result
  to stay under it. `armedCoverage` uses the same test (it carried the same
  substring bug). The dogfood's `entry-path-containment` case grew two
  shapes (`entry-absolute-inpack`, `entry-dot`) - the old absolute shape
  (`/etc/passwd`) also failed file existence, which masked the bug.
- **A symlink entry escaping the pack passed both passes clean.** The
  containment test above is lexical, so `entry: "index.js"` where `index.js`
  is a symlink to a valid module OUTSIDE the pack was accepted silently on
  the shallow pass AND imported on the deep pass - no refusal, code loaded
  from outside the pack. "Inside the pack dir" is now PHYSICAL: the entry is
  realpath'd and must resolve under the realpath'd pack dir (both sides
  realpath'd, so a symlinked ancestor of `packDir` itself does not
  false-refuse). An in-pack symlink stays clean. `armedCoverage` gets the
  same physical check. SPEC §2 now says containment is physical, not merely
  lexical. New unit cases (escape refuses both passes; in-pack link stays
  clean) + dogfood shape `entry-symlink-escape` (7 → 8 entry-escape shapes).
- **SPEC §7 under-described the linter's own surface.** §7 named only the
  shallow pass, while `packstruct lint --deep` (+ `--against`) emits norms
  (`entry-import`, `entry-default-export`, `id-duplicate`, `id-collision`,
  `id-library-collision`) that the SPEC never listed under Conformance
  tooling. They were already promised by §3/§4/§5, but §7 - the section that
  describes the tool - did not say so. §7 now documents the deep pass and
  names those refusals as the spec's own load-time refusals surfaced early,
  never new norms (the "never ship a check the SPEC doesn't promise" law,
  applied to the tool surface).
- **The linter shipped an `armed-coverage` refusal the SPEC never promised
  (packstruct#27).** `src/lint.mjs` refused a declared `armedCoverage` whose
  file did not ship, but `spec/SPEC.md` never listed the key - the exact
  "never ship a check the SPEC doesn't promise" defect (AGENTS.md). The SPEC
  now documents `armedCoverage` as a v1.1.0 lint-assist key (§2 + §8 row 6,
  explicitly NOT a shared fact no loader reads), so the refusal is promised.
- **The refusal matrix could go stale green (packstruct#3).** Two defects in
  `scripts/gen-refusal-matrix.mjs`, both against the repo's own law ("never
  ship a check the SPEC doesn't promise"): (1) the honesty check was a SUBSET
  compare, so a linter that grew STRICTER than the SPEC - an extra norm on a
  shape the SPEC says is fine - recorded `honest: true` and rewrote the
  matrix green; it is now an exact both-directions set compare. (2) CI ran
  the generator (which rewrites the file) but never DIFFED it against the
  committed receipt, so a flipped row shipped stale and silent; `--check` now
  regenerates in memory and exits 1 on any delta, covering the matrix and
  every `labs/refusal-battery/` file, and runs as a leg of `npm run check`
  (the `prepublishOnly` gate) plus the test workflow. `--check` also holds
  the golden set's packstruct column (`labs/refusal-matrix.golden.json`)
  against the linter, so a hand-edited or stale copy of the same
  observations cannot contradict the matrix it cites.
  `test/refusal-matrix.test.mjs` pins all five cases (in-sync passes;
  superset norm, stale matrix, tampered battery file, drifted golden column
  each fail).
- **The dogfood receipt was cut by the wrong crashtest (packstruct#29).** The
  committed `labs/crashledger.json` + `labs/hardening.md` were cut by
  crashtest **v1.0.0** (34 findings), but the README registry row attributed
  "34/34 REFUSED" to `crashtest@1.1.0` @ `2d1fe79` - the pin the workflow and
  the corpus lane already use. Re-ran the dogfood on v1.1.0: 53/53 catalog
  findings REFUSED (4 from `packstruct-lint-shapes`), 0 EXPLOITED, 0 BOUNDED,
  and the registry row now matches the committed ledger it cites.

### Added
- **The ISO 9001 / ISO 27001 compliance rider (`labs/prd-packstruct-compliance.md`).**
  An evidence map, not a certificate: which ISO 9001:2015 clauses and ISO 27001:2022
  Annex A controls the packs spec and its STRICT linter can evidence, the artifact
  that proves each, the steps to stand the frame up, and the boundaries it does not
  claim. Grounded in govstruct's canonical compliance contract so a family install
  audits as one unit. Prose only - no code, no gate change.
- **The family status dialect (family-status@1, packstruct#36).** packstruct
  now serves its committed-ledger verdicts at `/status.json`, generated by
  `web/scripts/build-status.mjs` on every web build (never hand-edited,
  gitignored - the stale-copy class dies by construction). The file carries
  the `crashtest` and `refusal-matrix` legs plus the `packstruct-lint-shapes`
  pack row, and refuses a committed pack with zero ledger rows loudly. A new
  `/status` page reads every member's served file with the same schema and
  renders absence as absent. `_headers` serves it CORS-open (miss path
  included); a battery leg (`test/status.test.mjs`) pins the emitter and
  re-derives the live counts.
- **The family-lanes receipt registry (packstruct#25).** README gains the
  per-host registry: engine, sha-pinned pin, lint result, cut date. The row
  is the receipt; a companion-pin bump moves the row in the same change.
- **The check-jekyll-filters pass (packstruct#43).** Ported from
  poststruct@e53b1e0 and wired into `lint:docs`: the two-argument Liquid
  string-filter trap and unknown tags (the `{% seo %}` class) now fail in
  lint:docs with a file:line instead of in Jekyll's stack trace.
- **The ship-from-download phone publish lane (packstruct#35).** Copied
  as-is from eyestruct@9744c76 (`scripts/ship-from-download.cjs`), with the
  behavior test at `tests/ship-from-download.test.cjs` (21 cases) and the
  recipe recorded in DEPLOY.md.
- **`scripts/check-legal.cjs` + the canonical legal pages (packstruct#34).**
  Terms/Privacy rewritten to the family canon (eyebrow, dated web version
  pointing at the repo, one non-empty h1, the named section set) and a new
  battery leg holds them there. Terms/Privacy gained the `h1` the canon
  requires (they carried `h2` before).

### Changed
- **The mobile table guard (packstruct#31).** Docs tables (both the
  stylesheet and the layout's inline theme) now scroll in their own box
  (`display: block; overflow-x: auto`) and `td code` never wraps, so a wide
  grammar table can no longer pin the whole page on a phone.
- **The docs deploy rig aligned (packstruct#30).** `docs.yml`: ruby 3.3 ->
  3.4 and `upload-pages-artifact@v3` -> `@v5`, plus the new jekyll-filters
  gate. The `freestruct` pin stays at `1.0.0`: the published `1.1.0` still
  resolves root-absolute hrefs literally, so on a baseurl'd site
  (`/packstruct`) `--strict` fails every nav link - the basePath-strip fix
  is on freestruct `main` (1.2.0, unreleased; freestruct#32). Bumping to the
  unreleased line would break this lane, so the pin moves when the fix
  publishes.
- **The crashtest pins re-audited (packstruct#29).** `corpus.yml` now pins
  crashtest tag `v1.1.0` (`2d1fe79`) and `crashtest.yml` installs
  `crashtest@1.1.0`; `labs/corpus-receipt.md` carries the re-audit (8/8
  clean shallow + deep, 44 ids, 63 library ids, zero collisions) - the pin
  moved and the receipt moved with it.
- **docs/discussions prose unwrapped (packstruct#38).** The 72-column
  commit-time hard-wrap retired via `scripts/unwrap-prose.cjs` (copied from
  eyestruct@3adda1d); `docs/discussions/index.md` flowed, no keeper doc
  states the column rule.
- **`.gitignore` carries the web status file and the docs-preview block
  (packstruct#32).** `web/public/status.json` (generated) joins the docs
  belt-and-suspenders block; the local Jekyll preview recipe is recorded in
  DEPLOY.md.

## [1.1.0] - 2026-10-29

### Added
- **SPEC v1.1.0: the five additive rows (packstruct#19).** Engine-receipted,
  no `schemaVersion` move, no conforming host changes: the optional
  `implements` key (format-lint only, WARNING never refusal), the formalized
  `--loader` template contract, ESM-default entries stated plainly, interop
  routes as a lifecycle norm, and companion-pin receipts. Sections 8-11 of
  `spec/SPEC.md`.
- **The walk-exit (promotion) rule (packstruct#37).** A walk is not done
  until every finding it produced is promoted to a battery leg, a pack
  verdict row, or a named docket row - the one-mortem class made a norm.
- **The new-host onboarding shape (packstruct#20).** A traveler joins by
  answering the three questions the spec already structures (manifest / lint
  / run) - profiles, never forks - and inherits the standing refusals.
- **The MIGRATION-NOTE convention (packstruct#21).** The shape a
  non-additive schema event must carry, defined before first need: a
  schema-number bump, a MIGRATIONS row, refusal wording on old shapes, a
  dual-read window only where a host owns the artifact, and consumer receipts.
- **`implements` format lint + `warnings[]` (SPEC v1.1 section 2).** A
  non-conforming `implements` is a WARNING in `--json` (`warnings[]`) and
  the human readout, never a refusal; the exit code is unchanged.
- **`armedCoverage` declaration (packstruct#27 assist).** A pack may declare
  the relative path of its armed e2e row; the lint confirms the file ships
  and refuses (`armed-coverage`) when a declared row is vacuous. It never
  runs the row.
- **The version-truth leg (packstruct#40).** `package.json` is the single
  version source; the test suite refuses `web/package.json`, `web/VERSION`,
  the README title, and the docs npm line when they drift from it.

### Changed
- **The version moved 1.0.0 -> 1.1.0** (tool + spec patch). The frozen
  `schemaVersion` stays 1: v1.1.0 is additive by construction.
- **`staging` is the working branch (packstruct#42).** `staging` is created
  from `main` and kept forever: work branches off it, PRs target it,
  promotion to `main` is the only path out. `test.yml`, `crashtest.yml`,
  `corpus.yml` and `docs.yml` now watch `staging` on push and pull_request.
  The `docs.yml` deploy job is gated to `main`
  (`if: github.ref == 'refs/heads/main'`) - once the trigger covers staging,
  the trigger no longer keeps its content out of production, so the job must.
  Promotion is fast-forward (`git push origin staging:main`) so the two
  branches cannot drift.
- **Wrong-argument hints (packstruct#13, #17): the natural first gestures now
  name the fix instead of doubling a segment.** Passing the `public/` dir
  itself, one pack dir (`public/<name>`), or the repo root used to draw a
  `directory-contract` refusal like `missing packs/public/public/` - faithful
  to the parser, nonsense at the interface, and graded as a pack DEFECT.
  Those shapes now answer a `usage`-norm hint naming the probable intent
  ("looks like a public/ directory itself - pass the packs ROOT, ...",
  "looks like a repo root - ... try: packstruct lint packs"). A genuinely
  empty root still refuses `directory-contract` (the missing-public-dir
  matrix row is unchanged).

### Added (earlier 1.1.0 work)
- **`lint --local` (packstruct#16): the gitignored `local/` WIP lane is now
  lintable, opt-in.** The default stays public-only and byte-compatible; the
  flag also walks `<packs-root>/local/` - the manifests an author is actively
  editing and the ones a public-only walk left invisible (a broken local
  manifest sailed clean until engine-load time). Local rows carry
  `lane: "local"` in `--json` (and `[local]` in the human readout), the JSON
  gains a `localChecked` count, and `--deep` pairs with it (probing local
  entries the same way). Fixtures both ways under `test/fixtures/local/`.
- **A composed check battery, and a publish gate (packstruct#33).** The
  repo had only `test` and no `prepublishOnly`, so a corrupt or drifted
  SPEC/pack surface could publish to npm ungated. `check` now composes the
  four docs gates (`lint:docs`), a deep lint of the repo's own shipped pack
  (`lint:packs`), and the 8/8 conformance audit (`conform:packs`); the gate
  is `prepublishOnly = npm test && npm run check`, so `npm publish` cannot
  cut a release the battery has not verified. `check` also runs in `test.yml`
  on every push and PR.
- **A repo `.gitignore` (and two generated files untracked).** The root
  carried none, so dev installs and build products read as changes:
  `node_modules/`, `web/dist/`, `web/.prestruct/`, `docs/_site/`,
  `docs/Gemfile.lock`, `packs/local/` (the WIP lane) and the churn-by-design
  `labs/run-meta.json` stamp. `labs/run-meta.json` and
  `web/.prestruct/status.json` were tracked build/run output and are removed
  from the index (both regenerate on their own).
- **`packstruct new <name>` (packstruct#24): a conforming pack skeleton at
  author time.** The cheapest break class - a new author guessing the field
  list - dies even earlier if the starting point is generated correct. `new`
  writes `<root>/public/<name>/{pack.json,index.js}` (ESM default-export
  stub) that the lint accepts clean the moment it lands, and refuses by name
  without clobbering (bad name, occupied target). The packs root is
  discovered git-style (walk up for `packs/public/`); `--dir` overrides it.
  Pure convenience: its output is just another manifest the lint grades.

### Fixed
- **Unknown flags are refused, not silently ignored (packstruct#18).** The
  arg scan special-cased only `--deep`/`--json`/`--against`, so a typo'd
  mode flag ran the WRONG mode with no signal - `lint packs --jso` emitted
  text mode and exited 0, `--dep` ran shallow. Every leading-dash token must
  now be a recognized flag or the run exits 2 naming it (the usage ladder),
  for both `lint` and `audit-conformance`.

## [1.0.0] - 2026-10-25

### Changed
- **The golden refusal matrix closed its last pending row (crashtest#27's
  re-verification).** The schemaVersion-missing cell re-observed
  **REFUSED [schemaVersion]** by the engine over the truly-key-absent
  battery bytes (corpus re-ingested at packstruct `3c84ace`, cmp-verified;
  `REQUIRED_KEYS` at their loader.js:59) - exactly the post-fix prediction
  the fold annotated. Tally: **12 agree / 6 documented divergences / 0
  pending**. Matching receipt runs this repo's side: crashtest's kit
  (fixture backfill, CI lint lane, README pin) verified through our own
  linter at their head-of-tree - 8/8 packs clean, deep probe 8 modules /
  44 ids, exit 0.
### Fixed
- **`runCapped` group kill (QC leak pass, the CI-kill cause found): caps
  now SIGKILL the whole process group, not just the direct child.**
  Loaders spawn under `shell: true`, so when `/bin/sh` forked instead of
  exec'ing, a cap-killed flood loader left an orphaned node grandchild
  holding the stdout pipe: with nobody reading, `console.log` buffers every
  write in the child's own memory, gigabytes per child in seconds. Four
  leaked children from one suite run ballooned a dev sandbox 104MB ->
  3.3GB used and starved CI runners mid-suite - the publish lane's five
  `exit 143` job deaths all landed inside the probe-heavy phases where
  those children are alive. The child now spawns detached (own process
  group) and every kill path - deadline and cap, stdout and stderr -
  signals the negated pid, taking the shell and every grandchild in one
  shot. Verified empirically: suite PASS with zero surviving children and
  flat memory where the leak measured 3.2GB.
- **`lint --deep` probe isolation (QC vuln pass): pack code can no longer
  drive the linter's own process.** Entries were imported in-process, so
  pack.json cargo with top-level code could hijack the CLI's exit code
  (`process.exit(7)` in an entry made `packstruct lint --deep` wire-exit 7
  with zero output) or hang it forever (`for(;;){}` at top level). Probes
  now run in a disposable child with a 5s SIGKILL timeout; both crash
  classes became honest `entry-import` refusals naming the entry and the
  reason. Fixtures both ways (`test/fixtures/edge/exit|spin`), wire-level
  asserts: exit stays 1 - the CLI's own contract, never the entry's.
- **`audit-conformance` loader caps (QC vuln pass):** a HOST loader is
  arbitrary code in the shell it owns, but a refusal is instant - a loader
  that hangs is killed at the 120s audit timeout (neither accept nor
  refuse), and output above the 1MB spawn buffer counts as no-verdict.
  Both surface as audit violations naming the case; loaders can no longer
  surprise the harness with a hang or an output flood. Tests both ways.
- Site/docs npm-style sweep: consumer examples speak `npx packstruct`
  consistently, the npm package is linked from the landing (CTA row + nav),
  docs (nav + footer + index), and the stale web example claiming
  `armedByKey` must be non-empty (fixed by the crashtest#25 fold) is gone;
### Added
- **The release mechanics join the family (publish.yml rewritten).**
  npm Trusted Publishing (OIDC) replaces the NPM_TOKEN design - no
  publish secret is stored, matching prestruct/crashtest/freestruct
  (node 24 for npm >= 11.5.1; the npmjs.com Trusted Publisher entry is
  the one-time user setup). After the publish, the new `github-release`
  job (needs: publish) cuts the GitHub Release for the tag: the npm
  tarball packed as the asset through a listing-file guardrail (shipped
  surfaces present, repo-bound internals absent), generated notes.
  DEPLOY.md's runbook drift fixed with it (`npm install`, not `npm ci` -
  no root lockfile; the files whitelist carries profiles/ + conformance/;
  the ladder describes the gates as built).

## [0.9.0] - 2026-10-24

### Changed
- **Syntax-highlighting parity (#6, ported from crashtest@6033d27).** The
  docs' Rouge output (`.highlight` token spans) was colorless; both
  stylesheets now carry the shared token palette - keyword = accent,
  string/success = moss, tag/warning = err, comment = ink-soft italic,
  literal = accent-deep - every color on the theme tokens, so the
  light/dark switch re-tunes highlighting with no per-theme block. The web
  hand-span vocabulary (.dim/.ok/.bad/.kw) and Rouge's (.k/.s/.c1/...)
  map onto the same words, so the surfaces cannot drift.
- **Theme-switch icon direction** (both surfaces): dark mode shows the
  SUN (the action = go light), light mode shows the MOON (go dark).
- **The golden refusal matrix folded (#3).** `labs/refusal-matrix.golden.json`
  (+ readable `.md`) joins both observed columns - ours from the
  self-verifying battery, crashtest's from the #25 fold run over the same
  bytes: **11 agree / 6 documented divergences / 1 re-verify-after-fix**.
  Every divergence is a packstruct author-time strictness the engine does
  not share, annotated row-by-row; name-dir-mismatch stays the one true
  enforcement gap (engine-first call for the crashtest#19 chain).
  **The fold changed us where it was right to change:** (1) battery-emitter
  fix - the portable files now share the drop-aware serialization, so the
  schemaVersion-missing file can never again carry the key its row says is
  gone (found by crashtest#25 re-observing our own bytes); (2)
  `armedByKey` de-invented on the SPEC's own law ("never ship a check the
  SPEC doesn't promise") - empty = present-not-yet-armed, type-check only,
  reworded in SPEC section 2 and honored in the web island too; a
  non-string row added instead. Matrix: 18 rows, all honest.

### Added
- **`packstruct audit-conformance` (M2, SPEC section 7): the conformance
  harness.** Bundled verdict-claiming fixture cases (`conformance/cases/`:
  one clean bundle, one per section-5 refusal norm, plus a name-collision
  pair - 8 cases) are materialized into scratch roots and the HOST's own
  loader command (`--loader "<cmd> {packs}"`, shell-quoted placeholder)
  runs over each. A conforming loader exits 0 on the clean bundle and exits
  non-zero AND names the offending pack on every violation (identity
  match, refusal wording stays host-owned). Same exit ladder as lint.
  Makes the `implements: packstruct@1` pin verifiable, not honorary.
  Receipt in the same commit: `npm test` runs all 8 cases through our own
  CLI as the stand-in loader (8/8 honored) and asserts both failure
  directions (accept-all loader: 7 audit failures; silent refuser that
  names nothing: 8). Ships `conformance/` and `profiles/` in the npm
  files list.
- **docs/discussions release-post system (family convention, mirrored
  from crashtest#28's pull -> packstruct#8).** One
  `announcing-vX.Y.Z.md` per release + the conventions index; the file IS
  the Discussions announcement (copy raw, strip frontmatter); drafted
  against the RELEASED npm version only. First post:
  `announcing-v0.9.0.md` (0.9.0 is live on npm). README carries the direct
  Creadev.org workshop link now.
- **`profiles/` pages: the one-address profile declaration.**
  `profiles/scenario.md` (links to crashtest's host-owned
  `reference/scenario-contract` rather than copying it, per the
  crashtest#19 ruling) and `profiles/check.md` (honest about poststruct
  not shipping yet - engine-first: their loader wins, SPEC updates first).
  SPEC section 3 names the canonical pages; README links; docs site gains
  /profiles + /conformance pages and nav entries.
- **Refusal-matrix packstruct column (#3).** `scripts/gen-refusal-matrix.mjs`
  runs a 17-row hostile-manifest battery (shapes + allowed corners) against
  the ACTUAL linter bytes-on-disk and refuses the run if any row's observed
  verdict disagrees with its expectation - the matrix cannot go stale or
  lie. Outputs `labs/refusal-matrix.packstruct.json` (the golden column)
  and portable `labs/refusal-battery/*.json` for host consumption; wired
  into the test workflow so a verdict regression fails CI loudly. The
  host-column asks (crashtest next, poststruct when online) carry their
  own battery files.
- **`lint --deep` (#2).** Load-level probe, honest about its floor: imports
  each declared entry once in-process and names the failure the host's
  loader would hit; checks the default export exists; censuses ids
  (module/attack/step/check names, generic over the two house profiles) for
  within-pack duplicates, cross-pack collisions, and duplicate pack names -
  the engine's shared-`seen` refusal (crashtest fc93ca6
  `src/packs/loader.js:389-391`) at author time. JSON output gains
  `mode`, `modulesProbed`, `idsCensused`. Probe only: host module-shape
  norms stay host-owned (SPEC section 3); the id-vs-host-library census
  needs a host library reference and stays open on #2. Fixtures both ways
  (`test/fixtures/deep/`), self-test extended, corpus lane now deep-probed
  (receipt: 8/8 packs, 44 ids, zero collisions - the crashtest#19 census
  reproduced through our own linter).
- **`lint --deep --against <path>` (#2): the host-library census.** Seeds
  the id census with a host library's ids (a JSON file, an ESM module, or a
  directory of modules - generically probed, shape-neutral) so pack ids
  claiming library ids refuse at author time (`id-library-collision`); a
  failing library ref names itself (`library-ref`) without blocking the
  pack walk. Receipt: 44 pack ids vs 63 library ids across crashtest's
  built-in scenario library, zero collisions (labs/corpus-receipt.md); CI
  runs it as the corpus lane's third step. #2's boundary (host library
  census vs the engine's flat id space) documented in the same close-out.
- **Reciprocal corpus lane (#3).** `corpus.yml` runs `packstruct lint` over
  crashtest's 8 shipped packs at the audited pin (`fc93ca6`) on every main
  push; local receipt in `labs/corpus-receipt.md` (8/8 clean, zero
  violations). Zero runtime dependencies on the corpus repo - pinned clone,
  zero-dep CLI. (The refusal-matrix half folded at the #3 close - see the Changed block above).

### Changed
- **SPEC.md: frozen-table receipts + pack-semver decoupling (#4).** Every
  frozen row now cites its engine evidence (`src/packs/loader.js` line
  numbers at crashtest `fc93ca6`), marking which norms the engine enforces
  and which are pack-reality norms the linter deliberately enforces more
  strictly (name == dir); parity tracked in #2. Section 6 carries the pack
  semver ↔ CLI/spec release-decoupling law (verbatim house policy from
  crashtest's AGENTS.md) plus the mirror-image rule for packstruct's own
  version ladder.
- The landing moved from static `site/` files to a real Vite + React app
  under `web/`, prerendered by `prestruct build` (the same npm engine
  crashtest's site rides - dogfooding the family's own SEO layer).
  Routes: `/`, `/spec`, `/lint` (with an in-browser SPEC v1 manifest
  validator island), `/terms`, `/privacy`; per-route static HTML, brand
  injection from `ssr.config.js`, islands ontology intact, mint-on-pine
  theme (distinct from crashtest's amber). Cloudflare Pages contract:
  Git integration rooted at `web/`, output `web/dist`, Functions at
  `web/functions/api/health.js`.
- SPEC v1 folds the crashtest#19 ruling: three host-owned acknowledged keys
  (`env`, `plugins`, `package`) named alongside the shared-facts column, so
  the frozen table matches what crashtest's loader already shape-validates
  and the linter never refuses a pack for carrying them; baseline receipts
  updated (2026-10-24 audit: 8/8 conform, 44 ids, zero collisions);
  `profiles/scenario.md` links to crashtest's `reference/scenario-contract`
  (the one-address page now exists at profiles/).


### Added (scaffold, 2026-10-23)
- `spec/SPEC.md` v1: directory contract (`packs/public/<name>/`), frozen
  pack.json field set (verified against crashtest production packs),
  named entry profiles (`scenario`/`check`), lifecycle norms, nameable
  refusals, naming + versioning/conformance sections.
- `packstruct lint <packs-dir>` zero-dependency CLI: manifest validation +
  entry-existence check, `--json` output, exit-code contract.
- Self-audit fixtures: conforming sample pack + broken pack manifest
  (crashtest#16 class), with exact expected-lint norm asserts.
- Crashtest dogfood lane: `crashtest.config.js` + `pack lint-shapes`
  scenario pack (hostile manifest corpus via in-process lint double,
  entry-containment, over-strict-drift canary, clean-pack canary);
  `crashtest.yml` CI job pinned to dhaupin/crashtest v1.0.0.

### Notes
- Versioning: 0.9.x is the manual npm release ladder.
- 1.0.0 flips on OIDC trusted publishing via GitHub Actions
  (`publish.yml` refuses 0.x, so that guard is actually exercised).
