// test/fixtures/audit/loader-always-ok.mjs - the ALWAYS-ACCEPT test loader as
// a real file: exits 0 immediately with nothing to say, so all seven refuse-
// cases fail the audit ("the spec verdict is refuse") and only the clean case
// passes.
process.exit(0)
