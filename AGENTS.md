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
- The gate is `npm test && npm run check` (`prepublishOnly`, packstruct#33):
  `check` = `lint:docs` (4 docs gates) + `lint:packs` (the shipped pack
  deep) + `conform:packs` (the 8/8 conformance audit). The registry cut
  cannot happen without it. Run `npm run check` before merges too.
- Generated files never travel: `node_modules/`, `web/dist/`,
  `web/.prestruct/`, `docs/_site/`, `docs/Gemfile.lock`, `labs/run-meta.json`
  (the one churn-by-design stamp), and `packs/local/` (the WIP lane) are in
  `.gitignore`. Root `.gitignore` + `web/.gitignore` both apply.
- Adding a validate rule = added cases both ways in `test/fixtures`.
- Don't version-bump the spec (major) without a migration note: §6.
- All prose uses zero configured-voice words from poststruct's language pack.
- Site: `web/` is a Vite + React app built by `prestruct build` (identity in
  `web/ssr.config.js`). `web/src/islands.js` + `web/src/hooks/usePageMeta.js`
  are engine files - copy once, never edit. `web/src/App.jsx` keeps
  BrowserRouter alone; importing it anywhere the prerender loads makes every
  route render as the homepage.

## Companion pins & receipts
- Never pin to a line npm does not serve. `prestruct` and `freestruct`
  publish 1.1.0; their react-router/basePath fixes sit on `main` as
  unreleased 1.2.0. `npm view <pkg> versions` before any bump - an
  `ETARGET` pin breaks the lane instead of fixing a bug.
- The docs lane holds `freestruct@1.0.0` on purpose: published 1.1.0
  resolves root-absolute hrefs literally, so on the `/packstruct` baseurl
  `--strict` fails every nav link. The pin moves when the fix publishes.
- Registry rows (README "Family lanes") are receipts: re-run the lane
  against the pinned sha before trusting a row. A row that is wrong is
  worse than absent.

## Release
- 1.0.0 and later = the governed ladder: tag v1.x.0 → publish.yml runs
  (same OIDC trusted publishing as prestruct, refuses 0.x versions; 0.9.0
  was the manual npm release that seeded the package).
- CHANGELOG.md is Keep-a-Changelog; every PR adds an Unreleased item.

## Branches (packstruct#42)
- `staging` is the PERMANENT integration branch: work branches off it, PRs
  target it, and promotion to `main` is the only path out. Never delete it.
- CI covers `staging` as well as `main` (test, crashtest, corpus, docs).
  Any deploy job is gated `if: github.ref == 'refs/heads/main'` - once the
  trigger covers staging, the trigger no longer keeps its content out of
  production, the job must (docs.yml's deploy is gated).
- Promote by FAST-FORWARD so drift cannot happen:
  `git push origin staging:main`. A merge-commit promotion puts a commit on
  `main` the integration branch lacks, so the two drift by one on every
  promotion; if a merge-commit promotion ever happens, resync with
  `git push origin origin/main:staging` (non-destructive).
