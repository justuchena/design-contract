# Changelog

## 0.1.0 — 2026-10-14

First release.

### The method

- `method/DESIGN-TEMPLATE.md` — a design doc template built on one idea:
  every section records a decision, not a description.
- `method/references.md` — the structure-vs-device distinction. Borrow how a
  page is ordered; never transplant the marker highlight, the cream ground or
  the dark closing slab.
- `method/voice.md` — two standing copy rules: no em dashes anywhere a
  visitor can read, and one deliberately chosen register.

### The checker

- `enforce/design-check.mjs` — eleven configurable rule kinds: retired hues
  by name and by hex, arbitrary colour classes, flat bans, element-scoped
  bans, measured contrast floors, the type ramp, the icon scale, the disabled
  pair, copy bans, and one-declaration-per-token.
- Comments are stripped before every rule runs, with byte offsets preserved
  so line numbers stay correct, and string literals skipped so
  `accept="image/*"` cannot open a comment that swallows the file.
- Element-scoped rules read one open tag, brace-aware, so a rule can say
  "a card may be pure white, a section plate may not".
- Composition is deliberately not checked.
- `enforce/test.mjs` — 23 assertions against `enforce/fixture/`, including
  six negative cases.

### Measurement

- `pipeline/contrast.mjs` — every foreground against every ground it is
  *for*, and a named report of the conditional cases: a colour that clears
  its floor on one ground and misses it on another. That case cannot be a
  ban, so the tool prints it and the design doc holds the condition.
- `pipeline/derive.mjs` — `tokens.css` to Design Tokens Format JSON, with
  `--check` to fail a build when the mirror is stale. Reads only the base
  `:root` block; a `.dark` block is a theme override, not a source.
- `pipeline/shots.mjs` — screenshots at several widths, narrow first. Waits
  on a real selector rather than a sleep, waits on `document.fonts.ready`,
  and reports page errors because a blank screenshot is the same file size as
  a working one.

### References

- `refs/` — 152 design-system packages from
  [`nexu-io/open-design`](https://github.com/nexu-io/open-design)
  (Apache-2.0), redistributed unmodified. See `NOTICE` for the full
  attribution chain and statement of changes.
- `refs/INDEX.md` rewritten: what these are and are not, and a map by the
  problem you have rather than the brand you like.

### Other

- `examples/meridian/` — a complete filled-in design doc for an invented
  product, with really measured contrast ratios.
- `resources/README.md` — icons, typefaces, illustration, colour tooling and
  galleries, with the licence noted per entry. Links rather than vendored
  files, so no licence has to be re-verified on your behalf.
- `SKILL.md` — agent skill entry point, at the repo root so a skill loader
  finds it.
- Inter and Outfit vendored as subset woff2, both SIL OFL 1.1.
