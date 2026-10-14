# Design

Meridian is an invented product, written to show what a filled-in
[`DESIGN-TEMPLATE.md`](../../method/DESIGN-TEMPLATE.md) looks like. Every
contrast ratio below is really measured — run
`node pipeline/contrast.mjs examples/meridian/palette.json` from the repo
root to reproduce the table. The numbers are honest even though the brand is
not.

Meridian is a shift-scheduling tool for independent clinics. It is read by
practice managers between patients, often on a phone, usually in a hurry.
That sentence governs everything below.

## Colour strategy

**One accent, one ground, and dark used as an object rather than a mode.**

A practice manager opens Meridian to answer one question: is tomorrow
covered. So the palette has exactly one job, which is to make the answer
findable in under a second. A single deep green carries every interactive and
emphasised surface. Everything else is a warm neutral.

The thing this strategy forbids is the one worth stating: **no second
accent**. Not for "secondary" actions, not for a chart series, not for a
badge. The moment two saturated colours share a screen, neither of them means
"look here", and the question takes two seconds instead of one.

Green specifically, and not blue, because every clinical system these users
already have open is blue, and Meridian needs to be distinguishable at a
glance in a taskbar.

## Palette

### Primary accent

| Token | Value | Use |
|---|---|---|
| `--accent` | `#1f5f4e` | Interactive surfaces, emphasised type, the covered state |
| `--accent-700` | `#174a3d` | Hover and pressed only |

`--accent` carries **30 to 60% of emphasised surface** on any given screen.
Below 30% the page reads as unstyled; above 60% it reads as a marketing page,
which is wrong for a tool somebody uses forty times a day.

White on `--accent` measures **7.49:1**, so accent-ground buttons take white
type and need no exception.

### Fills and surfaces

| Token | Value | Use |
|---|---|---|
| `--paper` | `#fcfcfa` | The page. Not `#ffffff`. |
| `--tint` | `#f3f4ef` | Plates: any section that needs to separate from the page |
| `--ink` | `#15161a` | Dark *objects* only, never a section |

**The page is never pure white.** `#fcfcfa` is a half-step warm, and the
reason is practical rather than aesthetic: a pure white page beside a clinical
system's pure white page makes both look broken, and on a cheap monitor at
10pm it glares. A *card* may be white. The page may not.

**Dark is an object, not a mode and not a section.** `--ink` is the colour of
a specific thing — the tomorrow-at-a-glance panel — and it is dark because
that panel is the one surface you look at rather than read. A page that
inverts for a whole section reads as two pages stapled together, so the page
never inverts, and that includes the footer.

### Neutrals

Measured against both grounds, because a ramp that is only measured against
white is a ramp with a trap in it:

| Token | Value | On `--paper` | On `--tint` |
|---|---|---|---|
| `--fg` | `#111318` | 18.09:1 | 16.81:1 |
| `--fg-muted` | `#3d424d` | 9.81:1 | 9.11:1 |
| `--fg-subtle` | `#6b7280` | 4.71:1 | **4.37:1** |
| — | `#9aa1ad` | 2.53:1 | 2.35:1 |

🔴 **`--fg-subtle` passes on paper and fails on tint.** 4.71:1 clears the
4.5:1 floor on the page and 4.37:1 does not clear it on a plate. This is the
single most useful thing measuring both grounds taught me, and it is invisible
if you only ever test the page.

So the rule is conditional, and the checker cannot express it: **`--fg-subtle`
is for type on `--paper` only. On a tint plate, step up to `--fg-muted`.**
Written here because judgement is needed; a blanket ban would cost a usable
colour on the surface where it works.

`#9aa1ad` has no token on purpose. At 2.53:1 it is not type anywhere, and
giving it a name invites its use. Decorative glyphs that need it carry it as a
one-off with `aria-hidden` on the same element, which is both the exemption
and the honest accessibility statement.

### Signal colours

| Token | Value | Means |
|---|---|---|
| `--signal-short` | `#a8432f` | A shift is uncovered |
| `--signal-pending` | `#8a6318` | Awaiting confirmation |

**These never carry brand, decoration or emphasis.** `--signal-short` is the
only red in the product, and it means exactly one thing: somebody is not
covered. Used on a decorative badge it would cost a practice manager a
genuine scare, and after the second false alarm it would cost them the real
one.

### Retired / banned

Keep the graveyard. The checker greps it.

| Retired | Value | Why |
|---|---|---|
| teal | `#14b8a6` | The original accent. Too close to `--accent` to coexist and too light for white type. |
| indigo | `#4f46e5` | A "secondary" accent that lasted three weeks. See the one-accent rule. |
| violet | `#7c3aed` | Part of a gradient that is also retired. |

List the hexes, not just the names. A literal walks straight past a check that
greps colour names, which is how a retired pair survived four sweeps on a
real project of mine.

## Typography

### Families

**Inter for everything.** One face, licensed under the SIL Open Font License,
self-hosted as woff2 in [`../../pipeline/fonts/`](../../pipeline/fonts/).

Reference material will argue for a display face. The standing answer is no:
Meridian has no page long enough to need a second voice, and a face loaded for
one heading is a face loaded on every route.

### Scale and tracking

| Token | Size | Line height | Tracking |
|---|---|---|---|
| `text-2xs` | 11px | 16px | `0.01em` |
| `text-xs` | 13px | 18px | `0` |
| `text-sm` | 14px | 20px | `0` |
| `text-base` | 15px | 24px | `-0.005em` |
| `text-lg` | 18px | 26px | `-0.01em` |
| `text-xl` | 20px | 28px | `-0.015em` |
| `text-2xl` | 24px | 32px | `-0.02em` |
| `text-3xl` | 28px | 36px | `-0.025em` |

15px body, not 16px, because the densest screen is a week grid with seven
columns on a laptop, and 16px costs a column.

**21px is absent from the ramp on purpose.** It is the wordmark's size,
measured against the mark's stroke weight, and the pair breaks if it moves.
Recorded here so it does not read as drift forever.

### Global rules

- Sentence case everywhere, including buttons and headings. Title Case reads
  as marketing.
- No hyphenation. A broken word in a shift name is worse than a short line.
- Tabular numerals in every time, date and count. A column of times that
  shifts by a pixel per row is unreadable at a glance.
- Maximum measure 68 characters on prose. Nothing in the product is prose
  except the empty states, and they are the thing people actually read.

### Emphasis

Weight, then size, then colour, in that order. Never underline for emphasis;
underline means link.

**Gradient text is banned.** `background-clip: text` makes contrast
unmeasurable, which means it cannot be checked, which means it drifts
silently. Enforced as `gradient-text` in the checker.

## Voice

Both standing rules from [`voice.md`](../../method/voice.md) apply in full:
no em dashes anywhere a visitor can read, and one register.

Meridian's register is **plain, never clinical and never cute**. The reader is
a practice manager, not a clinician and not a consumer:

| Don't write | Write |
|---|---|
| "resource allocation conflict" | "two people booked for the same shift" |
| "Oops! Something went wrong" | "That didn't save. Your changes are still here." |
| "sync in progress", "eventually consistent" | "Saving" / "Saved" |
| "rota entity" | "shift" |
| "deprecate a template" | "stop offering this pattern" |

The exception: the data-processing agreement, where "data subject" and
"processor" are defined terms doing real work. Precision beats warmth in a
document somebody signs.

## Spacing rhythm

4px base. Sections step on 8: `8 / 16 / 24 / 32 / 48 / 64`.

Two sanctioned exceptions, both measured rather than felt:

- **6px** between a label and its field. 8 breaks the pair; 4 collides the
  descenders.
- **2px** between stacked shift chips in the week grid, which is a hairline
  gap holding seven columns in a viewport that does not have room for 4.

A rhythm with no exceptions listed is a rhythm with undocumented exceptions.

## Elevation

**Almost none.** One shadow token, `--shadow-pop`, for things that genuinely
float above the page: the shift editor popover and the date picker. Nothing
else in the product casts a shadow.

### One card, one radius

**8px. One value.** Five were in use before this decision — 4, 6, 8, 12 and a
`rounded-xl` — and the visible cost was that a card sharing an edge with its
neighbour read as two unrelated objects instead of one plate.

The exception is the avatar, which is a circle, and a circle is not a radius
decision.

### Where emphasis lives

**On the outline, not the shadow.** An emphasised card gains
`border-color: --accent`; it does not gain a shadow. Doing both is how a card
ends up looking like a 2014 dashboard, and a shadow on a dense grid multiplies
into visual noise seven columns wide.

## Motion

| Token | Value | For |
|---|---|---|
| `--ease-out` | `cubic-bezier(.2,.8,.25,1)` | Anything entering |
| `--ease-in` | `cubic-bezier(.4,0,.7,.2)` | Anything leaving |
| `--dur-fast` | `120ms` | State change on a control |
| `--dur-pop` | `180ms` | A popover or sheet |

Defined in `src/styles/tokens.css` and nowhere else.

**What must not move:** the week grid. Rows do not animate in, cells do not
stagger, a shift chip does not slide to its new slot. Somebody is reading this
grid to find a gap, and motion in a grid you are scanning costs you the scan.
A changed cell crossfades its fill over `--dur-fast` and that is all.

**Reduced motion:** every transition above collapses to `0ms` under
`prefers-reduced-motion: reduce`. Opacity crossfades stay, because they carry
state rather than movement.

## Page substrate

Three rules that make a page read as one surface:

1. **The page is never pure white.** `--paper`, always.
2. **Every plate carries a substrate.** A section that separates from the page
   does it with `--tint`, not with a border and not with a shadow.
3. **Sections feather, they do not butt.** A hard `border-top` between two
   sections is banned. Plates meet the page through a 48px gradient seam, the
   `<Seam>` component.

Rules 1 and 3 are enforced as `plate` and `seam` in the checker, scoped to
`<section>` elements — because a *card* may be white and a divider *inside* a
card is fine. That distinction is why those rules read an element's open tag
rather than grepping the file.

### The tonal arc

A screen moves: **paper → tint → ink object → paper.**

The dark object sits about two thirds down, and it is the one surface carrying
the answer to "is tomorrow covered". The arc exists so that panel is the
visual destination of the page rather than one more card in a stack. A screen
where every section weighs the same reads as a list, and a list has no answer
in it.

## Layout patterns

### Standard section structure

A 64px top pad, a `text-2xl` heading, optional `text-sm --fg-muted` sub, then
content. No card around the section. No icon beside the heading.

### Established splits

Two, and only two:

- **7 / 5** — content against a persistent summary rail. The default.
- **8 / 4** — content against a filter column, on the roster screens only.

Naming them is what stops a fourteenth variant.

### Banned layout patterns

The highest-value section in this document for agent work, because a model
will reach for every one of these:

- **Side-stripe borders** (`border-l-4` and friends). Never intentional
  design, only leftover scaffolding. Checked as `layout`.
- **Hard rules between sections.** Use `<Seam>`. Checked as `seam`.
- **Dark as a section.** Dark is an object. A full-width dark band pulls the
  whole page into a second theme.
- **The three-card feature row.** Three cards with an icon, a bold line and
  two lines of grey. It is the single most recognisable generated layout there
  is, it says nothing, and it is banned outright.
- **A card grid where a table is meant.** Shifts are tabular data. A grid of
  cards makes them unscannable and unsortable.
- **Centred body copy.** Headings may centre. Paragraphs never do.

## Components

Only the ones carrying a decision that is not obvious from the code.

### `<Seam>` — `src/components/seam.tsx`

A 48px gradient from `--tint` to `--paper`. It exists so rule 3 above has an
implementation, and it takes no props: a seam with options is a border with
extra steps.

### `<CoverPanel>` — `src/features/today/cover-panel.tsx`

The `--ink` object. **This is the only dark surface in the product**, and its
job is to answer one question at a glance. What it must not become: a
dashboard. If a second number lands in it, the first one stops being an
answer.

### `<ShiftChip>` — `src/features/roster/shift-chip.tsx`

Carries `--signal-short` when uncovered. The only component allowed to use
that token.

## Imagery and illustration

**No photography, no stock illustration, no figures.** A clinic's own staff
are the subject of every screen, and a stock photograph of different staff is
a small lie that users notice immediately.

Illustration is coded SVG, in `src/components/illustration/`, and there is one
visual grammar: single-weight 1.75px strokes, `--fg-muted`, no fill, no
gradient. Used in empty states only, which on this product means four files.

A second illustration language on the same product reads as two products.

## What not to take from reference material

Read [`references.md`](../../method/references.md) for the method. The
standing rejections, which reference sites keep arguing for:

- **A second accent.** Nothing justifies it. See the colour strategy.
- **A display face.** See typography.
- **A dark closing CTA slab.** The page never inverts, and that includes the
  footer.
- **A testimonial wall.** Meridian has eleven customers. A static wall shows
  the whole set at once and reads as everything there is.
- **Hand-drawn illustration.** The grammar above is flat and stroked. Mixing
  is the two-products problem.
- **Gradient anything.** Not text, not buttons, not backgrounds.
