// Cross-pack collision, second claimant: same module name AND attack id as
// module-dup-a.
export default {
  name: 'shared-module',
  description: 'Cross-pack collision fixture (claim B).',
  attacks: [
    { name: 'shared-attack', run: async () => ({}) },
  ],
}
