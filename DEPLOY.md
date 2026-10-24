# DEPLOY.md - packstruct release runbook

packstruct is an npm tool. "Deploy" = publish. The model follows prestruct
exactly:

1. **0.9.x is manual.** While the major is 0.x, publishing is done by a human
   with `npm publish`. The publish workflow REFUSES 0.x versions.

## Release atomicity ([Unreleased] discipline, ruled 2026-10-24 on crashtest#20)

- The CHANGELOG `[Unreleased]` section is staged content, not a release. At
  publish time it is flipped to the dated version header IN the same commit
  that carries the tag, so the git push and the npm release tell one story.
- Never mint a patch version for a docs-only change after a published
  release: if anything slips and a publish would ever ship without its
  fold text, prefer retagging the same commit over a version bump - a docs
  bump masquerading as an artifact change is a semver governance fail both
  here and at the crashtest pack-semver governance side.
- A `[Unreleased]` section sitting untagged across two or more pushes is
  the misriff signal: whichever linter is on hand should flag it.

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

- `package.json`: `"files"` whitelists `bin/`, `src/`, `spec/`, `LICENSE`.
  so spec + CLI ship together and `npx packstruct lint` works from a fresh
  install.
- `engines.node: ">=20"` runtime floor.

## Landing site (Cloudflare Pages, packstruct.creadev.org)

- The lean branded landing deploys as a **Cloudflare Pages project** named
  `packstruct` with the production custom domain `packstruct.creadev.org`.
- `wrangler.toml` pins the contract: `pages_build_output_dir = "site"`: the
  landing is static files in `site/`, no build step required; serving is
  Pages' job.
- **Functions:** `functions/api/health.js`: `GET /api/health` returns honest
  JSON including the spec pin. Pages Functions are the only worker surface
  this repo runs.
- Docs site: `docs.creadev.org/packstruct` (**GitHub Pages via Actions**)
  (`.github/workflows/docs.yml`): docs-truth gates first (ported house
  checkers: frontmatter 5-field law, resolvable links, style law incl.
  no-dashes-in-prose, English-only prose), then Jekyll, then
  `freestruct --strict` (basePath-aware: /packstruct; broken links fail
  the build), then `pagefind --site _site` from the proven musl tarball
  (the npx path DIED in CI once - measured in dhaupin/freestruct's docs
  workflow), then the official Pages artifact deploy. Verified against
  the house examples: dhaupin/prestruct + dhaupin/freestruct; node
  stages executed locally with real versions (freestruct 1.0.0,
  pagefind 1.5.2). First run needs the Pages source flipped to "GitHub
  Actions" in repo settings (Settings → Pages).
