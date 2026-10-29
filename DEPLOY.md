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
3. `publish.yml`: `push: tags: ['v*']` + `workflow_dispatch`; tag-match
   + 0.x-refuse + idempotent already-published gates (`npm view
   packstruct@<version>`); `npm install` + `npm test`; publishes via
   OIDC trusted publishing (`id-token: write`, NO NPM_TOKEN secret).
4. Thereafter: change files, bump version, tag vX.Y.Z. Done.

## npm prep

- Registry name **packstruct** is namespace-checked in CI with `npm view`
  before publish - if it's taken, the release fails instead of clobbering.
- **npm Trusted Publishing (OIDC), no NPM_TOKEN** - matching prestruct/
  crashtest/freestruct: the repo stores no publish secret. One-time setup
  on npmjs.com is required BEFORE the first tag: packstruct -> Settings ->
  Trusted Publisher (repo `dhaupin/packstruct`, workflow `publish.yml`).
  The manual 0.9.0 bootstrap already created the package, so OIDC's
  brand-new-package limit (npm/cli#8544) does not apply.

## Ladder detail: publish.yml (as built)

- Node 24 on the runner (trusted publishing needs node >= 22.14 /
  npm >= 11.5.1); `npm install` - this repo ships no root lockfile, so
  `npm ci` is not an option.
- `npm publish` runs `prepublishOnly` = `npm test && npm run check`
  (packstruct#33): the registry cut cannot happen without the test suite,
  the docs gates, the shipped pack's deep lint, and the 8/8 conformance
  audit all green. `check` is the battery; `prepublishOnly` is the gate.
- Gate order: tag must equal package.json's version (a workflow_dispatch
  on main cannot leak-publish), 0.x versions refuse, then the
  `npm view packstruct@<version>` idempotent skip.
- After publish, the `github-release` job cuts the GitHub Release for the
  same tag (`needs: publish`): the npm tarball packed as the release asset
  with a listing-file guardrail (shipped surfaces present, repo-bound
  internals like web/, docs/, labs/, test/ absent), generated notes.

## Phone publish lane (packstruct#35)

`scripts/ship-from-download.cjs` is the family's generic phone publish recipe
(copied as-is from eyestruct@9744c76, behavior test in
`tests/ship-from-download.test.cjs`). It stages a git-less zip-extracted tree
into the Termux home (where symlinks work), runs `npm ci`, and `npm publish`,
with the repo's own `prepublishOnly` gate riding unchanged - the script only
reaches the launchpad, the gate still rules.

```
NPM_TOKEN=npm_xxx node scripts/ship-from-download.cjs \
  --target /storage/emulated/0/Download/packstruct-main/packstruct-main \
  --root ~/web/packstruct-main          # [--dry-run] [--clean]
```

The token comes from `NPM_TOKEN` (or `--token-file`), expands from env into a
staged one-line `.npmrc`, and never lands in argv, on disk, or in the log
(unlinked in a finally, publish failing or not). Named refusals only, exit
0/1/2: wrong/unnamed tree, shared-storage roots, occupied roots (rm advice,
never deletion), non-`npm_` tokens, pre-existing `.npmrc`. `--clean` (opt-in)
removes the staged root on every exit after staging.

## Local docs preview (packstruct#32)

An agent sandbox has no sudo and no system Ruby; the Jekyll stack runs from a
prebuilt, platform-matched Ruby unpacked under `$HOME` (never the repo), and
the build runs from a scratch COPY of `docs/` so no product lands in-tree:

1. Download the official ruby/setup-ruby toolchain asset for the platform
   (tag `ruby-<ver>`, asset `ruby-<ver>-<os>-x64.tar.gz`; the tag is the
   VERSION - a `toolcache` tag 404s) and unpack into `~/rubies`.
2. `LD_LIBRARY_PATH=~/rubies/x64/lib`; shim the binstubs through the
   interpreter (`#!/bin/sh` + `exec ~/rubies/x64/bin/ruby ...`) because the
   shipped shebangs bake `/opt/hostedtoolcache/...`.
3. Point `GEM_HOME`/`GEM_PATH` at the unpacked gem dir; set `RUBYLIB` to the
   stdlib + arch dirs when the prefix moves.
4. `BUNDLE_PATH` outside the repo; build from `/tmp/docs-preview` (a copy of
   `docs/`), never from `docs/` itself.
5. Serve `_site` under the real baseurl (symlink `<webroot>/packstruct` to
   `_site`, `python3 -m http.server`) so baseurl'd links resolve.

`.gitignore` carries the belt-and-suspenders block (`docs/.bundle/`,
`docs/vendor/`, `docs/_site/`, `docs/Gemfile.lock`) so an accidental in-tree
build taints nothing.

## Key facts baked in

- `package.json`: `"files"` whitelists `bin/`, `src/`, `spec/`,
  `profiles/`, `conformance/`, `LICENSE` - so spec + CLI + the conformance
  fixtures ship together and `npx packstruct lint` works from a fresh
  install.
- `engines.node: ">=20"` runtime floor.

## Landing site (Cloudflare Pages, packstruct.creadev.org)

- The landing deploys as a **Cloudflare Pages project** named `packstruct`
  with the production custom domain `packstruct.creadev.org`. It is a Vite +
  React app under `web/`, prerendered by the `prestruct` engine the same way
  crashtest's site is (same template, different palette: mint-on-pine vs
  amber lab).
- Pages Git integration settings: **root directory `web`**, build command
  `npm run build` (which runs `prestruct build`: vite build + brand/SEO
  injection from `web/ssr.config.js` + per-route static prerender), output
  directory `dist`. There is no root `wrangler.toml` - the contract lives in
  this runbook and the dashboard settings, exactly like crashtest's.
- **Functions:** `web/functions/api/health.js`: `GET /api/health` returns
  honest JSON including the spec pin. Optionally set `SITE_NAME` in the
  Pages project vars; the function's fallback covers its absence. Pages
  Functions are the only worker surface this repo runs.
- **Do not add a `/* /index.html 200` SPA fallback** (`web/public/_redirects`
  explains why: every route prerenders its own HTML, and the fallback
  redirect-loops against CF's pretty URLs).
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
