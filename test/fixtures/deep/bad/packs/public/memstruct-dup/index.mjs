// Memory-profile census fixture (claim A). The default export carries a
// `records` array (memstruct@1 - profiles/memory.md), whose record ids are
// declared ids exactly like a scenario's attack ids. This pack has a
// within-pack duplicate (`dup-record.md` twice) AND claims a record id its
// sibling memstruct-collide also claims (cross-pack collision).
//
// DISCRIMINATING: before the fix the --deep census only walked
// attacks/checks/scenarios, so this pack's record ids were invisible - no
// id-duplicate, no id-collision, a vacuous green. After the fix both fire.
export default {
  records: [
    { id: 'dup-record.md', createdAt: 1, body: 'first' },
    { id: 'dup-record.md', createdAt: 2, body: 'second' }, // id-duplicate within the pack
    { id: 'shared-record.md', createdAt: 3, body: 'claimed by memstruct-collide too' },
  ],
}
