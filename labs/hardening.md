# Hardening report

> crashtest v1.1.0 / seed 12648430
> cut stamp: labs/run-meta.json (wall clock, deliberately outside this file).
> CI rule: fail on a NEW EXPLOITED finding, or a REGRESSION of anything previously REFUSED.

## Findings

### 🛡 REFUSED (53)
- auth/identity-spoof-headers: route "admin" not declared on this target - spoof matrix skipped (declare it for coverage)
- auth/secret-watermark: no fake secrets planted in env - declare CRASHTEST_SECRET to arm this probe
- auth/privilege-escalation: route "device" not declared on this target - escalation skipped (declare it for coverage)
- authz/method-matrix-privileged: route "admin" not declared on this target - authz skipped (declare it for coverage)
- authz/role-body-spoof-family: route "admin" not declared on this target - authz skipped (declare it for coverage)
- authz/handler-alias-confusion: route "admin" not declared on this target - authz skipped (declare it for coverage)
- governance/succession-trust-floor: vocabulary knob(s) "grantsRoute", "resolveRoute" not declared on this target - governance skipped (export moduleCtx['governance'].grantsRoute/resolveRoute for coverage)
- governance/succession-single-heir: vocabulary knob(s) "grantsRoute", "resolveRoute" not declared on this target - governance skipped (export moduleCtx['governance'].grantsRoute/resolveRoute for coverage)
- governance/succession-revocation-carry: vocabulary knob(s) "grantsRoute", "resolveRoute" not declared on this target - governance skipped (export moduleCtx['governance'].grantsRoute/resolveRoute for coverage)
- governance/escrow-two-key-release: vocabulary knob(s) "escrowRoute" not declared on this target - escrow skipped (export moduleCtx['governance'].escrowRoute for coverage)
- governance/escrow-expiry-is-fail-closed: vocabulary knob(s) "escrowRoute" not declared on this target - escrow skipped (export moduleCtx['governance'].escrowRoute for coverage)
- governance/escrow-refusal-is-typed: vocabulary knob(s) "escrowRoute" not declared on this target - escrow skipped (export moduleCtx['governance'].escrowRoute for coverage)
- governance/grant-conflict-deterministic: vocabulary knob(s) "grantsRoute", "resolveRoute" not declared on this target - governance skipped (export moduleCtx['governance'].grantsRoute/resolveRoute for coverage)
- governance/capability-no-sideways: vocabulary knob(s) "grantsRoute", "resolveRoute" not declared on this target - governance skipped (export moduleCtx['governance'].grantsRoute/resolveRoute for coverage)
- governance/lock-ttl-honesty: governance knob(s) "locksRoute", "ttlMode" not declared on this target - lock-ttl-honesty skipped (declare locksRoute + the DOCUMENTED ttlMode for coverage)
- governance/lock-owner-fencing: governance knob(s) "locksRoute", "staleToken" not declared on this target - fencing skipped (declare locksRoute + staleToken for coverage)
- guards/hygiene-no-store: route "enroll" not declared on this target - attack skipped (declare it for coverage)
- guards/burst-wall: route "burst" not declared on this target - attack skipped (declare it for coverage)
- input/proto-pollution-body: route "enroll" not declared on this target - attack skipped (declare it for coverage)
- input/never-fail-mutations: route "enroll" not declared on this target - attack skipped (declare it for coverage)
- input/oversized-field: route "enroll" not declared on this target - attack skipped (declare it for coverage)
- memory/drift-silent-overwrite: vocabulary knob(s) "writeRoute", "readRoute" not declared on this target - memory skipped (export moduleCtx['memory'].writeRoute/readRoute for coverage)
- memory/drift-stale-poisons-fresh: vocabulary knob(s) "writeRoute", "readRoute" not declared on this target - memory skipped (export moduleCtx['memory'].writeRoute/readRoute for coverage)
- memory/drift-contradiction-carry: vocabulary knob(s) "writeRoute", "readRoute" not declared on this target - memory skipped (export moduleCtx['memory'].writeRoute/readRoute for coverage)
- memory/hallucinated-fact-probe: vocabulary knob(s) "writeRoute", "readRoute" not declared on this target - memory skipped (export moduleCtx['memory'].writeRoute/readRoute for coverage)
- memory/citation-drift: vocabulary knob(s) "writeRoute", "readRoute", "deleteRoute" not declared on this target - citation drift skipped (export moduleCtx['memory'].writeRoute/readRoute/deleteRoute for coverage)
- memory/phantom-scope: vocabulary knob(s) "writeRoute", "readRoute" not declared on this target - memory skipped (export moduleCtx['memory'].writeRoute/readRoute for coverage)
- memory/identity-merge-collision: vocabulary knob(s) "writeRoute", "readRoute" not declared on this target - memory skipped (export moduleCtx['memory'].writeRoute/readRoute for coverage)
- memory/resolution-order-stability: vocabulary knob(s) "writeRoute", "readRoute" not declared on this target - memory skipped (export moduleCtx['memory'].writeRoute/readRoute for coverage)
- memory/delete-is-loud: vocabulary knob(s) "writeRoute", "readRoute", "deleteRoute" not declared on this target - delete skip (export moduleCtx['memory'].writeRoute/readRoute/deleteRoute for coverage)
- packstruct-lint-shapes/hostile-manifest-fuzz: 4 hostile manifest shapes held: in-bounds verdicts, nameable refusals + norms, no crash, no deep stack (SPEC v1 section 5)
- packstruct-lint-shapes/entry-path-containment: 4 entry-escape shapes held: every escape flagged by the nameable 'entry' norm (the crashtest#16 class, closed at the wire)
- packstruct-lint-shapes/over-strict-drift-canary: minimum-spec shapes held: extra manifest keys and extra-files existing beside the entry both exit 0, zero violations (SPEC 3.4 additive-first contract)
- packstruct-lint-shapes/clean-pack-canary: clean pack canary held: conforming shape answers exit 0, zero violations - the lint never flags honest packs
- proto-hygiene/head-get-parity: 1 route(s): HEAD mirrors GET (no throws, no status drift beyond honest 405) + 1 info note(s)
- proto-hygiene/request-shape-flood: 1 route(s) x 18 bare shapes (query chaos, path shapes, header casings) all landed 4xx-or-cleaner with case-parity intact
- race/double-submit-idempotency: route "charge" not declared on this target - race skipped (declare it for coverage)
- race/concurrent-write-lost-update: route "profile" not declared on this target - race skipped (declare it for coverage)
- recursion/deep-nest-stack-overflow: route "enroll" not declared on this target - recursion skipped (declare it for coverage)
- recursion/redos-catastrophic-pattern: route "validate" not declared on this target - recursion skipped (declare it for coverage)
- session/cookie-hygiene: route "login" not declared on this target - session skipped (declare it for coverage)
- session/session-fixation: route(s) "login", "me" not declared on this target - session skipped (declare it for coverage)
- session/token-replay-deny: route "login" not declared on this target - session skipped (declare it for coverage)
- session/logout-invalidates: route(s) "login", "me", "logout" not declared on this target - session skipped (declare it for coverage)
- state/enumeration-oracle: route "device" not declared on this target - enumeration skipped (declare it for coverage)
- state/id-collision-alias: route "enroll" not declared on this target - alias check skipped
- taxonomy/abuse-not-5xx: route "enroll" not declared on this target - taxonomy skipped (declare it for coverage)
- taxonomy/errors-stay-impersonal: route "enroll" not declared on this target - taxonomy skipped (declare it for coverage)
- upload/filename-traversal-family: route "upload" not declared on this target - upload skipped (declare the upload route + its kv store for coverage)
- upload/mime-polyglot-family: route "upload" not declared on this target - upload skipped (declare the upload route + its kv store for coverage)
- volume/credential-stuffing: route "enroll" not declared on this target - stuffing skipped (declare it for coverage)
- volume/storage-fill: route "kvwrite" not declared on this target - fill check skipped (declare a KV-writing route)
- volume/cost-amplification: route "enroll" not declared on this target - amplification skipped (declare it for coverage)

### ⚡ EXPLOITED (0)

### 🔒 BOUNDED (0)

## Cost economics
- total: 31 backend ops across 55 in-process requests from 53 attacks
  - auth/identity-spoof-headers: 0 ops / 0 requests
  - auth/secret-watermark: 0 ops / 0 requests
  - auth/privilege-escalation: 0 ops / 0 requests
  - authz/method-matrix-privileged: 0 ops / 0 requests
  - authz/role-body-spoof-family: 0 ops / 0 requests
  - authz/handler-alias-confusion: 0 ops / 0 requests
  - governance/succession-trust-floor: 0 ops / 0 requests
  - governance/succession-single-heir: 0 ops / 0 requests
  - governance/succession-revocation-carry: 0 ops / 0 requests
  - governance/escrow-two-key-release: 0 ops / 0 requests
  - governance/escrow-expiry-is-fail-closed: 0 ops / 0 requests
  - governance/escrow-refusal-is-typed: 0 ops / 0 requests
  - governance/grant-conflict-deterministic: 0 ops / 0 requests
  - governance/capability-no-sideways: 0 ops / 0 requests
  - governance/lock-ttl-honesty: 0 ops / 0 requests
  - governance/lock-owner-fencing: 0 ops / 0 requests
  - guards/hygiene-no-store: 0 ops / 0 requests
  - guards/burst-wall: 0 ops / 0 requests
  - input/proto-pollution-body: 0 ops / 0 requests
  - input/never-fail-mutations: 0 ops / 0 requests
  - input/oversized-field: 0 ops / 0 requests
  - memory/drift-silent-overwrite: 0 ops / 0 requests
  - memory/drift-stale-poisons-fresh: 0 ops / 0 requests
  - memory/drift-contradiction-carry: 0 ops / 0 requests
  - memory/hallucinated-fact-probe: 0 ops / 0 requests
  - memory/citation-drift: 0 ops / 0 requests
  - memory/phantom-scope: 0 ops / 0 requests
  - memory/identity-merge-collision: 0 ops / 0 requests
  - memory/resolution-order-stability: 0 ops / 0 requests
  - memory/delete-is-loud: 0 ops / 0 requests
  - packstruct-lint-shapes/hostile-manifest-fuzz: 4 ops / 4 requests
  - packstruct-lint-shapes/entry-path-containment: 4 ops / 8 requests
  - packstruct-lint-shapes/over-strict-drift-canary: 2 ops / 10 requests
  - packstruct-lint-shapes/clean-pack-canary: 1 ops / 11 requests
  - proto-hygiene/head-get-parity: 2 ops / 2 requests
  - proto-hygiene/request-shape-flood: 18 ops / 20 requests
  - race/double-submit-idempotency: 0 ops / 0 requests
  - race/concurrent-write-lost-update: 0 ops / 0 requests
  - recursion/deep-nest-stack-overflow: 0 ops / 0 requests
  - recursion/redos-catastrophic-pattern: 0 ops / 0 requests
  - session/cookie-hygiene: 0 ops / 0 requests
  - session/session-fixation: 0 ops / 0 requests
  - session/token-replay-deny: 0 ops / 0 requests
  - session/logout-invalidates: 0 ops / 0 requests
  - state/enumeration-oracle: 0 ops / 0 requests
  - state/id-collision-alias: 0 ops / 0 requests
  - taxonomy/abuse-not-5xx: 0 ops / 0 requests
  - taxonomy/errors-stay-impersonal: 0 ops / 0 requests
  - upload/filename-traversal-family: 0 ops / 0 requests
  - upload/mime-polyglot-family: 0 ops / 0 requests
  - volume/credential-stuffing: 0 ops / 0 requests
  - volume/storage-fill: 0 ops / 0 requests
  - volume/cost-amplification: 0 ops / 0 requests

## Baseline diff
- NEW: none / REGRESSED: none
