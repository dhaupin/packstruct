// Cross-pack collision, first claimant: module name 'shared-module' plus
// attack id 'shared-attack' also claimed by module-dup-b (SPEC section 4
// namespaced-ids norm; the engine's seen map refuses at load).
export default {
  name: 'shared-module',
  description: 'Cross-pack collision fixture (claim A) + a within-pack duplicate.',
  attacks: [
    { name: 'shared-attack', run: async () => ({}) },
    { name: 'shared-attack', run: async () => ({}) }, // id-duplicate within the pack
  ],
}
