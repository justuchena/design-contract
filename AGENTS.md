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

## Before reporting the work done

```bash
node enforce/design-check.mjs        # needs a design-check.config.mjs
node pipeline/contrast.mjs <palette.json>
```

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

## What not to do with the checker

`enforce/design-check.mjs` holds geometry, colour, punctuation and measurable
floors. It deliberately does **not** check composition, hierarchy or taste.

Do not add a rule you cannot trace to a section of the design doc. A rule
with no argument behind it produces noise, and noise teaches people to pass
`--force`, which costs every rule at once.
