# The check profile

Declared per SPEC v1 section 3 (normative) and filed here once, per the
one-address ruling on [crashtest#19](https://github.com/dhaupin/crashtest).

This is the profile [poststruct](https://github.com/dhaupin/poststruct) will
load. Note the honest status line: poststruct is not shipping yet, so this
page declares the shape the spec froze - the engine-first rule (code first,
spec formalizes after) means any poststruct loader change that contradicts
this page updates the SPEC first, then here.

## The module shape

An entry module under this profile is an ES module with a default export
carrying a `checks` array:

```js
export default {
  checks: [
    // Declarative, pure-reading verifiers over files on disk.
    // Each Check carries (at minimum) a kebab-case id and a read-only
    // predicate the host runs over its target tree.
  ],
}
```

## What the spec guarantees

- **No transport, no network by default.** A check pack reads the files the
  host points it at. That whole boundary is the profile's point: check packs
  prove claims about files; scenario packs attack systems.
- **Config-is-the-arm.** There is no arming key ceremony in this profile:
  being enumerated in the host's `packs:` config IS the arm (SPEC section 3).
  A `pack.json` may still carry `armedByKey` - the shared manifest surface
  never forks between profiles - and the poststruct loader will simply not
  give it a ceremony: its presence is optional surface, its semantics here
  are the host's default lifecycle (config enumeration).
- **Namespaced ids.** Check ids live in the pack-slug namespace inside the
  host's id space; cross-namespace collision at load = refuse to start
  (SPEC section 4).
- **Refusals** are instant, one-line, and name the pack (SPEC section 5).

## Boundary charter

The load-time boundary between the struct apps is on record:
[poststruct#2](https://github.com/dhaupin/poststruct/issues/2) - the
manifest shape validates ONCE (this spec, section 2), packstruct owns the
pack shape, poststruct owns the text shape. A conformance story for a check
pack is: packstruct lint says the manifest is v1; the poststruct loader
says the checks are check-shaped; neither pretends to speak for the other.
