// check-legal.cjs - Terms/Privacy stay in lockstep with the family canonical
// form (packstruct#34). The canon: an eyebrow line, a dated "Web version
// YYYY-MM-DD" line, exactly one non-empty h1, and the named section set the
// family ships (crashtest reference; poststruct landed it 2026-10-27). The
// legal pages are JSX, so this is a source-level shape check: it refuses a
// missing h1, a missing/undated version line, or a section heading the canon
// requires, with file:line where it can.
//
// No dependencies: reads the two files, matches the canonical shapes.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PAGES = [
  {
    file: path.join(ROOT, 'web/src/pages/Terms.jsx'),
    name: 'Terms',
    eyebrow: /className="eyebrow"/,
    // The canon sections for the terms page.
    sections: ['Use of the site and tool', 'What you own', 'Fair use of the site', 'Changes'],
  },
  {
    file: path.join(ROOT, 'web/src/pages/Privacy.jsx'),
    name: 'Privacy',
    eyebrow: /className="eyebrow"/,
    sections: ['Third parties, named', 'Data retention', 'Questions'],
  },
];

const problems = [];

for (const page of PAGES) {
  if (!fs.existsSync(page.file)) {
    problems.push(`${page.file}: missing (the family ships both legal pages)`);
    continue;
  }
  const src = fs.readFileSync(page.file, 'utf8');

  // Exactly one non-empty h1 (the canon counts a first-match head audit).
  const h1s = src.match(/<h1>[^<]+<\/h1>/g) || [];
  if (h1s.length !== 1) {
    problems.push(`${page.name}: expected exactly one non-empty <h1>, found ${h1s.length}`);
  }

  // The eyebrow line (plain language, no theater).
  if (!page.eyebrow.test(src)) {
    problems.push(`${page.name}: missing the canonical eyebrow line (className="eyebrow")`);
  }

  // The dated web-version line, long form pointed at the repo.
  const version = src.match(/Web version (\d{4}-\d{2}-\d{2})/);
  if (!version) {
    problems.push(`${page.name}: missing a dated "Web version YYYY-MM-DD" line`);
  }
  if (!/github\.com\/dhaupin\/packstruct/.test(src)) {
    problems.push(`${page.name}: the version line must point the long form at the repo`);
  }

  // The canon section headings.
  for (const heading of page.sections) {
    if (!src.includes(`>${heading}<`)) {
      problems.push(`${page.name}: missing canon section "${heading}"`);
    }
  }
}

if (problems.length > 0) {
  console.error(`LEGAL PAGES: FAIL (${problems.length} drift(s) from the family canon)`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('LEGAL PAGES: PASS (Terms + Privacy hold the family canon: eyebrow, dated version, one h1, canon sections)');
