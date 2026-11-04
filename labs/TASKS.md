# labs/TASKS.md

Last updated: 2026-10-24 (scaffold complete at 0.9.0, folded the crashtest#19/#20 rulings; push pending crashtest#18. The proposal arc: #17 filed, #19 receipts + leans confirmed, #20 release-atomicity ruling encoded in DEPLOY.md.)

- [ ] M2: conformance harness (packs a loader must pass/fail)
- [ ] M2: scenario-profile fixture for crashtest-host packs
- [ ] M3: language pack (poststruct vibe checks)

## 2026-11-03 - the pin guard goes family-wide (packstruct#69 back-port)

- `scripts/check-action-pins.cjs` (the "pins, never floats" guard) was a packstruct-only artifact (it landed on packstruct's `fix/sha-pin-actions`). It is now copied byte-identical into every sibling: `crashtest`, `eyestruct`, `freestruct`, `gistory`, `govstruct`, `monoforge`, `poststruct`, `prestruct` (packstruct already had it).
- Wired as `npm run lint:pins` inside each repo's publish gate (`check` / `gate` / `prepublishOnly`) and CI, and the guard's own battery (`check-action-pins.test.*`) rides `npm test`.
- Each repo's workflows were already SHA-pinned, so the guard is now mechanical here too. Receipt: `ACTION PINS: PASS (19 ref(s), all SHA-pinned)`, pin battery 8/8, full battery green.
