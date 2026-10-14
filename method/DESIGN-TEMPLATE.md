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

## Spacing rhythm

*The base unit, the section rhythm, and the two or three spacings that are
allowed to break it. A rhythm with no exceptions listed is a rhythm with
undocumented exceptions.*

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
