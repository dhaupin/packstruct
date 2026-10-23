# Changelog

All notable changes to packstruct will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
