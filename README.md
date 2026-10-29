# packstruct 1.1.0

The shared `/packs` spec. **One manifest + entry + lifecycle contract, many
hosts**, currently [crashtest](https://github.com/dhaupin/crashtest)
(scenario profile) and [poststruct](https://github.com/dhaupin/poststruct)
(check profile).

This repo ships the normative spec ([spec/SPEC.md](spec/SPEC.md)) plus a
zero-dependency lint CLI that kills the worst pack-authoring class at author
time: a manifest declaring an entry file that doesn't actually ship
(crashtest#16). Every fleet repo uses the same core check.

## The directory contract

```
packs/
  public/
    <pack-name>/
      pack.json    # REQUIRED: fields per spec/SPEC.md section 2
      <entry>      # REQUIRED: the file pack.json's "entry" names
```

## Usage

```bash
npx packstruct lint packs/          # human, exit 0 clean / 1 violations / 2 usage
npx packstruct lint packs/ --json   # machine-readable: {schema, packsChecked, localChecked, violations}

npx packstruct lint packs/ --deep   # + entry import, default-export check, id census
npx packstruct lint packs/ --deep --json   # adds mode, modulesProbed, idsCensused, libraryIds
npx packstruct lint packs/ --deep --against lib/   # + host-library id census (id-library-collision)
npx packstruct lint packs/ --local  # + the gitignored local/ WIP lane (lane-tagged rows)

npx packstruct audit-conformance . \
    --loader "node bin/load-packs.js {packs}"   # audit a HOST loader (SPEC section 7)

npx packstruct new my-shapes        # scaffold a conforming pack skeleton (packstruct#24)
```

The linter validates `schemaVersion === 1`, kebab-case name matching its
directory, dotted versions, non-empty description, relative entry paths, and
that the entry file physically exists under the pack dir. Optional
`armedByKey` string. Host-owned keys the engine also recognizes (`env`,
`plugins`, `package`) are acknowledged by name and never refused. Everything
else (extra manifest keys, snapshot files beside the entry) is
minimum-spec and left alone.

`audit-conformance` is the next half of conformance (SPEC section 7): it
materializes bundled verdict-claiming fixture packs (one clean bundle, one
per refusal norm, a name-collision pair) into scratch roots and runs YOUR
loader command over each - a conforming loader exits 0 on clean and exits
non-zero naming the pack on every violation (identity match, refusal wording
stays host-owned). The `implements: packstruct@1` pin becomes verifiable,
not honorary.

## Profiles

The two entry profiles are declared once, with the spec (one address per
the crashtest#19 ruling): [profiles/scenario.md](profiles/scenario.md)
(crashtest - links to the host-owned contract instead of copying it) and
[profiles/check.md](profiles/check.md) (poststruct).

## How the schema version was chosen

The baseline (formalized 2026-10-23) is exactly what crashtest's production
packs already ship: `schemaVersion: 1` with the shared field set above.
Therefore crashtest hosts v1 with **zero runtime changes**, and poststruct
adopts v1 fresh. Neither host shares an implementation with the other. They
share only this file convention.

## Family lanes (receipts, not asks)

Every consuming host keeps a receipt row here: engine, the exact source sha the
row grates against, the lint result, and the cut date. The row is the receipt -
`implements: packstruct@1` in a host README stops being honorary when the
registry row is sha-pinned and cut before the consumer's publish wave. Bump a
companion pin and the receipt moves in the same change, never silently
(packstruct#25).

| Host | Pin (engine @ source sha) | Result | Cut |
|---|---|---|---|
| crashtest | `crashtest@1.1.0` @ `2d1fe79` (npm tag v1.1.0) | 8/8 packs clean shallow + deep, 44 ids, 63 library ids, zero collisions (`labs/corpus-receipt.md`) | 2026-10-29 |
| crashtest (dogfood) | `crashtest@1.1.0` @ `2d1fe79` | `packstruct-lint-shapes` 34/34 REFUSED, 0 EXPLOITED, 0 BOUNDED | 2026-10-29 |
| eyestruct | `eyestruct@1.0.0` @ `4b979c0` (tag v1.0.0) | 5/5 packs (eye-adapter, eye-bundle, eye-ci-gate, eye-shapes, eye-text-leg) clean shallow + deep through the packstruct@1 lane | 2026-10-29 |
| poststruct | staging in flight | row reserved - activates when it settles (honest absence, not padding) | - |

The registry is the natural home for companion-pin bump receipts (SPEC v1.1
section 8 row 5) and the checkable form of a traveler's onboarding (SPEC v1.1
section 10): a host exists when it holds a row, not when a session transcript
mentions it. A non-additive schema event must update the affected rows (SPEC
v1.1 section 11).

## Status (1.1.0)

Version ladder follows [prestruct](https://github.com/dhaupin/prestruct)'s
convention: 0.9.x is the manual `npm publish` ladder (0.9.0 was the manual
release that seeded the package); 1.0.0 and later flip on the CI publish
lane - tag v1.0.0 and publish.yml runs (refuses 0.x, verifies the tag
matches the version, and publishes with `--provenance`, so v1.0.0 carries
provenance by construction).

## Related

- [crashtest](https://github.com/dhaupin/crashtest) (scenario-profile host)
- [poststruct](https://github.com/dhaupin/poststruct) (check-profile host)
- **The workshop** -> [Creadev.org](https://creadev.org) (the same home as the
  docs, npm, and site surfaces above)

## Landing & docs

Landing: `packstruct.creadev.org` (Cloudflare Pages Git integration rooted at
`web/` - a Vite + React app prerendered by `prestruct build` into `web/dist/`
per-route; Pages Functions under `web/functions/`). Docs:
`docs.creadev.org/packstruct` (Jekyll + Pagefind + Freestruct via GitHub
Actions; see `.github/workflows/docs.yml` and `docs/`).

Build the site locally: `cd web && npm install && npm run build` - `prestruct`
runs the vite build, injects brand/SEO tags from `web/ssr.config.js`, and
prerenders every route to static HTML (bots get HTML, the SPA hydrates for
humans).

## Development

Zero runtime dependencies. The gate is `npm test && npm run check` - `check`
composes the docs gates, a deep lint of the repo's own shipped pack, and the
8/8 conformance audit (the same command `prepublishOnly` runs, so a publish
cannot ship an unverified SPEC or pack surface).

```bash
npm test        # the lint + deep + audit + edge contract suite
npm run check   # docs gates + lint:packs + conform:packs (the battery)
npx crashtest run   # the dogfood: hostile manifests through the CLI wire
```

## Crashtest dogfood

`crashtest run` from the repo root drives `packs/public/packstruct-lint-shapes`: hostile pack.json corpora through an in-process lint double (the same CLI wire CI uses), asserting the SPEC v1 section 5 contract - instant nameable refusal, no crashes, no deep stacks, and strict tolerance for spec-allowed shapes. Pinned to dhaupin/crashtest v1.1.0.
