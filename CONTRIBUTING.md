# Contributing to packstruct

Thanks for wanting to help. packstruct is the shared `/packs` spec, so a change here is a change every host feels - which means contributions are welcome and the bar is deliberate.

> **Canonical source note:** the operating rules live in [AGENTS.md](AGENTS.md) - the identity, the mechanical conventions, the gate, and the branch flow. This file is the short front door: the path in, the gates to run, and where to ask. Do not grow it into a second copy of AGENTS.md; that is how docs drift.

## The path in

1. **Report a bug.** Use the [bug report form](https://github.com/dhaupin/packstruct/issues/new?template=bug_report.md) - the linter, the conformance harness, or the spec text. Paste the exact command and the output.
2. **Propose a spec change.** Use the [feature request form](https://github.com/dhaupin/packstruct/issues/new?template=feature_request.md). Say whether it is additive. Additive rows keep `schemaVersion` at 1; removals or renames are a major bump that needs a migration note (SPEC section 11).
3. **Register a host.** Built an engine that loads packs? Use the [new host form](https://github.com/dhaupin/packstruct/issues/new?template=new_host.md) - that is the "traveler" on-ramp (SPEC section 10).
4. **Adopt packstruct.** Standardizing a repo or a fleet? Use the [adoption form](https://github.com/dhaupin/packstruct/issues/new?template=adoption.md).
5. **Send code or docs.** Fork, branch off `staging`, change, run the gate, open a PR against `staging`. Commit messages use `type: description` (`fix`, `feat`, `docs`, `chore`, `refactor`, `test`).

## The gate

Nothing merges without it. Run both before you push:

```bash
npm test     # the battery: the self-test + the conformance/refusal suites
npm run check   # docs gates + action pins + prestruct pins + legal + matrix + packs + conformance
```

`npm run check` is the same gate the release ladder runs (`prepublishOnly`). It covers:

- `lint:docs` - frontmatter, links, style, Jekyll filters, and the language gate
- `lint:pins` - every GitHub Action `uses:` names a 40-hex SHA, never a floating tag
- `lint:prestruct-pins` - the prestruct pin is at or above the floor
- `check-legal` - the Terms and Privacy pages hold the family canon
- `matrix:check` - the refusal matrix is drift-gated both ways
- `lint:packs` / `conform:packs` / `conform:claims` - the shipped pack and the 9/9 conformance audit

Two rules that surprise first-timers:

- **A new check ships with a fixture that breaks it.** The linter is strict against spec norms and only those norms - if a check would flag something the spec says is fine, fix the spec or the check, never ship the check.
- **Pins, never floats.** Bump a companion pin and its receipt row moves in the same change, never silently.

## House rules

- **The spec is normative; `src/` and `bin/` implement it.** A disagreement is a bug in one of them - resolve it, do not paper over it.
- **Web and docs stay in lockstep.** A new page ships a branded page and a docs page in the same change.
- **Prose flows.** Living prose does not hard-wrap; `scripts/unwrap-prose.cjs` joins it. Dated history keeps its era wording.
- **The log is the memory.** Append to [labs/TASKS.md](labs/TASKS.md), and add a CHANGELOG.md Unreleased item for every PR.

## Questions?

- Questions and ideas: [GitHub Discussions](https://github.com/dhaupin/packstruct/discussions)
- Bugs and proposals: [GitHub Issues](https://github.com/dhaupin/packstruct/issues)
- The normative rule: [spec/SPEC.md](spec/SPEC.md)

## License

MIT - see [LICENSE](LICENSE).
