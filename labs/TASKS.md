# labs/TASKS.md

Last updated: 2026-10-24 (scaffold complete at 0.9.0, folded the crashtest#19/#20 rulings; push pending crashtest#18. The proposal arc: #17 filed, #19 receipts + leans confirmed, #20 release-atomicity ruling encoded in DEPLOY.md.)

- [ ] M2: conformance harness (packs a loader must pass/fail)
- [ ] M2: scenario-profile fixture for crashtest-host packs
- [ ] M3: language pack (poststruct vibe checks)

## 2026-11-03 - the pin guard goes family-wide (packstruct#69 back-port)

- `scripts/check-action-pins.cjs` (the "pins, never floats" guard) was a packstruct-only artifact (it landed on packstruct's `fix/sha-pin-actions`). It is now copied byte-identical into every sibling: `crashtest`, `eyestruct`, `freestruct`, `gistory`, `govstruct`, `monoforge`, `poststruct`, `prestruct` (packstruct already had it).
- Wired as `npm run lint:pins` inside each repo's publish gate (`check` / `gate` / `prepublishOnly`) and CI, and the guard's own battery (`check-action-pins.test.*`) rides `npm test`.
- Each repo's workflows were already SHA-pinned, so the guard is now mechanical here too. Receipt: `ACTION PINS: PASS (19 ref(s), all SHA-pinned)`, pin battery 8/8, full battery green.

---

### 2026-11-04 - session: the docs-lane consolidation (this repo now calls THE one lane)

The family carried four docs topologies - freestruct's `docs-lane.yml`, coreforge's forked `docs-build.yml`, govstruct's copy of that fork, and five inline hand-copies - and the two reusable lanes had already drifted (ruby 3.2 vs 3.4, pagefind `latest` scrape vs npm pin). Owner call: consolidate to ONE lane, `dhaupin/freestruct`'s `docs-lane.yml`, no drift.

- `.github/workflows/docs.yml` - now a THIN caller of `dhaupin/freestruct/.github/workflows/docs-lane.yml@22bb7e9b2634d6cdd966963d9e25c7f892577276`. The runbook (Jekyll, the hardened pagefind scrape, the pinned freestruct post-build layer, the optional crashtest dogfood campaign, the Pages upload, the main-gated deploy) lives once in the lane; this file keeps only the trigger, permissions, concurrency, and this repo's input pins.
- No `package-lock.json` here (a library), so the lane's lock-aware install takes the `npm install` path (and the lane's setup-node cache is skipped, since it needs a lockfile). No `crashtest.config.js`: the dogfood leg stays off. ruby 3.4.
- **Receipts:** the caller parses; `uses:` resolves to the lane at the pinned SHA; no local `docs-build.yml` remains.
- **No version bump**; a workflow consolidation, not a released surface.

- **The pin guard now scans `action.yml` (2026-11-04 sweep).** The family pin guard (`scripts/check-action-pins.cjs`) scanned only `.github/workflows/`, so a floating `uses:` in a repo-root composite Action manifest went unseen. crashtest's `action.yml` (the gate other repos add) carried `actions/setup-node@v6` and `actions/upload-artifact@v6` plus a duplicated `default:` key; both are now pinned and the key is gone. The guard scans the manifest alongside the workflows, and its battery proves the new leg bites. Sweep finding; no version bump.

---

### 2026-11-07 - session: the spec gets a face (showcase + a reworked landing)

The proto site was accurate but abstract - it explained the manifest grammar before it explained why anyone would care, listed five hosts and called monoforge "queued", and had no single place to walk the family. This session reworks the site so a first-time visitor understands what packstruct IS and sees the proof, without losing the frame (the same Vite + React shell, prestruct prerender, nav/sidebar/theme tokens, and legal/status pages the fleet shares).

- **New `/showcase` page (web) + `/showcase` docs page.** Every host that ships a `packs/` directory, with crosslinks to each repo and site: crashtest, vant, gistory, prestruct (scenario); poststruct, govstruct, eyestruct, monoforge (check); plus packstruct's own dogfood pack. Static by design (prerenders from pure data, so crawlers and no-JS visitors read the whole board).
- **One pure-data registry (`web/src/hosts.js`).** Home, Packs, and Showcase all render from it, so a new host or a count change lands in one place. Profile badges, host cards, and the family list share one shape.
- **The counts are receipts, not invention.** Every pack count and id census came from running `packstruct lint <repo>/packs --deep` over each host's live tree; every pin was read from that repo's `package.json`. Result: **69 packs / 9 hosts**, all clean (vant shows one pre-existing `entry-import` violation in `vant-carriers` - a vant-side path, filed as a finding, not a spec issue).
- **Home reworked** to lead with the plain-language pitch ("Write one pack. Load it in nine hosts.") and a "what is it, in one breath" trio (spec / linter / harness), then the host proof and the existing pipeline/why sections.
- **What/Why/About refreshed** to name all nine hosts and the wider family (freestruct, coreforge, railyard), with crosslinks. Packs page now lists all nine hosts with real counts instead of five.
- **README family-lanes registry** re-cut: rows for poststruct, govstruct, monoforge, vant, gistory, prestruct added; the stale eyestruct row (5/5) corrected to 6/6.
- **Receipts:** web build 11/11 routes, prestruct audit 0 failures; `npm run check` green (frontmatter/links/style/jekyll/language, action pins, prestruct pins, legal, refusal matrix, lint:packs, conform:packs 9/9, conform:claims 9/9).
- **No version bump yet** (Unreleased; the site is a served surface but the release ladder is tag-driven).
