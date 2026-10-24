// test/fixtures/audit/loader-accept-all.mjs - the OUTPUT-FLOOD test loader as
// a real file: no verdict is ever written, and stdout hammers past the 1MB
// audit cap forever. The audit must kill it at the cap and mark every case
// audit-buffer-capped, not grade it as an acceptance.
for (;;) console.log('x'.repeat(8192))
