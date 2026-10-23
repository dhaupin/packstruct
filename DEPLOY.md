# DEPLOY.md - packstruct release runbook

packstruct is an npm tool. "Deploy" = publish. The model follows prestruct
exactly:

1. **0.9.x is manual.** While the major is 0.x, publishing is done by a human
   with `npm publish`. The publish workflow REFUSES 0.x versions.

## Ladder to automated publishes

1. Bump `package.json` + `CHANGELOG.md` to 1.0.0 (Unreleased → Dated).
2. Run `npm test` + `npm pack --dry-run` locally. Tag `v1.0.0` and push.
3. `publish.yml`: `push: tags: ['v*']` + `workflow_dispatch`; idempotent
   already-published check (`npm view packstruct@<version>`); `npm ci` +
   `npm test`; publishes with provenance via `id-token: write` OIDC.
4. Thereafter: change files, bump version, tag vX.Y.Z. Done.

## npm prep

- Registry name **packstruct** is namespace-checked in CI with `npm view`
  before publish - if it's taken, the release fails instead of clobbering.

## Key facts baked in

- `package.json`: `"files"` whitelists `bin/`, `src/`, `spec/`, `LICENSE` —
  so spec + CLI ship together and `npx packstruct lint` works from a fresh
  install.
- `engines.node: ">=20"` runtime floor.
