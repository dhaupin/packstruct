/**
 * ssr.config.js - packstruct site identity + route map.
 * Fills the prestruct engine (inject-brand + prerender, via `prestruct build`)
 * with the site's SEO tags and route list.
 */
export default {
  siteUrl:  'https://packstruct.creadev.org',
  siteName: 'Packstruct',
  breadcrumb: true,
  author:   'dhaupin',
  tagline:  'One /packs system, many hosts.',
  ogImage:  {
    url: 'https://packstruct.creadev.org/og-image.png',
    width: 1200,
    height: 630,
    alt: 'packstruct - the shared /packs spec',
    type: 'image/png',
  },
  keywords: 'packstruct, packs spec, pack.json, manifest validation, linter, conformance, crashtest packs, poststruct packs, schemaVersion 1',

  routes: [
    {
      path: '/',
      priority: '1.0',
      changefreq: 'monthly',
      meta: {
        title: 'Packstruct - one /packs spec, many hosts',
        description: 'The shared packs spec: one manifest, entry, and lifecycle contract for a packs/ directory, plus a zero-dependency lint CLI that refuses broken manifests.',
      },
    },
    {
      path: '/why',
      priority: '0.6',
      changefreq: 'monthly',
      meta: {
        title: 'Why | Packstruct',
        description: 'Many hosts, one pack grammar: why a shared /packs spec exists, so an author writes one pack and knows how packs work everywhere.',
      },
    },
    {
      path: '/what',
      priority: '0.6',
      changefreq: 'monthly',
      meta: {
        title: 'What | Packstruct',
        description: 'One normative spec plus a zero-dependency lint CLI: the pack.json v1 manifest, the scenario and check profiles, and a conformance harness.',
      },
    },
    {
      path: '/about',
      priority: '0.5',
      changefreq: 'monthly',
      meta: {
        title: 'About | Packstruct',
        description: 'Who builds packstruct, the struct family it anchors, the spec-frozen-at-v1 governance, and the MIT license and provenance terms.',
      },
    },
    {
      path: '/packs',
      priority: '0.7',
      changefreq: 'weekly',
      meta: {
        title: 'Packs | Packstruct',
        description: 'The live pack catalog: the packstruct-lint-shapes dogfood pack and the nine hosts that load the spec, every count a receipt from its own tree.',
      },
    },
    {
      path: '/spec',
      priority: '0.9',
      changefreq: 'monthly',
      meta: {
        title: 'The spec | Packstruct',
        description: 'The frozen v1 surface: packs/public/<name>/ with pack.json (schemaVersion 1, name matches dir, entry exists) plus the scenario/check profiles.',
      },
    },
    {
      path: '/lint',
      priority: '0.8',
      changefreq: 'monthly',
      meta: {
        title: 'Lint CLI | Packstruct',
        description: 'npx packstruct lint packs/ - zero dependencies, kills the manifest-points-at-missing-entry class at author time, in any repo. Try it in the browser.',
      },
    },
    {
      path: '/showcase',
      priority: '0.8',
      changefreq: 'weekly',
      meta: {
        title: 'Showcase | Packstruct',
        description: 'The hosts that speak the packstruct grammar: crashtest, vant, gistory, prestruct, poststruct, govstruct, eyestruct, monoforge - counts from each tree.',
      },
    },
    {
      path: '/start',
      priority: '0.9',
      changefreq: 'monthly',
      meta: {
        title: 'Start here | Packstruct',
        description: 'New to packstruct? In five minutes: what a pack is, the one command that checks it, and how to write your first pack.json - no prior knowledge needed.',
      },
    },
    {
      path: '/extend',
      priority: '0.8',
      changefreq: 'monthly',
      meta: {
        title: 'Extend | Packstruct',
        description: 'For builders: write a pack a host will run, point a host at your own packs, add a new host profile, and prove it with --deep lint and the conformance harness.',
      },
    },
    {
      path: '/enterprise',
      priority: '0.8',
      changefreq: 'monthly',
      meta: {
        title: 'Fleet & enterprise | Packstruct',
        description: 'One grammar across many repos: exact-pin companion receipts, conformance as a CI gate, governance as portable packs, and open-source adoption - all MIT.',
      },
    },
    {
      path: '/status',
      priority: '0.5',
      changefreq: 'weekly',
      meta: {
        title: 'Family status | Packstruct',
        description: 'The family-status@1 dialect: every struct-family member serves its committed-ledger verdicts at /status.json, generated on every web build.',
      },
    },
    {
      path: '/terms',
      priority: '0.3',
      changefreq: 'yearly',
      meta: {
        title: 'Terms of Use | Packstruct',
        description: 'Plain terms: the spec, linter, and docs ship as is under MIT; you run the linter on your own repos and own the decisions it gates.',
      },
    },
    {
      path: '/privacy',
      priority: '0.3',
      changefreq: 'yearly',
      meta: {
        title: 'Privacy | Packstruct',
        description: 'The site ships no analytics, no cookies, no trackers. The CLI reads only the paths you hand it and writes nothing outside its process.',
      },
    },
  ],

  buildJsonLd() {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: 'Packstruct',
      url: 'https://packstruct.creadev.org',
      description: 'The shared /packs spec: one manifest, entry, and lifecycle contract for pack directories, plus a zero-dependency lint CLI.',
      author: { '@type': 'Person', name: 'dhaupin', url: 'https://github.com/dhaupin' },
      codeRepository: 'https://github.com/dhaupin/packstruct',
      license: 'https://opensource.org/licenses/MIT',
      programmingLanguage: 'JavaScript',
    };
  },

  notFound: {
    heading: 'Route not on the manifest',
    body: "Like a pack outside the host's config queue, this URL never runs.",
    primaryCta: { label: 'Back to the spec', href: '/' },
  },
};
