# no-ai-slop

[![licence: Apache-2.0](https://img.shields.io/badge/licence-Apache--2.0-blue.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen.svg)](package.json)
[![dependencies: none](https://img.shields.io/badge/dependencies-none-brightgreen.svg)](package.json)
[![design systems: 152](https://img.shields.io/badge/design%20systems-152-blue.svg)](refs/INDEX.md)
[![self-checked: npm run verify](https://img.shields.io/badge/self--checked-npm%20run%20verify-brightgreen.svg)](enforce/test.mjs)

**A design doc method, 152 design-system references, and a checker that
enforces the rules a machine can hold.**

For people building frontends with an AI agent and getting back work that is
locally plausible and globally incoherent.

---

## The premise

Generated-looking UI is not a taste problem. It is a **specification**
problem.

Given no specification, a model invents one per file. So you get five card
radii, three greys that nearly match, an em dash in every third sentence, a
three-card feature row, and a gradient somewhere. Each file is defensible.
Together they are not a product.

The usual fix is to write a design doc. That is necessary and it is not
sufficient, because **prose drifts**. On a real project of mine, every rule
in the checker here had already been written down *and* broken:

- a grey failing contrast in sixteen places
- five card radii where one was meant
- a colour the doc explicitly retired, still in the stylesheet
- em dashes in copy the same document banned them from

Each was written down. Each drifted anyway, because **a rule nobody runs is a
rule nobody keeps.**

So this repo is three layers, and the third is the one that is usually
missing.

## 1. `method/` — write the specification

[`method/DESIGN-TEMPLATE.md`](method/DESIGN-TEMPLATE.md) is a design doc
template built around one idea: **every section records a decision, not a
description.**

"Buttons have an 8px radius" is a description, and it rots the moment someone
ships a 6px button. "One radius, 8px, because five were in use and a card
sharing a corner with its neighbour reads as one plate" is a decision — and
now a 6px button visibly contradicts something.

Two companion docs carry the parts that matter most in practice:

- [`method/references.md`](method/references.md) — **borrow structure, never
  transplant a device.** The single distinction that separates using a
  reference from producing a copy. This is the one to read first if you only
  read one thing.
- [`method/voice.md`](method/voice.md) — the two standing copy rules. No em
  dashes anywhere a visitor can read, and one deliberately chosen register.
  Writing is half of why an interface reads as generated, and nobody puts it
  under a rule.

[`examples/meridian/`](examples/meridian/) is a complete filled-in design
doc for an invented product, with **real measured contrast ratios**, so you
can see what a finished one looks like before writing your own.

## 2. `refs/` — read how other systems were specified

152 design-system packages, each with prose contract, `tokens.css`,
`design-tokens.json`, a Tailwind v4 theme, rendered component fixtures and
colour/type/spacing previews.

Two cautions, and they matter:

- **Do not trust a specific hex** as being literally that company's current
  token. These are a written interpretation, not a fresh crawl.
- **Do trust the structure and the rigour.** The value is watching how a
  design contract gets written — what gets measured, what gets named, what
  gets forbidden. That transfers whether or not the hex is current.

Start at [`refs/INDEX.md`](refs/INDEX.md), which maps the catalog by the
problem you have rather than the brand you like. Opening a package's
`preview/colors.html` and `components.html` in a browser is much faster than
reading its Markdown.

## 3. `enforce/` — hold the rules a machine can hold

```bash
cp enforce/design-check.config.example.mjs design-check.config.mjs
# edit it: every rule should map to a section of your design doc
node enforce/design-check.mjs
```

```
✗ design-check: 14 finding(s) in 3 files

  ── palette (3) ──
     A retired hue is still in the tree.
     src/bad.tsx:6  bg-violet-500 — violet is retired
     src/bad.tsx:6  #4f46e5 — retired, and a literal cannot follow the theme

  ── contrast (1) ──
     Below the 4.5:1 text floor and the 3:1 floor for a meaningful icon.
     src/bad.tsx:5  text-gray-400 is 2.37:1 — use text-gray-500, or aria-hidden
```

Rules: retired hues by name **and by hex**, arbitrary colour classes,
element-scoped bans, measured contrast floors, the type ramp, the icon scale,
the disabled pair, copy bans, one-declaration-per-token. Every rule prints the
sentence that justifies it.

Three design decisions in here are worth stating, because they are what make
it survive contact with a real codebase:

- **Comments are stripped before every rule runs.** A checker that fires on
  the comment explaining a ban punishes writing the explanation down. The
  stripper preserves byte offsets so line numbers stay correct, and skips
  string literals — because a regex for `/*` cannot tell a comment from
  `accept="image/*"`, and getting that wrong blanks half a file and reports
  true statements about text that does not exist.
- **Some rules read one element, not the file.** A *card* may be pure white;
  a *section plate* may not. A divider inside a card is fine; between two
  sections it is banned. A flat grep cannot express the distinction a design
  doc actually makes.
- **It refuses to check composition.** Whether a section earns its place,
  whether a headline is any good. A check with an opinion about taste
  produces noise, and noise teaches people to pass `--force` — which costs
  you every rule at once.

**Never add a rule you cannot trace to a section of your design doc.** A rule
with no argument behind it gets deleted the first time it is inconvenient,
and that is the correct outcome.

## 4. `pipeline/` — measure, derive, and look

```bash
# every foreground against every ground it is for
node pipeline/contrast.mjs examples/meridian/palette.json

# tokens.css → Design Tokens JSON; --check fails a build when stale
node pipeline/derive.mjs src/styles/tokens.css --check

# screenshot a running app, narrow first
node pipeline/shots.mjs --base http://localhost:5173 --routes / /pricing
```

`contrast.mjs` exists for one specific finding that single-ground tools never
see. On the example palette:

```
                paper #fcfcfa    tint #f3f4ef
fg-subtle       4.71:1           4.37:1 ✗

Conditional — passes on one ground, fails on another:
  fg-subtle: clears 4.5:1 on paper but not on tint
```

A grey that clears the floor on the page and misses it on a tinted plate.
That cannot be expressed as a ban, because the colour is fine where it is
fine — so the tool prints the numbers and you write the condition into the
doc. **The checker holds the measurements; the doc holds the judgement.** That
split is the whole method.

## Install

**As an agent skill.** [`SKILL.md`](SKILL.md) is the entry point, and it lives
at the repo root because that is where a skill loader looks for it:

```bash
git clone https://github.com/justuchena/no-ai-slop ~/.claude/skills/no-ai-slop
```

Then ask for a design pass as normal. The skill routes an agent through the
same four steps: find or write the spec, build against references without
transplanting devices, check mechanically, then render it and look.

**As a CLI**, without cloning:

```bash
npx no-ai-slop design-check            # needs a design-check.config.mjs
npx no-ai-slop design-contrast palette.json
```

Or in a project:

```bash
npm i -D no-ai-slop
```

```json
{
  "scripts": {
    "design": "design-check",
    "design:tokens": "design-derive src/styles/tokens.css --check"
  }
}
```

Node 18 or newer. No required dependencies; `playwright` is an optional peer,
needed only for `design-shots`.

## The bans worth carrying anywhere

Absent a doc that says otherwise — each one reliably marks work as generated:

- **The three-card feature row.** Icon, bold line, two lines of grey. The
  most recognisable generated layout there is. It says nothing.
- **Gradient text.** Contrast becomes unmeasurable, so it cannot be checked,
  so it drifts.
- **Side-stripe borders** (`border-l-4`). Leftover scaffolding, never design.
- **Hard rules between sections.** Sections should feather.
- **A second accent** for "secondary" actions. Two saturated colours means
  neither says "look here".
- **Em dashes in user-visible copy.** The most reliable tell there is.
- **A card grid where a table is meant.**
- **Centred body copy.** Headings may centre; paragraphs do not.
- **Emoji as UI iconography.**
- **Dark as a full-width section** rather than a contained object.

## Layout

| Path | What it is |
|---|---|
| `method/` | The design doc template, references method, voice rules |
| `enforce/` | `design-check.mjs` and its annotated config |
| `pipeline/` | `contrast.mjs`, `derive.mjs`, `shots.mjs`, OFL fonts |
| `refs/` | 152 design-system packages |
| `examples/meridian/` | A filled-in design doc with real measurements |
| `resources/` | Icons, fonts, illustration, tooling — licence per entry |
| `SKILL.md` | Agent skill entry point (Claude Code) |
| `AGENTS.md` | Short form for Cursor, Codex, Copilot, Aider |

## Licence

Two licences, because code and content want different terms.

- **`refs/`** — Apache-2.0, derived from
  [`nexu-io/open-design`](https://github.com/nexu-io/open-design). See
  [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE) for the full attribution chain
  and statement of changes.
- **`pipeline/fonts/`** — Inter and Outfit, both SIL Open Font License 1.1.
- **Everything else** (`method/`, `enforce/`, `pipeline/*.mjs`, `examples/`,
  `resources/`, `SKILL.md`) — original work, Apache-2.0, same as the repo.

The reference packages are aesthetic interpretations, not official assets of
the companies they reference. They contain no logos and no trademarked
material. All trademarks belong to their owners.

## Contributing

The most useful contribution is **a rule with an argument behind it**: a
pattern you have actually watched drift, the sentence that justifies holding
it, a fixture case, and a negative case that must not fire. Rules without
arguments will be declined, for the reason given above — one bad rule is
worse than ten missing ones.

Equally welcome: false positives (the most valuable report there is), licence
corrections to `resources/`, and a second worked example for a different kind
of product.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the bar in full, and
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

```bash
npm run verify    # 23 assertions, plus the token mirror
```

Please do not send PRs editing the contents of `refs/` — those packages are
redistributed unmodified, and keeping them that way is what makes
[`NOTICE`](NOTICE) accurate. Fixes belong
[upstream](https://github.com/nexu-io/open-design).
