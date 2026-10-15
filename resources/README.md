# Resources

Links, not files. Deliberately.

Vendoring an icon set or a font into a pack like this means re-checking a
licence every time it updates, shipping megabytes nobody asked for, and
guessing which version you want. A link never carries a licence you have to
re-verify. **Every entry below names its licence** — check it yourself before
shipping, because licences change and this file is a snapshot taken
2026-10-14.

The only assets actually vendored in this repo are the two typefaces in
[`../pipeline/fonts/`](../pipeline/fonts/), both SIL OFL, because a
self-hosted webfont is a build input rather than a reference.

---

## Icons

One set per project. Mixing two icon sets is the most visible form of the
two-products problem, and it is instantly legible to a reader even when they
cannot say why.

| Set | Licence | Notes |
|---|---|---|
| [Lucide](https://lucide.dev) | ISC | The default I reach for. ~1,500 icons, consistent 24px grid, stroke width is a prop. Fork of Feather, actively maintained. |
| [Phosphor](https://phosphoricons.com) | MIT | Six weights including duotone. Pick a weight and never change it. |
| [Radix Icons](https://www.radix-ui.com/icons) | MIT | 15px grid, built for dense UI. Small set on purpose. |
| [Heroicons](https://heroicons.com) | MIT | Outline and solid at 24/20/16. Pairs with Tailwind defaults. |
| [Tabler Icons](https://tabler.io/icons) | MIT | ~5,800 icons. Reach for it when a niche glyph is genuinely missing elsewhere. |
| [Material Symbols](https://fonts.google.com/icons) | Apache-2.0 | Variable axes for weight, fill and optical size. |
| [Simple Icons](https://simpleicons.org) | CC0-1.0 | Brand marks only. CC0 covers the *file*, not the trademark — a brand's own guidelines still govern its mark. |

**Set your stroke width and sizes once and check them.** The `iconScale` rule
in [`../enforce/`](../enforce/) exists because one real project had twelve
icon sizes and nine stroke widths in use, none of them chosen.

## Typefaces

| Source | Licence | Notes |
|---|---|---|
| [Fontsource](https://fontsource.org) | per-font (mostly OFL) | Self-hosting as npm packages, with subsetting. How I install fonts. |
| [Google Fonts](https://fonts.google.com) | mostly OFL | Serving from `fonts.googleapis.com` is a third-party request; self-host for privacy and for the render-blocking cost. |
| [Inter](https://rsms.me/inter/) | SIL OFL 1.1 | Vendored here. The safe default for UI at small sizes. |
| [Outfit](https://github.com/Outfitio/Outfit-Fonts) | SIL OFL 1.1 | Vendored here. Geometric, for display weights. |
| [Instrument Sans / Serif](https://github.com/Instrument/instrument-sans) | SIL OFL 1.1 | A distinctive pairing that has not yet been used everywhere. |
| [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | SIL OFL 1.1 | Code and tabular numerals. |
| [Geist](https://vercel.com/font) | SIL OFL 1.1 | Sans and mono. |
| [The League of Moveable Type](https://www.theleagueofmoveabletype.com) | SIL OFL 1.1 | Display faces with character, free to embed. |

**Never ship a commercial face you have not licensed for web embedding.** A
desktop licence is not a web licence, and the foundries do check. If a
reference argues for a face you cannot afford, the design doc's answer should
already be no.

## Illustration

The honest position: **coded SVG beats a downloaded illustration set** for
product work, because a set gives you someone else's visual grammar and you
will mix it with your own within a month. See the illustration section of the
[worked example](../examples/meridian/DESIGN.md) for what a single grammar
looks like written down.

When you do want a set, pick one and commit:

| Source | Licence | Notes |
|---|---|---|
| [Humaaans](https://www.humaaans.com) | CC BY 4.0 | Mix-and-match figures, recolourable. Attribution required. |
| [Open Peeps](https://www.openpeeps.com) | CC0-1.0 | Hand-drawn figures. No attribution needed. |
| [unDraw](https://undraw.co) | own licence, permissive | The most recognisable set on the internet. Using it unmodified reads as a template. |
| [Reshot Illustrations](https://www.reshot.com/free-vector-icons/) | own free licence | Read the terms; they differ per asset. |
| [Blush](https://blush.design) | mixed, some paid | Collections by individual illustrators. Licence varies per collection. |
| [Lukasz Adam](https://lukaszadam.com/illustrations) | CC0 / MIT | Small, less-used sets. |

## Photography

| Source | Licence | Notes |
|---|---|---|
| [Unsplash](https://unsplash.com) | Unsplash licence | Free to use, cannot be resold as stock. No model release — do not imply a person endorses anything. |
| [Pexels](https://www.pexels.com) | Pexels licence | Same caution. |

**Stock photography of people is a small lie in most product UI.** If the
screen is about a user's own team, a photograph of a different team is read as
exactly what it is.

## Colour and contrast

| Tool | Notes |
|---|---|
| [`pipeline/contrast.mjs`](../pipeline/contrast.mjs) | In this repo. Every foreground against every ground it is for, which is the test that catches the conditional failures. |
| [APCA](https://git.apcacontrast.com) | The contrast model likely to replace WCAG 2's ratio. Worth understanding; WCAG 2.2 is still what you are held to. |
| [Leonardo](https://leonardocolor.io) | Generates ramps to target contrast ratios rather than by eye. |
| [OKLCH picker](https://oklch.com) | Perceptually uniform colour space. Use it to build a ramp with even steps. |
| [Who Can Use](https://www.whocanuse.com) | A pair's ratio under different kinds of colour vision. |

## Design tokens

| Resource | Notes |
|---|---|
| [Design Tokens Format Module](https://tr.designtokens.org/format/) | The `$value` / `$type` spec. What [`pipeline/derive.mjs`](../pipeline/derive.mjs) emits. |
| [Style Dictionary](https://styledictionary.com) | Tokens to any platform. Heavier than most projects need. |
| [Open Props](https://open-props.style) | A ready-made set of CSS custom properties, worth reading as a naming reference even if unused. |

## Reference galleries

Read [`../method/references.md`](../method/references.md) before using any of
these, because browsing galleries is exactly how device-transplanting starts.

| Source | Notes |
|---|---|
| [Godly](https://godly.website) | Curated, genuinely high bar. |
| [Land-book](https://land-book.com) | Large, searchable by industry. |
| [Mobbin](https://mobbin.com) | Real product flows, screen by screen. The best source for *structure* rather than device. |
| [SaaS Interface](https://saasinterface.com) | Product UI patterns. |
| [Refactoring UI](https://www.refactoringui.com) | Not a gallery. The best single book on why interfaces look amateur, and cheap. |
| [Web Interface Handbook](https://www.webinterfacehandbook.com) | Free, practical. |

## Accessibility

| Resource | Notes |
|---|---|
| [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/) | The actual criteria. Search it rather than reading it. |
| [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/) | The keyboard behaviour for every widget you are about to build wrong. |
| [axe DevTools](https://www.deque.com/axe/devtools/) | Catches the mechanical half. |
| [Inclusive Components](https://inclusive-components.design) | Per-component depth, free to read. |

## Motion

| Resource | Notes |
|---|---|
| [Easings reference](https://easings.net) | Curves with names. |
| [Motion](https://motion.dev) | MIT. The animation library I use for React. |
| [`prefers-reduced-motion` guide](https://web.dev/articles/prefers-reduced-motion) | Honour it. It is not optional, and it is one media query. |

## Related open-source work

Worth knowing about, and in one case worth reading closely — it is where this
repo's reference library comes from.

| Project | Licence | Notes |
|---|---|---|
| [nexu-io/open-design](https://github.com/nexu-io/open-design) | Apache-2.0 | **The upstream for [`../refs/`](../refs/).** See [`../NOTICE`](../NOTICE). |
| [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | MIT | Upstream of several packages in that catalog. |
| [bergside/awesome-design-skills](https://github.com/bergside/awesome-design-skills) | see repo | Normalised design-skill systems. |
| [anthropics/skills](https://github.com/anthropics/skills) | see repo | Includes a `frontend-design` skill. Complementary to this one: it is prose guidance, this adds the enforcement layer. |
| [shadcn/ui](https://ui.shadcn.com) | MIT | Components you own rather than install. |
| [Radix Primitives](https://www.radix-ui.com/primitives) | MIT | Unstyled, accessible behaviour. |
