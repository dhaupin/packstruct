/**
 * src/hosts.js
 * ============
 * THE pure-data registry of everything that speaks the packstruct grammar.
 *
 * Same shape law as vant's showcase.mjs: no JSX, no imports, so vite
 * prerenders it, the browser bundles it, and the pages read it directly.
 * The Home, Packs, and Showcase pages all render from THIS one list, so a
 * new host or a pack-count change lands in one place and cannot drift
 * between pages.
 *
 * Every number here is a RECEIPT, not a guess: it was produced by running
 * the repo's own `packstruct lint <repo>/packs --deep` over the live tree,
 * and every pin was read from that repo's package.json. Re-cut this file
 * against the fleet, never from memory (house rule 3: receipts, not
 * invention).
 *
 * Host row shape:
 *   id        stable slug
 *   name      display name
 *   profile   the entry profile it loads: 'scenario' | 'check' | 'memory' | 'sync' | 'dogfood'
 *   packs     number of packs under its packs/public/ (lint-confirmed)
 *   ids       declared ids censused by lint --deep (0 = shape packs, no ids)
 *   pin       the packstruct version it carries (package.json devDependency)
 *   blurb     one-line: what it loads packs FOR
 *   repo      the GitHub repo
 *   site      the live site (https), when one exists
 */

// The entry profiles, declared once. A host picks one; the manifest
// never forks. See spec/SPEC.md section 3.
export const PROFILES = {
  scenario: {
    label: 'scenario',
    host: 'crashtest',
    what: 'A module that returns attack verdicts - hostile scenarios driven against a transport, isolated, with the armed-key ceremony available.',
  },
  check: {
    label: 'check',
    host: 'poststruct',
    what: 'A module that returns pass/fail findings - declarative, pure-reading verifiers over files on disk. No transport, no network by default.',
  },
  memory: {
    label: 'memory',
    host: 'vant',
    what: 'A module that carries a durable memory store - records under the host-owned memstruct grammar (vant\'s markdown brain). Declared; the memory tier.',
  },
  sync: {
    label: 'sync',
    host: 'gistory',
    what: 'A module that reconciles two memory stores - a pure merge under the host-owned memstruct contract (gistory\'s merge). Declared; the replicated tier.',
  },
}

// The live hosts: every repo that ships a packs/ directory the linter
// approves. Counts and pins are the receipts above.
export const HOSTS = [
  {
    id: 'crashtest',
    name: 'crashtest',
    profile: 'scenario',
    packs: 9,
    ids: 47,
    pin: '1.1.0',
    blurb: 'Adversarial QA for agent-built apps: seeded, in-process attacks against real handlers, graded into a hardening ledger CI fails on.',
    repo: 'https://github.com/dhaupin/crashtest',
    site: 'https://crashtest.creadev.org',
  },
  {
    id: 'poststruct',
    name: 'poststruct',
    profile: 'check',
    packs: 12,
    ids: 0,
    pin: '1.1.0',
    blurb: 'Audit what shipped: walks baked HTML and verifies head, links, and site hygiene against a contract, one check pack per SSG shape.',
    repo: 'https://github.com/dhaupin/poststruct',
    site: 'https://poststruct.creadev.org',
  },
  {
    id: 'govstruct',
    name: 'govstruct',
    profile: 'check',
    packs: 14,
    ids: 42,
    pin: '1.1.0',
    blurb: 'The controller layer for a family of repos: its compliance rules ARE check packs, so governance is a portable /packs surface.',
    repo: 'https://github.com/dhaupin/govstruct',
    site: 'https://govstruct.creadev.org',
  },
  {
    id: 'eyestruct',
    name: 'eyestruct',
    profile: 'check',
    packs: 6,
    ids: 0,
    pin: '1.1.0',
    blurb: 'Eyes for production agents: deterministic look / look-diff with a committed visual memory, its capture and canon lanes riding as check packs.',
    repo: 'https://github.com/dhaupin/eyestruct',
    site: 'https://eyestruct.creadev.org',
  },
  {
    id: 'vant',
    name: 'vant',
    profile: 'scenario',
    packs: 24,
    ids: 290,
    pin: '1.1.0',
    blurb: 'The agent OS: 24 attack packs that measure its own defenses (kernel, mcp, relay, brain, walls) against the surfaces it promises.',
    repo: 'https://github.com/dhaupin/vant',
    site: 'https://vant.creadev.org',
  },
  {
    id: 'gistory',
    name: 'gistory',
    profile: 'scenario',
    packs: 1,
    ids: 15,
    pin: '1.1.0',
    blurb: 'E2EE multi-device sync: one chain-relay dialect pack attacks its push/pull sync surface in-process, no sockets.',
    repo: 'https://github.com/dhaupin/gistory',
    site: 'https://gistory.creadev.org',
  },
  {
    id: 'monoforge',
    name: 'monoforge',
    profile: 'check',
    packs: 1,
    ids: 6,
    pin: '1.1.0',
    blurb: 'The fleet factory: forge-shapes verifies a stamped tree ships its receipt, resolves every path, and holds the truth-slot law.',
    repo: 'https://github.com/dhaupin/monoforge',
    site: 'https://monoforge.creadev.org',
  },
  {
    id: 'prestruct',
    name: 'prestruct',
    profile: 'scenario',
    packs: 1,
    ids: 6,
    pin: '1.1.0',
    blurb: 'AI-first SEO prerender: prestruct-proxy attacks its own HTTP render proxy pair (VPS + Worker) over the real wire.',
    repo: 'https://github.com/dhaupin/prestruct',
    site: 'https://prestruct.creadev.org',
  },
]

// packstruct's own dogfood pack: it attacks the linter itself.
export const DOGFOOD = {
  id: 'packstruct',
  name: 'packstruct',
  profile: 'scenario',
  packs: 1,
  ids: 5,
  pin: '1.1.0',
  blurb: 'The spec attacks itself: four hostile-manifest campaigns drive the real lint CLI and grade it against SPEC v1 section 5.',
  repo: 'https://github.com/dhaupin/packstruct',
  site: 'https://packstruct.creadev.org',
}

// The rest of the struct family: the engines and rigs that compose with the
// spec without loading a /packs directory themselves. Crosslinks, so a
// visitor can walk the whole family from here.
export const FAMILY = [
  {
    id: 'freestruct',
    name: 'freestruct',
    role: 'engine',
    blurb: 'Post-build SEO layer for static doc sites: it runs after any SSG and injects the head the docs need.',
    repo: 'https://github.com/dhaupin/freestruct',
  },
  {
    id: 'coreforge',
    name: 'coreforge',
    role: 'rig',
    blurb: 'The shell the family ships sites from: landing + docs rig + CI/release plumbing, brand as data.',
    repo: 'https://github.com/dhaupin/coreforge',
  },
  {
    id: 'railyard',
    name: 'railyard',
    role: 'composer',
    blurb: 'The forge yard: the parent service that routes the forges and holds the mounts registry.',
    repo: 'https://github.com/dhaupin/railyard',
  },
]

// The headline counts, derived here so every page quotes the same number.
// packstruct is its own host too (the dogfood pack), so the host count
// includes it: nine repos ship a packs/ directory today.
export const TOTAL_HOSTS = HOSTS.length + 1
export const TOTAL_PACKS = HOSTS.reduce((n, h) => n + h.packs, 0) + DOGFOOD.packs

/** The hosts that load a given profile, in registry order. */
export function hostsByProfile(profile) {
  return HOSTS.filter((h) => h.profile === profile)
}
