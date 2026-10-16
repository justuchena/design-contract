# AGENTS.md

Instructions for any coding agent working in a repository that has this pack
available. The full version, with the reasoning, is [`SKILL.md`](SKILL.md) —
this is the short form for agents that read `AGENTS.md` by convention
(Cursor, Codex, Copilot, Aider and others).

## Before writing any UI

**Find the design doc.** Check `DESIGN.md`, `docs/DESIGN.md`,
`DESIGN-SYSTEM.md`, `CLAUDE.md`, `AGENTS.md`, a `design-system/` directory, a
`tokens.css`, or a Tailwind theme block. One usually exists and usually has
not been read.

- **If one exists, it governs.** Read it fully first. When a request
  conflicts with it, say so and cite the section rather than quietly
  following the request.
- **If none exists, do not invent one per file.** That is the actual cause of
  work that looks generated: each file is locally plausible, and together
  they are incoherent. Offer to write one from
  [`method/DESIGN-TEMPLATE.md`](method/DESIGN-TEMPLATE.md), or at minimum
  settle and write down three decisions: one accent and the share of
  emphasised surface it carries; one radius, one spacing base, one type ramp
  with line heights; and what the page ground is versus a plate.

## When using a reference or a screenshot

**Borrow structure. Never transplant a device.**

Structure is how a page is ordered and what it groups — an argument about
information, usually transferable. A device is the marker highlight, the
cream ground, the hand-drawn figure, the dark closing slab — it carries
another brand's voice and arrives as costume.

A screenshot is mostly device. So state which parts you are taking as
structure and which you are rejecting, before building. Full method in
[`method/references.md`](method/references.md).

Do not commit third-party screenshots to the repository.

## When writing user-visible copy

Two rules, both in [`method/voice.md`](method/voice.md):

1. **No em dashes anywhere a visitor can read.** Use a colon, a full stop,
   commas, or `·`. Do not substitute a hyphen or en dash — rewrite the
   punctuation. Source comments are exempt.
2. **One register, and never the engineering one.** Describe what the product
   is for and who it affects, not how it is built. If the reader would have
   to look a word up, it does not ship.

## When the surface reads something

Full argument in [`method/states.md`](method/states.md). The short form:

**Branch on `ready`, not on `not failed`.** Every surface that reads has four
branches, and the fourth is the one that gets skipped:

- **loading** claims nothing. A skeleton holding the shape the content will
  take, not a spinner in the middle of nothing.
- **ready and empty** claims *there is none*. That is a factual assertion
  about the world and it has to be earned.
- **ready and full** is the happy path.
- **failed** claims *I could not find out*. Different words, a retry, and
  never the empty state's words.

`data?.items ?? []` collapses the fourth into the second, which is a wrong
branch rather than a missing one: the surface says "you have none" in the
voice it reserves for true things. **An empty state is a claim, and nobody
reads it as one.**

For a destructive action: an undo window when the action is reversible, a
confirmation when it is irreversible, and always a confirmation when it
reaches past the person clicking. An undo that does not actually restore is
worse than no undo.

## Before reporting the work done

```bash
node enforce/design-check.mjs        # needs a design-check.config.mjs
node enforce/design-check.mjs --fix  # only the findings marked [--fix]
node pipeline/contrast.mjs <palette.json>
```

`--fix` applies the rewrites the config already states and leaves the rest.
Run it on a clean tree and read the diff — do not report work done on the
strength of a fixer's own summary. When the app runs, use the gate instead,
which shoots the app either side of the fix and reports what moved:

```bash
node pipeline/fix-gate.mjs --base <url> --routes / /pricing
```

It exits non-zero whenever anything moved. That is the instruction to look at
the masks it wrote, not a failure.

Then **render it and look at it**, narrow width first
(`node pipeline/shots.mjs --base <url> --routes /`). A design doc cannot tell
you a section is one card too long, and neither can a checker.

## Defaults when no design doc says otherwise

Each of these reliably marks work as generated:

- The three-card feature row (icon, bold line, two lines of grey)
- Gradient text (`background-clip: text`)
- Side-stripe borders (`border-l-4`)
- Hard rules between sections
- A second accent for "secondary" actions
- Em dashes in user-visible copy
- A card grid where a table is meant
- Centred body copy
- Emoji as UI iconography
- Dark as a full-width section rather than a contained object
- Invented social proof: star ratings, made-up metrics, fake product
  screenshots, "trusted by thousands". This one is dishonest rather than
  merely generic, and a placeholder testimonial is exactly what filling a
  layout asks for.

And the four lanes, which is what the list above is really about, because the
parts reassemble even when each one is avoided: standard SaaS landing;
bootcamp marketing; AI-design template (glassmorphism, blue-to-purple
gradient text, identical cards, an unmeasured hero metric); and
editorial-typographic. The last is on the list because it is *good* and
because converging on it by accident is the same failure as the other three.
A lane you did not choose is slop even when the lane is beautiful.

## What not to do with the checker

`enforce/design-check.mjs` holds geometry, colour, punctuation, measurable
floors, and the interaction rules a machine can decide: the focus indicator,
pointer targets, accessible names on icon-only controls, hover-only
affordances, unguarded animation, fields, raw images, hand-rolled shells and
the `flex-1` shrink fault. `--fix` settles only the findings whose target the
config names; it will never invent an accessible name, choose between two
allowed values, or answer a contrast failure. It deliberately does **not**
check composition,
hierarchy or taste — and it cannot check whether an empty state would be a
lie on failure, which is why the states rules are read rather than run.

Do not add a rule you cannot trace to a section of the design doc. A rule
with no argument behind it produces noise, and noise teaches people to pass
`--force`, which costs every rule at once.
