#!/usr/bin/env node
/**
 * Docs link checker (ported from dhaupin/vant scripts/check-docs-links.js).
 * Validates every markdown link in docs/:
 *   - /packstruct/<permalink> links must match a real frontmatter permalink
 *   - other absolute links must match a permalink or resolve under docs/
 *   - page-relative links are refused by name: they resolve against the SERVED
 *     page URL, so on a no-trailing-slash permalink page '../x'/'./x' lands one
 *     level off and 404s (internal links are root-absolute /packstruct/...)
 * Skips code fences, inline code, external URLs, and pure anchors.
 * Exit 1 on any broken link.
 */
const fs = require('fs');
const path = require('path');
const DOCS = path.resolve(__dirname, '..', 'docs');
const SITE_PREFIX = '/packstruct'; // the docs baseurl - mirror docs/_config.yml

// normalize: leading slash, no trailing slash ('' -> '/')
const norm = (s) => {
    s = '/' + String(s).replace(/^\/+|\/+$/g, '');
    return s === '/' ? '/' : s;
};

const files = [];
(function walk(d) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
        const p = d + '/' + f.name;
        if (f.isDirectory() && f.name !== '_data' && f.name !== '_layouts' && f.name !== '_plugins') walk(p);
        else if (f.name.endsWith('.md')) files.push(p);
    }
})(DOCS);

const perm = new Set();
for (const f of files) {
    const t = fs.readFileSync(f, 'utf8');
    const m = t.match(/^permalink: (\S+)/m);
    if (m) perm.add(norm(m[1]));
}

let broken = 0;
for (const f of files) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    let inFence = false;
    for (const line of lines) {
        if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
        if (inFence) continue;
        const parts = line.split('`');
        for (let s = 0; s < parts.length; s += 2) { // outside inline code only
            for (const m of parts[s].matchAll(/\]\(([^)\s]+)\)/g)) {
                let u = m[1];
                if (/^(https?:|mailto:)/.test(u)) continue;
                const anchor = u.includes('#') ? u.slice(u.indexOf('#')) : '';
                u = anchor ? u.slice(0, u.length - anchor.length) : u;
                if (!u) continue; // pure anchor
                const rel = f.replace(DOCS + '/', '');
                if (u.startsWith(SITE_PREFIX + '/') || u === SITE_PREFIX) {
                    const key = norm(u.replace(/^\/packstruct\/?/, ''));
                    if (!perm.has(key)) {
                        console.log('BROKEN (bad ' + SITE_PREFIX + '/ permalink) in', rel, '->', m[1]);
                        broken++;
                    }
                    continue;
                }
                if (u.startsWith('/')) {
                    const key = norm(u);
                    if (!perm.has(key) && !fs.existsSync(path.join(DOCS, u))) {
                        console.log('BROKEN (abs) in', rel, '->', m[1]);
                        broken++;
                    }
                    continue;
                }
                // A page-relative link resolves against the SERVED page URL, not
                // the source tree: on a no-trailing-slash permalink page the
                // browser reads /packstruct/foo as a file, so '../x'/'./x' lands
                // one level off and 404s. Internal links are root-absolute.
                console.log('BROKEN (relative - use a root-absolute /packstruct link) in', rel, '->', m[1]);
                broken++;
            }
        }
    }
}

console.log(broken === 0
    ? 'DOCS LINKS: PASS (' + files.length + ' files)'
    : 'DOCS LINKS: FAIL (' + broken + ' broken)');
process.exit(broken === 0 ? 0 : 1);
