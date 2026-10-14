# The design doc template

Copy this to `DESIGN.md` at your repo root and fill it in. There is a
completed one in [`examples/meridian/DESIGN.md`](../examples/meridian/DESIGN.md)
if you would rather read a filled-in version first.

## Before you start: what this document is for

It is not a style guide and it is not documentation of what the app currently
looks like. **It is the record of decisions that have already been argued,
written so the argument does not have to happen again.**

That purpose has three consequences that shape everything below:

1. **Every section records a decision, not a description.** "Buttons have an
   8px radius" is a description and rots the moment someone ships a 6px
   button. "One radius, 8px, because five were in use and a card that shares
   a corner with its neighbour reads as one plate" is a decision, and a 6px
   button now visibly contradicts something.

2. **The rejected alternative is part of the decision.** Write down what you
   considered and why you did not do it. Without it, the next person — or the
   next agent — re-proposes it every time, and you re-argue it every time.

3. **Anything a machine can check belongs in the checker too.** A rule that
   only lives in prose is a rule that drifts. See
   [`enforce/`](../enforce/). The split is: the checker holds geometry,
   colour, punctuation and measurable floors; this document holds composition,
   register and intent. Do not try to automate taste, and do not leave a hex
   code to prose.

**Write it in the first person and name real dates and real measurements.**
"Measured 2026-09-09 at 2.37:1 on the tint plate" is usable. "Insufficient
contrast" is not. The specificity is what makes it survive a disagreement.

---

Delete the italic prompts as you fill each section in. Aim for seven or more
substantive sections; fewer usually means you are describing rather than
deciding.

---

# Design

## Colour strategy

*One paragraph: what the palette is doing, before any values. What carries
emphasis, what stays neutral, what is forbidden from carrying meaning. Someone
should be able to read this paragraph alone and reject a wrong proposal.*

## Palette

*The values, grouped by job rather than by hue.*

### Primary accent

*The one colour that carries brand and interactive duty. State the share of
emphasised surface it should carry — a number, even a rough one, because
"used sparingly" is unenforceable and "30 to 60% of emphasised surface" is
not.*

### Fills and surfaces

*The grounds. If your page is never pure white (or never pure black), say so
here and say what it is instead.*

### Neutrals

*Which grey ramp, and the measured contrast of each step you actually use
against each ground you actually use. This table is where contrast arguments
go to die. Note the step that fails and what to use instead.*

### Signal colours

*Status only. State explicitly that these never carry brand or decoration,
or they will.*

### Retired / banned

*The graveyard, and it is load-bearing. Every colour you have removed, with
its hex, so the checker can grep for it and so nobody reintroduces last
year's primary as a "nice accent". Include the hexes, not just the names — a
literal walks straight past a check that greps colour names.*

## Typography

### Families

*Which faces, their licence, and what each one is for. If the faces are
locked brand identity, say so here — reference material will argue for a
custom face and you want a standing answer.*

### Scale and tracking

*The ramp, with line height and tracking per step. If a size is deliberately
absent from the ramp because it is measured against something else (a logo
lockup against its mark's stroke, say), record that here or it will read as
drift forever.*

### Global rules

*Casing, widows, orphans, hyphenation, numerals, the maximum measure. The
boring ones that nobody remembers and everybody breaks.*

### Emphasis

*How emphasis is expressed, and how it is not. If gradient text is banned,
this is where it is banned.*

## Voice

*See [`voice.md`](./voice.md) for the two rules I carry into every project
and why they work. Put your own standing copy rules here — the ones that
apply to every string a visitor can read, not per-page tone notes.*

## States

*See [`states.md`](./states.md), which is the longest argument in this pack
and the one I would read first if the thing being built is an application
rather than a page.*

*What goes here: the four branches every surface that reads something has
(loading, ready and empty, ready and full, failed), what each one is allowed
to claim, and the invariant that keeps them apart. Mine is one line:*
**branch on `ready`, not on `not failed`.**

*Then your destructive-action rule: which actions take a confirmation, which
take an undo window, and the test for choosing. Mine is whether the action
reaches past the person clicking.*

*This is the section a generated interface is most likely to be missing
entirely, and the one whose absence does real damage rather than merely
looking generic. An empty state is a claim, and a failed read that renders it
is a lie told in the voice the product reserves for true things.*

## Spacing rhythm

*The base unit, the section rhythm, and the two or three spacings that are
allowed to break it. A rhythm with no exceptions listed is a rhythm with
undocumented exceptions.*

*If you can, measure it rather than declaring it: count the uses of each step
across your source and write the counts in. A census tells you what the
default actually is, which is usually not the step you would have named, and
it turns "use the scale" into a table somebody can check themselves against.
It also surfaces the real property worth documenting. On one app the
half-steps below 12px are used heavily and that is not sloppiness: the type
ramp there runs 10 to 15px, and a scale that jumps 8 to 16 has nothing to
offer a 30px control. Above 12 the steps are 4px apart and the halves
disappear, which is the tell that the two halves of the scale are doing
different jobs.*

## Breakpoints, and what moves at each

*The table, and a count per breakpoint if you can measure one. Two things
belong here that are easy to leave as behaviour spread across files:*

*First, whether you are using your framework's stock widths. Mine are
unmodified and should stay that way: a custom set means every reader who
already knows the framework has to look them up, and nothing I have built has
needed a width the defaults do not offer. If you did change them, this is
where the argument goes.*

*Second, and this is the one worth the section: say whether any of your
breakpoints is **behavioural rather than layout**. On one app, one of them is
not a size at all, it is which application mounts: below it the product
renders a different shell, with a tab bar and an index/detail push, decided by
a live media-query hook rather than by a class. Nothing about that is
expressible as a responsive utility, so if it is not written down here it is
not written down anywhere.*

*And the trap, which is worth stating even if nothing in your app does it
yet: **a pointer is not a width.** A touch target is a property of the
pointer, not of the viewport. A 1280px touchscreen laptop takes the desktop
layout and still needs a 44px target, and a phone in a desktop browser's
device toolbar has a fine pointer at 390px. If your framework has a
coarse-pointer variant, it is never a substitute for a breakpoint and a
breakpoint is never a substitute for it.*

## Elevation

*What shadow means, if anything. Many good systems use almost none.*

### One card, one radius

*State the radius and say how many were in use before you decided. The count
is the argument.*

### Where emphasis lives

*Outline or shadow — pick one and say why. Doing both is how a card ends up
looking like a 2014 dashboard.*

## Motion

*Durations, easings, and what is allowed to move. Then the harder half: what
must not move, and the reduced-motion behaviour. Name the tokens and say
which file defines them.*

## Page substrate

*The rules that make a page feel like one surface rather than a stack of
boxes. Mine are: the page is never pure white; every plate carries a
substrate; sections feather rather than butt. Yours will differ — but this
section is the one that most separates a designed page from an assembled one,
so do not skip it.*

### The tonal arc

*How tone moves from the top of a page to the bottom. A page where every
section is the same weight reads as a list. State the arc and what each
position is for.*

## Layout patterns

### Standard section structure

*The default. What a section is made of when nobody is being clever.*

### Established splits

*Your sanctioned asymmetric layouts, with their ratios. Naming them is what
stops a fourteenth variant.*

### Banned layout patterns

*The specific shapes you never want again, each with a sentence on why. This
section is the single highest-value part of the document for working with an
agent, because a model will otherwise reach for all of them. Mine includes
side-stripe borders, hard rules between sections, and dark used as a section
rather than as an object.*

## Components

*Not an inventory — the components whose design carries a decision that is
not obvious from the code. One subsection each: what it is for, what it must
not become, which file owns it.*

## Imagery and illustration

*What kind of image belongs here, what never does, and how illustration is
produced. If your illustrations are coded rather than drawn, say so and say
where the source is.*

## What not to take from reference material

*The standing answer to "but this other site does X". See
[`references.md`](./references.md). List the specific things reference sites
will keep arguing for and that you have already rejected.*

## Traps

*The things that look right and are not. This section is cheap to write and
it is the one that saves the most time, because every entry is a bug somebody
has already spent an afternoon on.*

*What qualifies: a failure whose symptom points away from its cause. Mine,
from one app, are all of this shape:*

- *A display face that is **opt-in** rather than set on the heading elements,
  so a heading that forgets to apply it renders in the body face and looks
  almost right. "Looks almost right" is the whole category.*
- *A brand mark whose stroke weight is in viewBox units, so changing the
  mark's height silently stops its stroke matching the type beside it.*
- *A `Button` component that is **not this product's button**: it has no
  page consumers, it compiles against a different token layer, and its
  default variant comes out near-black. Somebody will find it before they
  find the real one, because it has the obvious name.*
- *A build-tool line excluding a directory from the stylesheet, so anything
  rendered from that directory comes out as unstyled HTML.*

*Write yours as you hit them. A trap discovered and not written down will be
discovered again, by you, in four months.*

## Verification

*The commands. Not a description of them, the commands themselves, so that
"check before committing" is a thing somebody can paste.*

```bash
# types, tests, lint, and the design checker
node enforce/design-check.mjs
```

*Then the rule that makes the section worth having: **anything in this
document that a machine can check belongs in the checker, and the checker
belongs in CI.** A rule that only lives here is a rule that drifts. See
[`../enforce/`](../enforce/) for what is holdable; the split is that the
checker takes geometry, colour, punctuation and measurable floors, and this
document keeps composition, register and intent.*

*If your pipeline has a step that is easy to forget and expensive to miss,
name it here too. Mine is that a green local run is not a green CI run, for a
reason specific to that repo's environment handling, and writing that down
once saved a fortnight of red builds.*

## The agent quick reference

*Put this last, and write it only once the document above is finished.*

*It is a compressed block holding everything needed to build a correct
surface without reading the whole document: the palette as values, the type
ramp as a table, the geometry classes, the motion tokens, the copy rules in
one line each, and the commands. Half a page, no reasoning.*

*Then the sentence that makes it safe, which is not optional:*

> **If this block and the body of the document disagree, the body wins.** It
> carries the reasoning, and a compressed rule that has lost its reason is
> how a design system decays.

*Why this section exists at all: a long design doc is the right artefact for
a person and a difficult one for an agent, which will read what fits and
summarise the rest. Writing the summary **yourself** means the compression is
your judgement rather than a model's, and the pointer back to the body means
the compression never becomes the authority.*

*The failure to avoid is letting it drift. It is a derived artefact and it
rots the moment the body changes, which is the same argument this pack makes
about prose generally. Re-read it whenever you change a decision above, and
if you can, derive it mechanically instead.*
