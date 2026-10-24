// test/fixtures/audit/loader-silent-refuser.mjs - the SILENT REFUSER test
// loader as a real file: refuses (exit 1) but never names the pack, so every
// refuse-case must fail the audit on the SPEC section 5 nameable norm.
process.exit(1)
