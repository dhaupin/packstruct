// Host-library fixture (clean): ids distinct from demo-scenario's
// (input-probe / noop-attack / noisy-chain / warm-up / strike).
export default {
  name: 'free-name',
  description: 'Library fixture, no pack collisions.',
  attacks: [
    { name: 'unused-attack', run: async () => ({}) },
  ],
}
