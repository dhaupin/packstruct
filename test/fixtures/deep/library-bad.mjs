// Host-library fixture (colliding): module name AND attack name both also
// claimed by demo-scenario - two id-library-collision rows expected.
export default {
  name: 'input-probe',
  description: 'Library fixture, colliding with demo-scenario.',
  attacks: [
    { name: 'noop-attack', run: async () => ({}) },
  ],
}
