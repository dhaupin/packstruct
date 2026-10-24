# AGENTS.md - packstruct

## Identity
- **Name:** packstruct (the packs spec, frozen at v1)
- **Repo:** dhaupin/packstruct
- **Core law:** manifest frozen, refusal instant and nameable
- The spec is a picture of what hosts already do (crashtest's manifest fields,
  verified against production packs), not a re-design of them.

## Mechanical conventions (this repo)
- `spec/SPEC.md` is normative; everything in `src/` and `bin/` implements it.
- The linter is STRICT against spec norms and only those norms. If a check
  would flag something spec says is fine, fix the spec or the check: never
  ship a check the SPEC doesn't promise.
- Crashtest dogfood: `crashtest.config.js` + `packs/public/packstruct-lint-shapes` attack the lint contract with hostile manifest corpora via an in-process double. `npx crashtest run` before merges that touch `src/` or the pack. Cross-repo pack doctrine: no imports from crashtest internals; verdict records inline.
- Fixtures under `test/fixtures/` carry both sides: a clean sample pack +
  a broken pack manifest pointing at a missing entry. `npm test` before
  touching anything in `src/`.
- Adding a validate rule = added cases both ways in `test/fixtures`.
- Don't version-bump the spec (major) without a migration note: §6.
- All prose uses zero configured-voice words from poststruct's language pack.

## Release
- 0.9.0 = current manual npm. Bump to 1.0.0 → tag v1.0.0 → publish.yml runs
  (same OIDC trusted publishing as prestruct, refuses 0.x versions).
- CHANGELOG.md is Keep-a-Changelog; every PR adds an Unreleased item.
