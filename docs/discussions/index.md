---
title: "Release posts"
description: "The release-post conventions: one announcing-vX.Y.Z.md per release, the file IS the Discussions announcement, drafted against the released npm version, gated like every docs page."
author: "Creadev.org"
lang: "en"
date: 2026-10-24
last_modified_at: 2026-10-24
nav_order: 7
layout: default
version: 0.9.0
permalink: /discussions
---

# Release posts

One post per release, shaped like prestruct's and crashtest's posts - the
format lineage is
[prestruct's announcing-v1.0.0](https://github.com/dhaupin/prestruct/blob/main/docs/discussions/announcing-v1.0.0.md)
and [crashtest's adopting batch](https://github.com/dhaupin/crashtest/blob/main/docs/discussions/index.md).
The post lives in `docs/discussions/` as versioned source so the release
trail sits in the same tree as the changelog it summarizes, and the file's
raw markdown IS the GitHub Discussions announcement - view source, copy,
strip the frontmatter, post.

## The conventions

- **One file per release, named after it.** `announcing-vX.Y.Z.md`, matching
  the npm version on the day the post is drafted. Never reuse a filename; a
  retried release folds its delta into the same post.
- **Frontmatter.** The four fields every docs page gates on
  (`permalink`, `layout`, `title`, `description`) plus `version`. For this
  repo the permalink is `/discussions/announcing-vX.Y.Z` (the docs site
  prefixes `/packstruct`).
- **The file IS the post.** No wrapper prose, no nested copy block: below
  the frontmatter the file carries the announcement body itself. To
  publish, copy the raw markdown into the Discussions announcement,
  stripping only the frontmatter lines.
- **Voice and facts.** Same rules as the rest of the docs: dry hyphen
  voice, no marketing language, every number verified against the CLI,
  a committed receipt, or the npm registry before it lands. If you cannot
  run it, do not write it.
- **Timing.** Draft the post against the released version, not the dev
  tree: cite what shipped in the npm tarball and keep in-tree-only work out
  of it. A post describing a version that is not on npm yet is fiction by
  promotion.
- **Gates.** The docs gates run on these files like everything else -
  frontmatter completeness, fence language tags, the language gate.

## The index

| post | version | live |
|---|---|---|
| [Announcing packstruct v0.9.0](/discussions/announcing-v0.9.0) | 0.9.0 | 2026-10-24 on npm |
