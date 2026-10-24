// Mass-probe hazard fixture: run ONLY inside the deep probe's disposable
// child. Transfers control to the host process via top-level exit - exactly
// the class the child-isolation fix kills.
process.exit(7)
export default { name: 'exit-pack' }
