---
name: no-ai-slop
description: Build frontend UI that does not read as generated. Use when designing or implementing any web interface, component, page, landing page, dashboard or app surface; when setting up a design system or design tokens; when writing or enforcing a design doc; when asked to review UI for quality, consistency, contrast or accessibility; or when a reference site or screenshot is being used as inspiration. Carries a design-doc method, 152 real design-system references, and a configurable checker that enforces the rules a machine can hold.
license: see LICENSE and NOTICE at the repo root
---

# Design pack

Generated-looking UI is not a taste problem. It is a **specification** problem.
A model with no design doc invents one per file, so the work is locally
plausible and globally incoherent: five radii, three greys that nearly match,
an em dash in every third sentence, a three-card feature row.

So this skill does three things in order, and the order is the method:

1. **Find the specification, or write one.** → `method/`
2. **Build against it, borrowing structure and never device.** → `refs/`
3. **Check it mechanically, because prose drifts.** → `enforce/`

## Step 1 — Establish the specification

**Look for a design doc before writing any UI.** Check `DESIGN.md`,
`docs/DESIGN.md`, `DESIGN-SYSTEM.md`, `CLAUDE.md`, `AGENTS.md`, a
`design-system/` directory, a `tokens.css`, or a Tailwind theme block. One of
these usually exists and is usually not read.

**If one exists:** it governs. Read it fully before proposing anything. When a
request conflicts with it, say so and cite the section rather than quietly
following the request. A design doc the agent overrides on request is not a
design doc.

**If none exists:** do not invent one silently, and do not start writing
components either. Offer to create one from
[`method/DESIGN-TEMPLATE.md`](method/DESIGN-TEMPLATE.md). For a small
task, settle the three decisions that cause the most incoherence and write
them down somewhere durable:

- **One accent**, and what share of emphasised surface it carries.
- **One radius**, one spacing base, one type ramp with line heights.
- **The grounds**: what the page is, what a plate is, and whether anything
  is pure white or pure black.

Then measure before committing to greys:
`node pipeline/contrast.mjs <palette.json>`. Every foreground against every
ground it is *for* — that is the test that catches a grey which passes on the
page and fails on a tinted plate, which is the commonest real contrast bug in
any system with more than one ground.

Read [`method/voice.md`](method/voice.md) whenever writing
user-visible copy. Both rules there — no em dashes, one deliberate register —
do more to stop the generated register than any visual rule.

## Step 2 — Build against references, carefully

[`refs/`](refs/) holds 152 design-system packages. Each has
`DESIGN.md` (the prose contract), `tokens.css`, `design-tokens.json`,
`tailwind-v4.css`, and rendered `components.html` plus `preview/` pages.

**Opening `preview/colors.html` and `components.html` in a browser is the
fastest way to judge one.** Much faster than reading the Markdown.

Two standing cautions, both from [`refs/INDEX.md`](refs/INDEX.md):

- **Do not trust a specific hex as being literally that brand's current
  token.** These are a written interpretation, not a fresh crawl. If you need
  the real value, open the real site.
- **Do trust the structure and the rigour.** The value is watching how a
  brand contract gets written: what gets measured, what gets named, what gets
  forbidden. That transfers whether or not the hex is current.

Then the rule that matters most, from
[`method/references.md`](method/references.md):

> **Borrow structure. Never transplant a device.**
>
> *Structure* is how a page is ordered and what it groups — an argument about
> information, usually transferable. *Device* is the marker highlight, the
> cream ground, the dark closing slab — it carries the other brand's voice
> and arrives as costume.

A device works on its own site because everything else there supports it.
Lifted alone it has no support, so it reads as decoration — and decoration is
exactly what a reader identifies as generated.

**When handed a screenshot:** a screenshot is mostly device, so say which
parts you are taking as structure and which you are rejecting, before
building. Do not commit competitors' screenshots to a repo.

## Step 3 — Enforce what a machine can hold

Prose drifts. On one audited project, every rule the checker now holds had
already been written down *and* broken: a grey failing contrast in sixteen
places, five card radii where one was meant, a retired colour still in the
stylesheet, banned em dashes in shipped copy.

```bash
cp enforce/design-check.config.example.mjs design-check.config.mjs
# edit it so every rule maps to a section of the design doc
node enforce/design-check.mjs
```

Rules available: retired hues by name and by hex, arbitrary colour classes,
element-scoped bans (pure-white plates, hard seams between sections),
measured contrast floors, the type ramp, the icon scale, the disabled pair,
copy bans, and one-declaration-per-token. Each prints the sentence that
justifies it.

**The split, and it is load-bearing:**

- The **checker** holds geometry, colour, punctuation, measurable floors.
- The **doc** holds composition, register, intent, and the conditional rules
  a checker cannot express.

Do not try to automate taste. A check with an opinion about whether a section
earns its place produces noise, and noise teaches people to pass `--force` —
which costs every rule at once.

**Never add a rule you cannot trace to a section of the design doc.** A rule
with no argument behind it gets deleted the first time it is inconvenient,
and that is the correct outcome.

## Step 4 — Look at it

Render the page and actually look before reporting done. A design doc cannot
tell you that a section is one card too long.
[`pipeline/shots.mjs`](pipeline/shots.mjs) screenshots a running app at
several widths; check the narrow one, because the layout that breaks is
almost always the narrow one.

## The bans worth carrying into any project

Absent a doc that says otherwise, these are safe defaults — each is a pattern
that reliably marks work as generated:

- **The three-card feature row** — icon, bold line, two lines of grey. The
  single most recognisable generated layout. It says nothing.
- **Gradient text** (`background-clip: text`). Contrast becomes unmeasurable,
  so it cannot be checked, so it drifts.
- **Side-stripe borders** (`border-l-4`). Leftover scaffolding, never design.
- **Hard rules between sections.** Sections should feather.
- **A second accent** introduced for "secondary" actions. Two saturated
  colours means neither says "look here".
- **Em dashes in user-visible copy.** The most reliable tell there is.
- **A card grid where a table is meant.** Tabular data needs to be scannable.
- **Centred body copy.** Headings may centre; paragraphs do not.
- **Emoji as UI iconography.**
- **Dark as a full-width section** rather than as a contained object.

## Files

| Path | What it is |
|---|---|
| `method/DESIGN-TEMPLATE.md` | The design doc template. Start here. |
| `method/references.md` | Structure vs device. Read before using any reference. |
| `method/voice.md` | The two standing copy rules. |
| `enforce/design-check.mjs` | The checker. |
| `enforce/design-check.config.example.mjs` | Every rule, annotated, off by default. |
| `pipeline/contrast.mjs` | Contrast matrix, scoped per ground. |
| `pipeline/derive.mjs` | `tokens.css` → Design Tokens JSON. |
| `pipeline/shots.mjs` | Screenshot a running app at several widths. |
| `refs/` | 152 design-system packages. `refs/INDEX.md` first. |
| `examples/meridian/` | A filled-in design doc, with real measurements. |
| `resources/README.md` | Icons, fonts, illustration, tooling. Licence noted per entry. |
