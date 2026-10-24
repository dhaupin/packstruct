/**
 * ssr.config.js - packstruct site identity + route map.
 * Fills the prestruct engine (inject-brand + prerender, via `prestruct build`)
 * with the site's SEO tags and route list.
 */
export default {
  siteUrl:  'https://packstruct.creadev.org',
  siteName: 'Packstruct',
  author:   'dhaupin',
  tagline:  'One /packs system, many hosts.',
  ogImage:  'https://packstruct.creadev.org/og-image.png',
  keywords: 'packstruct, packs spec, pack.json, manifest validation, linter, conformance, crashtest packs, poststruct packs, schemaVersion 1',

  routes: [
    {
      path: '/',
      priority: '1.0',
      changefreq: 'monthly',
      meta: {
        title: 'Packstruct - one /packs spec, many hosts',
        description: 'The shared packs spec for the struct family: one manifest, entry, and lifecycle contract for crashtest and poststruct packs, plus a zero-dependency lint CLI that refuses broken manifests at author time.',
      },
    },
    {
      path: '/spec',
      priority: '0.9',
      changefreq: 'monthly',
      meta: {
        title: 'The spec | Packstruct',
        description: 'The frozen v1 surface: packs/public/<name>/ with pack.json (schemaVersion 1, name matches directory, entry exists, armedByKey optional) plus the declarable scenario/check profiles.',
      },
    },
    {
      path: '/lint',
      priority: '0.8',
      changefreq: 'monthly',
      meta: {
        title: 'Lint CLI | Packstruct',
        description: 'npx packstruct lint packs/ - zero dependencies, kills the manifest-points-at-missing-entry class (crashtest#16) at author time, in any fleet repo. Try it in the browser right here.',
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
