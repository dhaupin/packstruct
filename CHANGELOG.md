# Changelog

All notable changes to packstruct will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Reciprocal corpus lane (#3).** `corpus.yml` runs `packstruct lint` over
  crashtest's 8 shipped packs at the audited pin (`fc93ca6`) on every main
  push; local receipt in `labs/corpus-receipt.md` (8/8 clean, zero
  violations). Zero runtime dependencies on the corpus repo - pinned clone,
  zero-dep CLI. The refusal-matrix half of #3 stays open.

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
  `profiles/scenario.md` will link crashtest's `reference/scenario-contract`
  rather than copy it.

## [0.9.0] - 2026-10-23

### Added
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
