// Deep-mode pass fixture module: the shape crashtest's scenario contract
// uses (module object with name/description/attacks[]) - data only, no
// side effects, so importing it in deep mode is inert.
export default {
  name: 'input-probe',
  description: 'Deep pass fixture module (data only).',
  attacks: [
    {
      name: 'noop-attack',
      run: async () => ({ verdict: 'REFUSED', detail: 'fixture', attack: 'noop-attack' }),
    },
    {
      name: 'noisy-chain',
      steps: [
        { name: 'warm-up', fn: async () => ({}) },
        { name: 'strike', fn: async () => ({}) },
      ],
    },
  ],
}
