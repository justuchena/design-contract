# Changelog

## 0.2.1 — 2026-10-15

What a run cannot tell you, and the package becoming installable.

All three of these came out of pointing v0.2.0 at a 2,082-file application
and fixing every one of the 63 things it found. Four of those were the
checker's fault rather than the codebase's, and that is what is fixed here.

### The report says what it did not check

- **`cannot tell: …`**, under each rule's findings. Three rules reported a
  decision rather than drift on that tree: a pane correctly drawn as a flat
  outlined region, a box-shadow drawing a crop scrim rather than an
  elevation, and six deliberate raw images, three already carrying a comment
  arguing the case. Each finding printed the sentence that justified the rule
  and nothing about what the rule could not see — so the reader either edits
  correct code or stops trusting the run, and both are worse than the rule
  not existing. Every rule now ships a blind-spot sentence, and `limits` on
  any config entry overrides or adds one.
- **`off: …`**, on the passing line. A rule that is off has verified nothing,
  and a green run that does not say so lets a config with one rule enabled
  read exactly like one with nineteen. The same error as a skipped test lane
  reported as a pass.
- **The rule count is derived from a registry in the engine**, and the test
  asserts that the number printed in `README.md` and `SKILL.md` matches it.
  It was wrong already: both said twenty where the engine has nineteen. A
  hand-maintained list of what the checker holds rots exactly the way a
  hand-maintained design rule does, which is not a thing this repo should
  demonstrate inside the file meant to solve it.

### Installable

- **`refs/` is out of the npm `files` array.** The tarball was 32.3 MB and
  4,080 files, because 152 reference packages were being shipped to anyone
  who wanted to run one dependency-free script. Nobody can take that as a
  devDependency, and on the real application above it had to be vendored
  instead. Now 445 kB and 39 files. The refs are still in the repo and still
  in a plugin install, because that path is a clone.

## 0.2.0 — 2026-10-14

The interaction half, and the states.

Auditing this pack against the project it was extracted from found that the
published checker shipped ten of the fifteen rules that project actually
runs, and that the five missing families were the generic ones: focus,
pointer targets, labels. The README claimed the checker held "the rules a
machine can hold" while a machine was holding half again as many elsewhere.
That gap is closed here.

### The checker — ten new rules, twenty in total

Every one of these was a rule a design document already claimed and nothing
ran.

- `focus` — an indicator suppressed with nothing put back. Reads the whole
  class expression and stands down when a substitute answers focus, because
  suppressing the outline and replacing it is a decision rather than a
  leftover. `focus-visible:` is in the pattern: checking `focus:` alone let
  through the one variant that removes the ring on precisely the interaction
  it exists for.
- `radius` — an arbitrary radius, plus optional two-tier rules where padding
  rather than the element decides whether something is a card or a control.
- `a11y` — a pointer target under 24px (WCAG 2.2 §2.5.8), computed from the
  padding map and the glyph size, and an icon-only control with no accessible
  name. An explicit height stands the rule down.
- `reveal` — an affordance that answers hover and not focus, which leaves a
  keyboard on an invisible control. `pointer-events-none` is exempt.
- `motion` — an animation no `prefers-reduced-motion` rule covers.
  `motion-safe:` is accepted as the stronger guard, since it never starts.
- `field` — a placeholder used as a label (WCAG 2.2 §3.3.2), a native date
  picker showing the OS locale rather than the app's, and the field radius.
- `media` — a raw `<img>`, which renders the browser's broken glyph on a dead
  URL and so reads as the product being broken.
- `surface` — a hand-rolled shell where the doc specifies a component. The
  commonest form of locally plausible and globally incoherent there is.
- `layout` — a `flex-1` scroller with no `min-h-0`, which does not shrink
  below its content, grows past its frame, and gives an `h-full` child a
  second scrollbar inside the first.
- `ink-as-fill` — a token meant for type, border and ring used as a ground
  under text. Invisible in one theme and unreadable in the other, so every
  screenshot looks fine.

- Two new machinery pieces behind them: whole-class-expression matching, and
  an ancestor walk. The second earned its place by correcting a rule that
  reported thirteen correctly labelled fields as nameless, because their
  label was a wrapper taking a `label` prop. The test is the prop, not the
  element.
- The fixture is now two components and 27 findings across 5 files, laid out
  in pairs: positive case, then the deliberate pattern beside it. Every one
  of those negative cases was reported by an early version of the rule it
  sits next to, and `enforce/test.mjs` asserts all of them.

### Fixed

- **The report printed one argument over findings it did not justify.** A
  rule name can carry several `why` sentences — a `layout` group holding both
  the side-stripe ban and the flex-shrink fault is the normal case — and the
  reporter printed only the first. Findings are now grouped by rule and then
  by argument, each above its own lines. This repo's whole claim is that
  every rule is traceable to the sentence that earned it, so this was the one
  thing the report could not be allowed to do.
- The passing line names the rules that were actually held, derived from the
  config, rather than a hardcoded list. A green run that does not name its
  rules is indistinguishable from a green run whose rules all silently
  stopped firing.
- The worked example's new quick-reference block carried invented hex values
  and a contrast ratio that did not match `palette.json`. Corrected against
  the source, which is the drift this repo exists to catch, found in its own
  example.

### The method

- `method/states.md` — new, and the dimension the pack was silent on: not
  whether a surface looks designed, but whether it is honest. The four
  branches every reading surface has, the invariant that keeps them apart
  (**branch on `ready`, not on `not failed`**), destructive-action guards,
  and the finding behind all of it: a read that failed rendering the
  surface's empty state, which is a wrong branch rather than a missing one,
  stated in the voice the product reserves for true things.
- `method/DESIGN-TEMPLATE.md` gains five sections: **States**,
  **Breakpoints** (including the behavioural break, and why a pointer is not
  a width), **Traps** (the things that look right and are not), a
  **Verification** command block, and **The agent quick reference** — a
  compressed block with the rule that makes it safe: *if this block and the
  body disagree, the body wins.* Spacing now asks for a measured census
  rather than a declared scale.
- `method/references.md` gains the positive thesis it was missing. The pack
  said what not to lift and never said what to make instead: pages feel
  designed because they ship **authored artwork and texture** — icons
  somebody drew, arrows somebody sketched, backgrounds somebody composed —
  rather than library glyphs on flat fills. Plus the technique that produced
  the best reference notes, which is reading a site at the asset and
  stylesheet level rather than by eye.
- `SKILL.md` and `AGENTS.md` carry the states invariant, two new bans
  (invented social proof, and the centred-hero-plus-three-cards composite),
  and **the four lanes** — because the devices reassemble even when each one
  is individually avoided, and a lane you did not choose is slop even when
  the lane is beautiful.
- `examples/meridian/` demonstrates all five new template sections, with its
  signal-token rule now actually enforced by a `bans` entry and one scoped
  exemption rather than asserted in prose.

## 0.1.1 — 2026-10-14

Installable as a Claude Code plugin.

```
/plugin marketplace add justuchena/no-ai-slop
/plugin install no-ai-slop
```

- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.
- `skills/no-ai-slop/SKILL.md`, generated from the root `SKILL.md` by
  `pipeline/derive-skill.mjs` with its link targets repointed two levels up.

  Both locations are needed and neither is negotiable: a cloned skill is read
  from the clone root, while a plugin's `skills/` directory is what gets
  scanned, so a root-only `SKILL.md` is never found by a plugin. The copy is
  derived rather than written twice, for the reason `derive.mjs` exists at
  all — two hand-maintained copies diverge — and `--check` fails a build when
  it drifts.
- The root `SKILL.md` heading still read "Design pack", from before the
  rename.

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
- `enforce/commit-check.mjs` — the same argument applied to this repo's own
  commit convention. Fails on a malformed subject, an unknown type or scope,
  a trailing full stop, an empty opening word, a missing blank line or a
  `Co-Authored-By` trailer; warns, without failing, on the rules whose
  exceptions need judgement. Installable as a `commit-msg` hook via
  `git config core.hooksPath .githooks`.

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
  finds it. `AGENTS.md` is the short form for agents that read that filename.
- Inter and Outfit vendored as subset woff2, both SIL OFL 1.1.
