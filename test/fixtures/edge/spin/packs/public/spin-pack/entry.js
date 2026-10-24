// Spin fixture: top-level infinite loop. Under the child-probe isolation the
// linter kills this at the probe timeout (tests override it short); an
// in-process prober would hang the whole CLI forever.
for (;;) {}
export default { name: 'spin-pack' }
