# PRD: packstruct (the shared packs spec)

**Status:** v0.2 - current (2026-10-29) · Owner: dhaupin
**Role:** arm - the write arm. It owns the `/packs` contract every other arm cites.
**Package:** `packstruct` @ 1.1.0 (node >=20). npm latest is 1.0.0; 1.1.0 is committed and pending push.
**Core law:** the manifest is frozen, and a refusal is instant and nameable.
**Family:** the five arms are **govstruct** (govern), **packstruct** (spec),
**crashtest** (attack), **eyestruct** (watch), **poststruct** (audit). packstruct
is the spec the other four cite; a pack written once works in every host.
The forges are **monoforge** (the repo stamp) and **coreforge** (the site rig);
**railyard** is the composer that holds them. The interop law: no host imports a
sibling to check a sibling; it invokes the sibling's public CLI.

---

## 1. One-line pitch

**packstruct is the shared `/packs` spec.** One small document plus a
zero-dependency conformance CLI. It defines how a `packs/` directory works -
manifest, entry contract, lifecycle, errors - so that crashtest, poststruct,
govstruct, and eyestruct ship the same spec from their own `packs/`
directories. Many hosts, one pack system: an author who writes one pack knows
how packs work everywhere.

## 2. Why a spec, and not a convention copied between repos

1. **The contract had already forked in practice.** Crashtest packs and
   poststruct packs share `schemaVersion`/`name`/`version`/`entry` and diverge on
   arming and entry semantics. A spec makes the shared part citable and the
   app-specific part explicitly declared, so drift is named, not accidental.
2. **Third-party authors get one address.** "How do I write a pack?" has one
   answer: read this spec, pick your host's declared profile.
3. **Future hosts are cheaper.** Any family tool that wants a `packs/` dir
   adopts the spec instead of inventing a third dialect. govstruct did exactly
   that (its compliance rules ARE check packs, see §7).

## 3. The spec structure (the normative document)

Tight by design: the whole normative part is one readable page
([`spec/SPEC.md`](../spec/SPEC.md)). Its sections:

| section | what it fixes |
|---|---|
| 1. Directory contract | `packs/public/<name>/pack.json` plus the declared entry file |
| 2. `pack.json` | the frozen v1 field table (below) |
| 3. Entry profiles | `scenario` (crashtest) and `check` (poststruct, govstruct) |
| 4. Lifecycle norms | explicit opt-in, slug-namespaced ids, local paths only in v1 |
| 5. Errors | nameable, instant, never a deep import stack trace |
| 6. Versioning | additive-first schema bumps |
| 7. Conformance tooling | the `lint` and `audit-conformance` lanes |
| 8. v1.1.0 additive rows | six rows, none moving `schemaVersion` (below) |
| 9. Walk-exit rule | a walk is not done while a finding is uncommissioned |
| 10. Onboarding a host | profiles, not forks |
| 11. MIGRATION-NOTE | the shape of a non-additive change note |

### 3.1 The manifest (frozen for `schemaVersion` 1)

| Field | Type | Rules |
|---|---|---|
| `schemaVersion` | integer | MUST be `1` |
| `name` | string | kebab-case, MUST match its directory name - mismatch is a load error, never a silent success |
| `description` | string | one line, human-readable |
| `version` | string | dotted semver-ish (`MAJOR.MINOR[.PATCH]`) |
| `entry` | string | relative path to the entry file, MUST exist in the pack dir (the crashtest#16 lesson: a manifest declaring an entry that does not ship is an instant, nameable refusal) |
| `armedByKey` | string | OPTIONAL. Present means the host MAY require an arming key before activation |
| `armedCoverage` | string | OPTIONAL (v1.1.0). Relative path to the pack's armed end-to-end row; `lint` confirms the file ships, never runs it |

Host-owned acknowledged keys (`env`, `plugins`, `package`, `implements`) are
validated by the host's loader beyond the shared set; the spec names them and
never refuses a pack for carrying them.

### 3.2 Entry profiles (declared, not hidden)

An entry is an ES module whose **default export** is the loaded thing. The spec
defines two profiles; a host implements one, or extends with an app-namespaced
third:

- **`scenario` profile (crashtest):** default export `{ register(ctx) }` -
  supplies hostile scenarios against a transport. Because scenarios execute
  attacks, this profile requires host-level isolation and supports the armed-key
  ceremony.
- **`check` profile (poststruct, govstruct):** default export `{ checks: [...] }`
  - declarative, pure-reading verifiers over files on disk. No transport,
  no network by default; arming defaults to config-enumeration.

The manifest, directory, and entry surface never fork; execution semantics stay
honest per threat model. The host declares which profile it loads.

## 4. The conformance CLI (the project's own artifact)

```
packstruct lint packs/                       # manifests valid, entries exist, names match dirs
packstruct lint packs/ --json                # { schema, packsChecked, localChecked, violations }
packstruct lint packs/ --deep                # plus entry import, default-export check, id census
packstruct lint packs/ --deep --against lib/ # plus host-library id census (id-library-collision)
packstruct lint packs/ --local               # plus the gitignored local/ WIP lane (lane-tagged rows)
packstruct audit-conformance .               # an app's loader honors the spec (fixture packs pass/fail as promised)
packstruct new my-shapes                     # scaffold a conforming pack skeleton
```

The linter is the immediate payoff: it catches the whole class filed upstream
(crashtest#16: scaffolded manifests pointing at entries that do not exist) at
author time, in any family repo, with one command. Exit contract: `0` clean,
`1` violations, `2` usage.

## 5. The v1.1.0 additive rows (adopted 2026-10-29)

Six rows, each citing an engine receipt, none moving `schemaVersion` and none
changing a conforming host's behavior. Full proposal: issue packstruct#19.

1. **`implements`** - the optional host-owned acknowledgement key. Format only:
   `packstruct@<MAJOR>` or an exact pin. A non-conforming shape is a lint
   warning, never a refusal. Receipt: eyestruct and poststruct both carry
   `packstruct@1.0.0` as an exact devDependency.
2. **The `--loader` template contract, formalized.** `{packs}` substitutes the
   case pack's directory path (never a tarball, never a URL). The loader runs
   with CWD = the audited repo root, no network, no implicit host config. Exit
   `0` on the clean bundle; non-zero plus a stderr line naming the offending pack
   on every violation. Receipt: both live harnesses hold every clause.
3. **ESM-default entries, stated plainly.** The entry's default export is the
   loaded thing; module format is the pack's own concern.
4. **Interop routes are a lifecycle norm, not a manifest field.** A pack may
   declare an interop route only through the sibling's **public CLI** - never by
   import, never by guessing a path when an `npx` resolution exists. Receipt:
   poststruct's `eyes-reference` routes SVG verification through eyestruct the
   tool.
5. **Companion-pin receipts.** Hosts carry the packstruct pin they conform to as
   an exact devDependency, bumped deliberately and receipted per host. Nothing
   forces synced bumps; it forces the synchronized receipt when a bump happens.
6. **`armedCoverage`** - the pack-lane coverage declaration. `lint` confirms the
   declared file ships (a declaration naming a missing or escaping path refuses
   as `armed-coverage`); it never runs the row. Receipt: packstruct#27, where
   crashtest walk rounds found pack defects invisible to shape lint.

## 6. The walk-exit rule (v1.1.0)

A manual walk is not done until nothing it found is uncommissioned. Every
finding must be promoted, in the same session, to one of: a battery leg, a pack
verdict row, or a named docket row. Walks **discover** classes; packs
**remember** them. Neither substitutes for the other. Receipt: eyestruct's walk
round landed its serve-dist proofs and the lint-packs exit-fidelity leg in the
same session as the findings.

## 7. The family: who cites this spec

| host | profile | how it uses the spec |
|---|---|---|
| **crashtest** | `scenario` | attacks the loader; ships 8 public packs |
| **poststruct** | `check` | 11 public shape packs; audits what shipped |
| **eyestruct** | `check` | packstruct-linted pack lane; the raster gate |
| **govstruct** | `check` | its compliance rules ARE check packs (surfaces S1-S7) |

The interop law that governs every crossing: **no host imports a sibling to
check a sibling; it invokes the sibling's public CLI.** Prose law is
poststruct's; pack shape is packstruct's; adversarial shapes are crashtest's;
pixels are eyestruct's; the roster is govstruct's. packstruct orchestrates none
of it - it is the grammar they share.

## 8. Onboarding a new host (profiles, not forks)

A new engine joins by answering three questions, in order, never by forking the
manifest:

1. **What does the manifest see?** The frozen v1 field table and the
   host-owned acknowledged keys. Nothing to fork.
2. **What does the lint see?** The same `lint` / `audit-conformance` lanes. A
   new profile extends the cases it reports, never the manifest grammar.
3. **What does run mean?** The only new thing a host owns: a profile row
   (execution semantics), an engine receipt per adopted behavior, and cases in
   `audit-conformance` keyed to its profile id.

A host inherits the standing refusals unchanged: no remote packs, no runs inside
lint, no `schemaVersion` bump for additive rows, exact-pin companion receipts.

## 9. The MIGRATION-NOTE convention

A non-additive change to any family artifact schema MUST carry all of: a
schema-number bump on the owning artifact; a `MIGRATIONS` row (one row per
event: what changed, old shape, new shape, refusal wording); refusal wording on
old shapes at the loader/lint (receipt: crashtest's `validatePackManifest`
already emits `unsupported schemaVersion N (have: 1)`); a dual-read window only
where a host owns the artifact, never for pack manifests; and consumer receipts
from every companion-pin host. No migration execution at load time: a loader
either reads a shape or refuses.

## 10. Milestones

- **M0 - spec text.** `SPEC.md` plus README plus migration notes from each
  host's current reality to the frozen v1. **DONE.**
- **M1 - linter CLI.** `packstruct lint`, zero-dep, MIT. **DONE** - `src/lint.mjs`
  plus `bin/cli.mjs` implement manifest validation, entry existence, and
  name/dir match, with `--json` and the exit-code contract; fixtures pass in
  `npm test`.
- **M2 - conformance harness plus publish.** `audit-conformance` fixture packs;
  npm publish; each host pins `packstruct@1`. **PARTIAL** - the harness is
  live and the spec is at 1.1.0; the 1.1.0 npm push is pending (npm latest is
  1.0.0).
- **M3 - the v1.1.0 rows** are adopted and receipted (see §5). **DONE.**

## 11. Non-goals

- **No pack registry or marketplace.** Distribution stays: git repos plus npm
  under the `@packstruct/*` scope. No central signing service.
- **No runtime loading abstraction.** The spec governs conventions and
  contracts; each host keeps its own loader.
- **No pack version resolver.** The host resolves and refuses versions; the spec
  only documents what manifests may claim.
- **No remote pack sources in v1.** Local paths only; remote sources may add
  later as an explicit additive version, never silently.

## 12. Naming collisions (researched 2026-10-23)

- **Rails Webpacker / shakapacker** - `app/javascript/packs/` (source) and
  `public/packs/` (compiled output). Path-qualified, different intent. The
  conventions coexist; the spec notes the distinction.
- **Cloud Native Buildpacks (`pack` CLI)** - tool-name adjacency only; no
  directory convention.
- **The house fleet is the primary namespace:** a `packs/` dir plus `pack.json`
  at a tool-repo root is ours.

## 13. Docs and house onboarding

- **Docs system - the triple dogfood:** a `/docs` site built on Jekyll plus
  Pagefind plus Freestruct, with poststruct auditing the output. It is
  simultaneously the spec's documentation, freestruct's showcase, and
  poststruct's customer. Domain: `docs.creadev.org/packstruct`.
- **`/labs/TASKS.md`** - the own-runner convention.
- **`/horcrux/` plus the public brain** - `models/public/packstruct/` exists in
  the vant workspace; the boot stone lives in creadev.
- **Site:** `packstruct.creadev.org`, Cloudflare Pages (`wrangler.toml`,
  `functions/` with an `/api/health` canary). Docs via GitHub Pages plus
  Actions: Jekyll, then freestruct (basePath-aware), then pagefind, then the
  official artifact deploy.
