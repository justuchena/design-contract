# Design system references

152 design-system packages, lifted from
[`nexu-io/open-design`](https://github.com/nexu-io/open-design) (Apache-2.0)
on 2026-08-17. See [`../NOTICE`](../NOTICE) for the full attribution chain.

Kept as **reading references**, which is a narrower claim than it sounds and
the most important thing on this page.

## Read this first: what these are and are not

Each package's `source/evidence.md` says it plainly:

> derived from the curated Open Design bundled fixture. It does not claim a
> fresh crawl of the original upstream brand repository or website.

So these are **somebody's written interpretation** of each design language,
not a verified extraction from a live site. Two consequences:

- **Do not trust a specific hex value** as being literally that company's
  current token. If you need the real value, open the real site.
- **Do trust the structure and the rigour.** The value here is watching how a
  design contract gets *written*: what gets measured, what gets named, what
  gets forbidden, what gets explicitly retired. That transfers regardless of
  whether `#533afd` is still current.

Read them the way you would read somebody else's design doc before writing
your own — for the shape of the argument, not the values.

And read [`../method/references.md`](../method/references.md) before you
build anything from one. The rule there governs this whole directory:
**borrow structure, never transplant a device.**

## Package shape

```
<slug>/
├── DESIGN.md                  the prose contract, ~9 sections
├── tokens.css                 compiled semantic tokens
├── tailwind-v4.css            the same, as a Tailwind v4 @theme block
├── design-tokens.json         machine-readable, Design Tokens Format
├── components.html            rendered component fixtures
├── kit.html / kit.dark.html   the full kit, both themes
├── landing.html · deck.html · email.html · poster.html · newsletter.html · form.html
├── preview/                   colors.html · typography.html · spacing.html
├── manifest.json              catalog metadata
└── source/evidence.md         provenance
```

**Open `preview/colors.html` and `components.html` in a browser.** That is by
far the fastest way to judge a package — much faster than reading the
Markdown, and the rendered `kit.html` shows you in one screen whether the
system actually coheres.

23 packages also carry `DESIGN.md` translations (`DESIGN-zh.md`,
`DESIGN-ru.md`, and others).

## The two things worth stealing from almost any of these

Whatever your own design doc already does well, most hand-written ones are
missing both of these:

1. **`tokens.css` / `design-tokens.json`** — the palette as machine-readable
   custom properties, rather than prose plus a table of hex codes. A document
   cannot be imported. A token file can, and
   [`../pipeline/derive.mjs`](../pipeline/derive.mjs) keeps the JSON mirror
   honest.

2. **A compressed "Quick Reference" block at the end**, written for an agent
   to consume in one read, instead of making it scroll a thousand lines of
   reasoning. The reasoning still belongs in the document; the summary is for
   the reader who needs the decision, not the argument.

Neither requires changing a single design decision.

## Choosing one to read

Pick by the *problem* you have, not by the brand you like. Some useful
starting points:

| If you are building | Read |
|---|---|
| A light marketing site carried by one accent | `stripe`, `intercom`, `cal` |
| Something that must stay restrained at scale | `vercel`, `notion`, `linear-app` |
| Dense product UI on dark | `linear-app`, `superhuman`, `raycast` |
| A persistent nav anchor against light content | `slack` — note how the multicolour logo palette is kept *out* of the product UI |
| Documentation or legal pages | `mintlify`, `kami` |
| Analytics and data-dense surfaces | `posthog`, `clickhouse`, `grafana`-adjacent `mission-control` |
| Command surfaces, keyboard-first | `raycast`, `warp` |
| A deliberately expressive consumer register | `duolingo`, `spotify`, `canva` |
| Editorial and long-form reading | `theverge`, `wired`, `publication`, `atelier-zero` |

A contrast case is often more useful than a match. If your product is in a
category that pulls hard toward one register by default — "learning platform"
pulls toward playful and gamified, "fintech" pulls toward navy and
trustworthy — read the package that embodies that default specifically to see
what you are choosing *not* to do.

## The full catalog, by category

- **Productivity & SaaS** — arc, cal, discord, duolingo, intercom, linear-app, mintlify, notion, resend, slack, webex, zapier
- **Developer Tools** — cloudflare-kumo, cursor, expo, github, lovable, mission-control, raycast, superhuman, vercel, warp
- **AI & LLM** — claude, cohere, elevenlabs, huggingface, minimax, mistral-ai, ollama, openai, opencode-ai, perplexity, replicate, runwayml, together-ai, voltagent, x-ai
- **Fintech & Crypto** — binance, coinbase, kraken, mastercard, revolut, stripe, wise
- **Backend & Data** — cisco, clickhouse, composio, hashicorp, mongodb, posthog, sanity, sentry, supabase
- **Design & Creative** — airtable, canva, clay, figma, framer, miro, webflow
- **Professional & Corporate** — ant, application, corporate, dashboard, elegant, enterprise, luxury, material, premium, professional
- **Media & Consumer** — apple, ibm, nvidia, pinterest, playstation, spacex, spotify, theverge, uber, vodafone, wired, xiaohongshu
- **E-Commerce & Retail** — airbnb, meta, nike, shopify, starbucks
- **Modern & Minimal** — clean, contemporary, flat, minimal, modern, mono, refined, shadcn, simple, sleek
- **Bold & Expressive** — bold, brutalism, colorful, dramatic, energetic, expressive, neobrutalism, vibrant
- **Creative & Artistic** — artistic, cafe, cosmic, creative, doodle, editorial, fantasy, friendly, lingo, publication, storytelling
- **Morphism & Effects** — claymorphism, glassmorphism, gradient, neon, neumorphism, skeumorphism
- **Layout & Structure** — bento, levels, perspective, spacious
- **Retro & Nostalgic** — dithered, paper, retro, vintage
- **Themed & Unique** — agentic, futuristic, hud, loom, pacman, tetris, totality-festival, trading-terminal
- **Automotive** — bmw, bmw-m, bugatti, ferrari, lamborghini, renault, tesla
- **Editorial / Print** — atelier-zero, kami, urdu
- **Social & Messaging** — wechat
- **Starters** — default, tom-modern, warm-editorial

## A caution about the expressive half

The categories from **Morphism & Effects** downward are styles rather than
products, and they are the ones most likely to produce something that reads
as generated — not because the styles are bad, but because glassmorphism,
gradient and neon are what a model reaches for when it has no specification
and wants to look designed.

If you use one, use it because your design doc chose it, and then hold it to
the same bans as anything else. A neumorphic button still has to clear 3:1,
and most of the ones on the internet do not.

## On the brand names

These packages are aesthetic interpretations, not official assets of the
companies they reference. They contain no logos and no trademarked material.
All trademarks belong to their owners. See [`../NOTICE`](../NOTICE).

The package contract itself — the manifest schema, the runtime block, the
authoring rules — is documented in [`README.md`](./README.md), which is the
upstream project's own documentation and describes tooling (`od`, the daemon,
`/api/design-systems`) that lives in that project rather than here.
