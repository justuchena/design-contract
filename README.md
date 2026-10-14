<div align="center">

# no-ai-slop

**A design-doc method, the state rules that decide whether an interface
tells the truth, 152 design-system references, and a checker that enforces
the rules a machine can hold.**

For anyone building frontends with an AI agent and getting back work that is
locally plausible and globally incoherent.

[![licence: Apache-2.0](https://img.shields.io/badge/licence-Apache--2.0-blue.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen.svg)](package.json)
[![dependencies: none](https://img.shields.io/badge/dependencies-none-brightgreen.svg)](package.json)
[![design systems: 152](https://img.shields.io/badge/design%20systems-152-blue.svg)](refs/INDEX.md)
[![checker rules: 20](https://img.shields.io/badge/checker%20rules-20-blue.svg)](enforce/README.md)
[![self-checked](https://img.shields.io/badge/self--checked-npm%20run%20verify-brightgreen.svg)](enforce/test.mjs)

[Premise](#the-premise) · [Method](#1-method--write-the-specification) ·
[References](#2-refs--read-how-other-systems-were-specified) ·
[Checker](#3-enforce--hold-the-rules-a-machine-can-hold) ·
[Measurement](#4-pipeline--measure-derive-and-look) ·
[Install](#install) · [Bans](#the-bans-worth-carrying-anywhere)

</div>

---

## In one minute

```bash
git clone https://github.com/justuchena/no-ai-slop
cd no-ai-slop

# the finding that single-ground contrast tools never show you
node pipeline/contrast.mjs examples/meridian/palette.json

# the checker, against a deliberately broken fixture
cd enforce/fixture && node ../design-check.mjs
```

| Layer | What it does |
|---|---|
| [`method/`](method/) | How to write a design doc that does not rot, and how to use a reference without copying it |
| [`refs/`](refs/) | 152 design-system packages: prose contract, tokens, Tailwind theme, rendered fixtures |
| [`enforce/`](enforce/) | A configurable checker for the rules a machine can hold, and nothing else |
| [`pipeline/`](pipeline/) | Contrast matrix, token mirror, screenshot loop |
| [`examples/meridian/`](examples/meridian/) | A complete filled-in design doc, with really measured numbers |
| [`resources/`](resources/) | Icons, typefaces, illustration, tooling — licence noted per entry |
| [`SKILL.md`](SKILL.md) · [`AGENTS.md`](AGENTS.md) | Agent entry points — plugin, skill, or any other agent |

---

## The premise

Generated-looking UI is not a taste problem. It is a **specification**
problem.

Given no specification, a model invents one per file. So you get five card
radii, three greys that nearly match, an em dash in every third sentence, a
three-card feature row, and a gradient somewhere. Each file is defensible.
Together they are not a product.

The usual fix is to write a design doc. That is necessary and it is not
sufficient, because **prose drifts**. On a real project of mine, every rule in
the checker here had already been written down *and* broken:

| Written down | Shipped anyway |
|---|---|
| A contrast floor | A grey failing it in sixteen places |
| One card radius | Five radii in use |
| A retired colour | Still in the stylesheet |
| No em dashes in copy | Em dashes in copy |

> **A rule nobody runs is a rule nobody keeps.**

So this repo is three layers, and the third is the one that is usually
missing.

---

## 1. `method/` — write the specification

[`method/DESIGN-TEMPLATE.md`](method/DESIGN-TEMPLATE.md) is a design doc
template built around one idea: **every section records a decision, not a
description.**

> "Buttons have an 8px radius" is a description, and it rots the moment
> someone ships a 6px button.
>
> "One radius, 8px, because five were in use and a card sharing a corner with
> its neighbour reads as one plate" is a decision — and now a 6px button
> visibly contradicts something.

Two companion docs carry the parts that matter most in practice:

**[`method/references.md`](method/references.md) — borrow structure, never
transplant a device.** The single distinction that separates using a
reference from producing a copy. Structure is how a page is ordered and what
it groups: an argument about information, usually transferable. A device is
the marker highlight, the cream ground, the dark closing slab: it carries
another brand's voice and arrives as costume. *If you read one file here,
read this one.*

**[`method/voice.md`](method/voice.md) — the two standing copy rules.** No em
dashes anywhere a visitor can read, and one deliberately chosen register.
Writing is half of why an interface reads as generated, and nobody puts it
under a rule.

**[`method/states.md`](method/states.md) — whether the interface is telling
the truth.** The four branches every surface that reads something has, and
the one invariant that keeps them apart: **branch on `ready`, not on `not
failed`.** This is the dimension that is missing from every design doc I have
read, including the ones I wrote. A model writes the happy path, then the
empty state, and then `data?.items ?? []` turns "the request did not come
back" into "you have none" — a *wrong* branch rather than a missing one,
stated in the voice the product reserves for true things. Auditing four
applications for that one shape found a false all-clear on a moderation
queue, seven public pages telling visitors their link was dead, and an Undo
that replaced a week with nothing and reported success. All of them had an
empty state. That was the problem. *If what you are building is an
application rather than a page, read this before the visual rules.*

[`examples/meridian/`](examples/meridian/) is a complete filled-in design doc
for an invented product, with **real measured contrast ratios**, so you can
see a finished one before writing your own.

---

## 2. `refs/` — read how other systems were specified

152 design-system packages, each with a prose contract, `tokens.css`,
`design-tokens.json`, a Tailwind v4 theme, rendered component fixtures and
colour/type/spacing previews.

Two cautions, and they matter:

- **Do not trust a specific hex** as being literally that company's current
  token. These are a written interpretation, not a fresh crawl.
- **Do trust the structure and the rigour.** The value is watching how a
  design contract gets written — what gets measured, what gets named, what
  gets forbidden. That transfers whether or not the hex is current.

Start at [`refs/INDEX.md`](refs/INDEX.md), which maps the catalog by **the
problem you have** rather than the brand you like. Opening a package's
`preview/colors.html` and `components.html` in a browser is much faster than
reading its Markdown.

---

## 3. `enforce/` — hold the rules a machine can hold

```bash
cp enforce/design-check.config.example.mjs design-check.config.mjs
# edit it: every rule should map to a section of your design doc
node enforce/design-check.mjs
```

```
✗ design-check: 27 finding(s) in 5 files

  ── palette (3) ──
     A retired hue is still in the tree.
       src/bad.tsx:6  bg-violet-500 — violet is retired
     A retired hue as a literal.
       src/bad.tsx:6  #4f46e5 — retired, and a literal cannot follow the theme

  ── a11y (2) ──
     WCAG 2.2 §2.5.8 asks 24px of any pointer target.
       src/row.tsx:23  22px pointer target — p-1 around a 14px glyph
     An icon-only control has no text for a screen reader to read.
       src/row.tsx:32  icon-only <button> with no accessible name
```

**Twenty rules, in two halves.** What a surface *looks like*: retired hues by
name and by hex, arbitrary colour classes, flat bans, element-scoped bans,
measured contrast floors, the type ramp, the icon scale, the disabled pair,
an arbitrary radius, copy bans, and one-declaration-per-token.

And whether it *can be used*, which is the half a design doc forgets: a focus
indicator suppressed with nothing put back, a pointer target under 24px, an
icon-only control with no accessible name, an affordance that answers hover
and not focus, an animation no `prefers-reduced-motion` rule covers, a
placeholder used as a label, a native date picker, a raw `<img>` with no
fallback, a hand-rolled card shell where the doc specifies a component, a
`flex-1` scroller with no `min-h-0`, and a token meant for type used as a
ground under text.

Every rule prints the sentence that justifies it, and every one is off until
you turn it on.

<details>
<summary><strong>Three decisions that make it survive a real codebase</strong></summary>

<br>

**Comments are stripped before every rule runs.** A checker that fires on the
comment explaining a ban punishes writing the explanation down. The stripper
preserves byte offsets so line numbers stay correct, and skips string
literals — because a regex for `/*` cannot tell a comment from
`accept="image/*"`, and getting that wrong blanks half a file and reports
true statements about text that does not exist.

**Some rules read one element, not the file — and some read a node's
ancestors.** A *card* may be pure white; a *section plate* may not. A divider
inside a card is fine; between two sections it is banned. A flat grep cannot
express the distinction a design doc actually makes.

The ancestor walk earned its place: the field rule without it reported
thirteen correctly labelled fields as nameless, because their label was a
local `<Row label="Name">` whose body is a `<label>` wrapping the children.
That association is real, implicit, and crosses a component boundary no regex
over one file can follow. The interaction rules also read a *whole class
expression* rather than a line, because the contradiction they look for
(`opacity-0` with a hover answer and no focus answer) survives being
formatted across five lines, and a line-wise check reports the file that is
correct.

**It refuses to check composition.** Whether a section earns its place,
whether a headline is any good. A check with an opinion about taste produces
noise, and noise teaches people to pass `--force` — which costs you every
rule at once.

</details>

> **Never add a rule you cannot trace to a section of your design doc.** A
> rule with no argument behind it gets deleted the first time it is
> inconvenient, and that is the correct outcome.

The same argument applies to this repo's own commit convention, so
[`enforce/commit-check.mjs`](enforce/commit-check.mjs) holds that too.

---

## 4. `pipeline/` — measure, derive, and look

```bash
# every foreground against every ground it is for
node pipeline/contrast.mjs examples/meridian/palette.json

# tokens.css → Design Tokens JSON; --check fails a build when stale
node pipeline/derive.mjs src/styles/tokens.css --check

# screenshot a running app, narrow first
node pipeline/shots.mjs --base http://localhost:5173 --routes / /pricing
```

`contrast.mjs` exists for one finding that single-ground tools never see:

```
                paper #fcfcfa    tint #f3f4ef
fg-subtle       4.71:1           4.37:1 ✗

Conditional — passes on one ground, fails on another:
  fg-subtle: clears 4.5:1 on paper but not on tint
```

A grey that clears the floor on the page and misses it on a tinted plate.
That cannot be expressed as a ban, because the colour is fine where it is
fine — so the tool prints the numbers and you write the condition into the
doc.

> **The checker holds the measurements; the doc holds the judgement.** That
> split is the whole method.

---

## Install

### As a Claude Code plugin

```
/plugin marketplace add justuchena/no-ai-slop
/plugin install no-ai-slop
```

Then ask for a design pass as normal. The skill routes an agent through four
steps: find or write the spec, build against references without transplanting
devices, check mechanically, then render it and look.

### As a skill, cloned

```bash
git clone https://github.com/justuchena/no-ai-slop ~/.claude/skills/no-ai-slop
```

[`SKILL.md`](SKILL.md) sits at the repo root because that is where a skill
loader looks for it. A plugin's `skills/` directory is scanned instead, so
[`skills/no-ai-slop/SKILL.md`](skills/no-ai-slop/SKILL.md) is generated from
the root copy by [`pipeline/derive-skill.mjs`](pipeline/derive-skill.mjs),
with its links repointed and a staleness check in `npm run verify`. Edit the
root one.

### With any other agent

[`AGENTS.md`](AGENTS.md) is the short form that Cursor, Codex, Copilot and
Aider read by convention.

### As scripts in a project

The scripts are plain ESM with no required dependencies, so a clone and a
path is all they need:

```json
{
  "scripts": {
    "design": "node ../no-ai-slop/enforce/design-check.mjs",
    "design:tokens": "node ../no-ai-slop/pipeline/derive.mjs src/styles/tokens.css --check"
  }
}
```

Node 18 or newer. `playwright` is an optional peer, needed only by
`pipeline/shots.mjs`.

> **Not on npm yet.** The manifest is prepared as
> `@justuchena/no-ai-slop` — scoped, because the unscoped `no-ai-slop` on npm
> is an unrelated project. Until it is published, clone it.

---

## The bans worth carrying anywhere

Absent a design doc that says otherwise. Each one reliably marks work as
generated.

| Ban | Why |
|---|---|
| **The three-card feature row** | Icon, bold line, two lines of grey. The most recognisable generated layout there is, and it says nothing. |
| **Gradient text** | Contrast becomes unmeasurable, so it cannot be checked, so it drifts. |
| **Side-stripe borders** (`border-l-4`) | Leftover scaffolding, never design. |
| **Hard rules between sections** | Sections should feather, not butt. |
| **A second accent** for "secondary" actions | Two saturated colours means neither says "look here". |
| **Em dashes in user-visible copy** | The most reliable tell there is. |
| **A card grid where a table is meant** | Tabular data has to stay scannable and sortable. |
| **Centred body copy** | Headings may centre; paragraphs do not. |
| **Emoji as UI iconography** | |
| **Dark as a full-width section** | Dark is an object, not a mode. |

---

## Licence

Two licences, because code and content want different terms.

| What | Licence |
|---|---|
| [`refs/`](refs/) | Apache-2.0, derived from [`nexu-io/open-design`](https://github.com/nexu-io/open-design). See [`NOTICE`](NOTICE) for the attribution chain and statement of changes. |
| [`pipeline/fonts/`](pipeline/fonts/) | Inter and Outfit, both SIL Open Font License 1.1 |
| Everything else | Apache-2.0, original work — see [`LICENSE`](LICENSE) |

The reference packages are aesthetic interpretations, not official assets of
the companies they reference. They contain no logos and no trademarked
material. All trademarks belong to their owners.

---

## Contributing

The most useful contribution is **a rule with an argument behind it**: a
pattern you have actually watched drift, the sentence that justifies holding
it, a fixture case, and a negative case that must not fire. Rules without
arguments will be declined, for the reason given above — one bad rule is
worse than ten missing ones.

Equally welcome: **false positives** (the most valuable report there is),
licence corrections to [`resources/`](resources/), and a second worked
example for a different kind of product.

```bash
npm run verify    # 23 assertions, the token mirror, and the commit convention
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org) —
`type(scope): subject`, a body that says why, no `Co-Authored-By`. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the bar in full, and
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

Please do not send PRs editing the contents of `refs/` — those packages are
redistributed unmodified, and keeping them that way is what makes
[`NOTICE`](NOTICE) accurate. Fixes belong
[upstream](https://github.com/nexu-io/open-design).
