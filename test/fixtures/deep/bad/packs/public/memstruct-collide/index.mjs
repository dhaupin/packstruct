// Memory-profile census fixture (claim B). Claims `shared-record.md`, the
// same record id memstruct-dup claims - a cross-pack collision in the host
// id space (SPEC section 4 namespaced-ids norm).
export default {
  records: [
    { id: 'shared-record.md', createdAt: 1, body: 'claimed by memstruct-dup too' },
  ],
}
