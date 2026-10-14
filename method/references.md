# How to use a reference without producing a copy

This is the part most people get wrong, and it is the part that produces the
look everyone calls AI slop. The slop is not caused by a model having bad
taste. It is caused by a reference being transplanted instead of read.

## The one distinction that matters

Every reference site contains two separable things, and almost all bad
outcomes come from failing to separate them.

**The structure** — how the page is ordered, what it groups, what question it
answers in what order, where it puts the thing you were looking for. This is
an argument about information, and it is usually transferable, because
information architecture is not anybody's brand.

**The device** — the marker highlight on running text, the hand-drawn dog,
the dark closing slab, the cream ground, the three-colour accent set. This
carries the other brand's voice, and it is usually *not* transferable. Lifted
across, it arrives as costume. You can always tell: the page suddenly has two
opinions and no spine.

The failure mode is a single sentence: **people copy the device because it is
the visible part, and ignore the structure because it is the valuable part.**

So write every reference down in two halves. Mine look like this:

> **Transferable:** the pricing block sitting mid-page as a plain two-card
> comparison rather than a destination, and the confidence of the whitespace
> around it.
>
> **Not transferable:** the warm cream palette. I am cool-toned over a blue
> accent. Cream is a different brand.

## A reference is most useful as a thing to react against

On one project I was handed eight reference sites. Four of them I recorded
primarily as **rejections** — and that was not a failure of the references. It
is what the file is for.

Writing down *why* a good page is wrong for you is worth more than writing
down why a page you will copy is right. The rejection is where your own
system gets specified. Here is one of mine, near-verbatim, about a 404 page
that is genuinely well made:

> This one conflicts with my design doc on three counts, and I would not
> build it as shown. Recording why, because the reference is a good page and
> the reasons are specific rather than squeamish:
>
> - **"Ruh roh!" is the banned voice.** My register rule is plain, never
>   cute. Three clauses of apology for a missing URL.
> - **No figure on a 404.** Nothing on that page is worth the weight of a
>   person.
> - **My current 404 already has a better idea.** It renders the command
>   palette's surface with nothing found in it, which is what a 404 *is* on a
>   product whose headline feature is that everything is one keystroke away.
>   That idea is derived from my own product. A dog cannot beat it.
>
> **What genuinely transfers:** the two escape links are *specific*, not a
> "go home" button. Mine should name the two or three places a lost visitor
> actually wanted. That is worth doing.

Note the shape. Three rejections, each naming the rule it violates. One
transfer, small and concrete. That entry took ten minutes and permanently
settled an argument that would otherwise recur every redesign.

## Read three of them at the asset level, not by eye

Everything above is about judging a reference. This is about getting more out
of one than looking at it gives you, and it is the technique that produced
most of the notes I actually reused: open the stylesheet and the asset
directory rather than the page.

Three sites read that way contributed more than the eight read by eye, and
what they contributed was specific enough to build from. One had 48
per-application icons, each with its own colour identity rather than a
monochrome stroke glyph, and hand-drawn arrows used as marketing annotation.
One had a hero that **dissolves** into the page rather than ending at an
edge, mask-image feathering on nearly everything, and a button built from
five layers including an inset top highlight and an inset bottom lip. One had
a dot-grid substrate, a body tone that is not white, and a per-child stagger
delay set as a custom property.

You cannot see any of those by eye. You can see *that* the page feels good.
The asset directory tells you what it is made of.

## What actually makes a page feel designed

Here is the lesson from all three, and it is the most useful single sentence
in this file:

> Their pages do not feel designed because of any one effect. They feel
> designed because they ship **authored artwork and texture** — icons
> somebody drew, arrows somebody sketched, backgrounds somebody composed —
> rather than library glyphs on flat fills.

That is the positive form of everything else in this pack. The bans tell you
what not to reach for; this tells you what the absence is actually made of. A
generated page is not identifiable by any single wrong choice. It is
identifiable because every element in it came off a shelf, so nothing in it
is evidence that a person made a decision.

Which has a practical consequence for how you spend effort. One drawn thing
beats four polished ones. A single piece of authored artwork — a real
illustration, a hand-drawn annotation, an icon set with its own logic,
coded-not-drawn scenery with its source in the repo — does more for a page
than another pass of spacing refinement, and it is the thing a model cannot
produce for you by default. So if you have an afternoon, draw something and
put it in [`imagery`](./DESIGN-TEMPLATE.md).

**The honest caveat:** texture is also the easiest thing to overdo, and this
is where the device rule comes straight back. Authored artwork works when it
comes from *your* product's own idea. Derive it from what the product is. A
texture borrowed because a reference had one is a device, and it arrives as
costume like every other device.

## The standing rule

When something is missing and a reference has it:

> Derive it from the design doc and the elements already on the page. Do not
> transplant a reference site's device.

That rule exists because transplanting has been tried and has failed. The
reason it fails is worth stating plainly: a device works on the original site
because *everything else on that site supports it*. Lifted alone, it has no
support, so it reads as decoration. And decoration is precisely the thing a
reader identifies as generated.

## What this means when you are working with an agent

An agent given a screenshot will reproduce the device, every time, because
the device is what a screenshot is mostly made of. So do not hand over a
screenshot and a wish. Hand over:

1. Your design doc, as the governing document.
2. The reference, explicitly marked **subordinate** to it.
3. The two-column split — transferable structure, non-transferable device —
   already done by you, because that split is a judgement call and it is the
   one part of this you should not delegate.

The sentence I put at the top of my own reference files:

> Read `DESIGN.md` first, and read this file as subordinate to it.

## On storing the references themselves

Keep the notes in the repo. **Do not commit the screenshots.** They are
someone else's copyrighted pages, and a public repo full of competitors'
screenshots is a liability with no upside — the notes are the asset, and a
note that names the site and the page is as useful as the image. Link out
instead, and record the date you looked, because sites change and a note
about a page that no longer exists should say so rather than confuse the next
reader.

If you need them locally for a working session, put them in a gitignored
directory and write the notes as you go, because in three weeks the image
will mean nothing without them.
