---
name: design-contract
description: Build frontend UI that does not read as generated. Use when designing or implementing any web interface, component, page, landing page, dashboard or app surface; when setting up a design system or design tokens; when writing or enforcing a design doc; when asked to review UI for quality, consistency, contrast or accessibility; or when a reference site or screenshot is being used as inspiration. Carries a design-doc method, the state and honesty rules that decide whether an interface tells the truth, 152 real design-system references, and a configurable checker that enforces the rules a machine can hold.
license: see LICENSE and NOTICE at the repo root
---

> **Paths in this file are relative to the pack's own root**, which is two
> directories up from here. Generated from the repo's root `SKILL.md` by
> `pipeline/derive-skill.mjs`; edit that one, not this copy.

# design-contract

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
[`method/DESIGN-TEMPLATE.md`](../../method/DESIGN-TEMPLATE.md). For a small
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

Read [`method/voice.md`](../../method/voice.md) whenever writing
user-visible copy. Both rules there — no em dashes, one deliberate register —
do more to stop the generated register than any visual rule.

**If what is being built is an application rather than a page, read
[`method/states.md`](../../method/states.md) too, and read it before the visual
rules.** It covers the dimension this skill used to be silent on: not whether
a surface looks designed, but whether it is honest. The headline is one
invariant and it is worth carrying everywhere:

> **Branch on `ready`, not on `not failed`.**

Because the fourth branch is the one that gets skipped. A model writes the
happy path, then the empty state, and then `data?.items ?? []` quietly turns
"the request did not come back" into "you have none" — which is not a missing
branch but a *wrong* one, stated in the voice the product reserves for true
things. On one audit of four applications that single shape produced a false
all-clear on a moderation queue, seven public pages telling visitors their
link was dead, and an Undo that replaced a week with nothing and reported
success. Every one of them had an empty state. That was the problem.

## Step 2 — Build against references, carefully

[`refs/`](../../refs/) holds 152 design-system packages. Each has
`DESIGN.md` (the prose contract), `tokens.css`, `design-tokens.json`,
`tailwind-v4.css`, and rendered `components.html` plus `preview/` pages.

**Opening `preview/colors.html` and `components.html` in a browser is the
fastest way to judge one.** Much faster than reading the Markdown.

Two standing cautions, both from [`refs/INDEX.md`](../../refs/INDEX.md):

- **Do not trust a specific hex as being literally that brand's current
  token.** These are a written interpretation, not a fresh crawl. If you need
  the real value, open the real site.
- **Do trust the structure and the rigour.** The value is watching how a
  brand contract gets written: what gets measured, what gets named, what gets
  forbidden. That transfers whether or not the hex is current.

Then the rule that matters most, from
[`method/references.md`](../../method/references.md):

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

19 rules, in two halves. What a surface **looks like**: retired hues by
name and by hex, arbitrary colour classes, element-scoped bans (pure-white
plates, hard seams between sections), measured contrast floors, the type
ramp, the icon scale, the disabled pair, an arbitrary radius, copy bans, and
one-declaration-per-token.

And whether it **can be used**, which is the half a design doc forgets: a
focus indicator suppressed with nothing put back, a pointer target under
24px, an icon-only control with no accessible name, an affordance that
answers hover and not focus, an animation no `prefers-reduced-motion` rule
covers, a placeholder used as a label, a native date picker, a raw `<img>`
with no fallback, a hand-rolled card shell where the doc specifies a
component, a `flex-1` scroller with no `min-h-0`, and a token meant for type
used as a ground under text.

Each prints the sentence that justifies it. The config turns every one of
them off by default, and the question to ask before turning one on is
whether you can point at the section of your design doc it enforces.

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
[`pipeline/shots.mjs`](../../pipeline/shots.mjs) screenshots a running app at
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
- **Invented social proof.** No star ratings, no made-up metrics, no fake
  product screenshots, no "trusted by thousands". Everything else on this
  list makes a page look generated. This one makes it dishonest, and it is
  the easiest of the lot to produce by accident, because a placeholder
  testimonial is exactly what filling a layout asks for.
- **Centred hero copy over a gradient, with three cards under it.** Named
  separately from its parts because the parts reassemble: the real unit of
  generated design is the *lane*, not the device.

## The four lanes, which are what the bans are really about

A page converges on a lane even when it avoids every device on the list
above, so name the lanes you are not building:

- **Standard SaaS landing.** Gradient hero, three-card features,
  testimonial carousel, pricing tower.
- **Bootcamp marketing.** Transformation copy, stock photos of people
  smiling at laptops, "join thousands of graduates".
- **AI-design template.** Glassmorphism, blue-to-purple gradient text,
  identical card shapes, a hero metric nobody measured.
- **Editorial-typographic.** Display serif, italic standfirst, drop caps,
  ruled column grid. This one is on the list because it is *good* and
  because it is not a default — it is a deliberate lane, and converging on
  it by accident is the same failure as the other three.

The last is the useful one to think about: a lane you did not choose is slop
even when the lane is beautiful. Write down which one you are in, and the
three you are not, in your design doc's reference section.

## Files

| Path | What it is |
|---|---|
| `method/DESIGN-TEMPLATE.md` | The design doc template. Start here. |
| `method/references.md` | Structure vs device. Read before using any reference. |
| `method/voice.md` | The two standing copy rules. |
| `method/states.md` | The four branches, and whether the interface is honest. |
| `enforce/design-check.mjs` | The checker. |
| `enforce/design-check.config.example.mjs` | Every rule, annotated, off by default. |
| `pipeline/contrast.mjs` | Contrast matrix, scoped per ground. |
| `pipeline/derive.mjs` | `tokens.css` → Design Tokens JSON. |
| `pipeline/shots.mjs` | Screenshot a running app at several widths. |
| `refs/` | 152 design-system packages. `refs/INDEX.md` first. |
| `examples/meridian/` | A filled-in design doc, with real measurements. |
| `resources/README.md` | Icons, fonts, illustration, tooling. Licence noted per entry. |
