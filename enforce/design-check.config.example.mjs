/**
 * Every rule here is off until you turn it on, and every rule carries the
 * sentence that justifies it. Delete what your design doc does not claim.
 *
 * The test for whether a rule belongs: can you point at the section of your
 * design doc it enforces? If not, it is a preference, and a preference that
 * fails a build is how a team learns to pass `--force`.
 *
 * This example is filled in for the worked example in `examples/meridian/`.
 *
 * A few rules take an optional target — `to` on a retired hue, a retired hex
 * or a banned radius, and the `typeRamp` map, which is one already. Naming it
 * is what makes those findings fixable by
 * `design-check --fix`, because the rewrite is then the doc's decision read
 * back rather than the checker's guess. Leave it out and the rule reports,
 * which is the right outcome whenever the answer is "it depends".
 */
export default {
  root: ".",
  src: "src",
  docPath: "DESIGN.md",
  skipDirs: ["node_modules", "dist", "build", "__tests__", ".next"],

  /* Colours the doc retired. The names, for utility classes.

     A bare name reports. `{ hue, to }` also fixes, in one of two shapes.

     A string swaps the hue segment and keeps the prefix and the shade, for
     a scale that was renamed: every `bg-violet-500` becomes
     `bg-accent-500`.

     A map replaces the whole class, for the commoner case of a hue retired
     in favour of a semantic token that has no shade. It is spelled out per
     class because the target varies by prefix — the same retired grey
     becomes an ink token under `text-` and a surface token under `bg-` —
     and a class the map omits stays a report. */
  retiredHues: [
    "indigo",
    { hue: "violet", to: "accent" },
    { hue: "slate", to: { "text-slate-600": "text-ink-secondary" } },
    "purple",
    "fuchsia",
  ],

  /* And the same colours as literals, which the name rule cannot see. List
     the actual hexes that were in use, not the whole family. */
  /* `{ hex, to }` here replaces the whole literal, because what a hex
     should become is a token reference with no prefix or shade to keep. */
  retiredHex: [
    { hex: "#4f46e5", to: "var(--accent)" },
    "#4338ca", "#6c63ff", "#a78bfa", "#c4b5fd",
  ],

  /* `text-[#ff0000]` and friends. A hex is the same value in both themes. */
  banArbitraryColor: true,

  classPrefixes: ["bg", "text", "border", "ring", "from", "via", "to", "decoration", "shadow"],

  /* Absolute bans: patterns with no legitimate instance anywhere. */
  bans: [
    {
      rule: "gradient-text",
      pattern: "bg-clip-text|background-clip:\\s*text",
      why: "Gradient text is banned: it fails contrast unpredictably and dates a page instantly.",
      detail: "gradient text is banned",
    },
    {
      rule: "layout",
      pattern: "\\bborder-[lr]-(?:[2-9]|\\d{2})\\b",
      why: "Side-stripe borders are never intentional design, only leftover scaffolding.",
      detail: "a side-stripe border",
    },
    /* A ban plus one scoped exemption, which is the shape worth copying for
       any token that *means* something. `--signal-short` means "this shift
       is uncovered"; a second consumer makes the colour stop meaning
       anything at all. Banning it everywhere and naming the one sanctioned
       file beats the prose version, which the second person to need a warm
       red breaks without realising there was a rule. The exemption is in
       `exemptions` below. */
    {
      rule: "signal",
      pattern: "signal-short",
      why: "A signal colour that acquires a second consumer stops being a signal.",
      detail: "signal-short outside the shift chip — it is the uncovered state, not a warm red",
    },
  ],

  /* Rules that need to know which element they are on. A card may be pure
     white; a section plate may not. A divider inside a card is fine; between
     two sections it is banned. A flat grep cannot tell these apart. */
  elementRules: [
    {
      rule: "plate",
      element: "section",
      pattern: "\\bbg-white\\b|#fff(?:fff)?\\b",
      flags: "i",
      why: "The page is never pure white. A card may be; a plate carries a substrate.",
      detail: "a section on pure white — use the paper or tint token",
    },
    {
      rule: "seam",
      element: "section",
      pattern: "border-t\\s+border-(?:gray|slate|neutral|zinc)-\\d{3}",
      why: "Sections feather, they do not butt. A hard rule between them is banned.",
      detail: "a hard rule between sections — use the seam component",
    },
  ],

  /* Measure these yourself against your own background, then write the
     number down here. A floor with a real measurement behind it survives
     an argument; "feels light" does not. */
  contrastFloors: [
    {
      class: "text-gray-400",
      measured: "2.37:1 on the tint plate",
      instead: "text-gray-500",
      why: "Below the 4.5:1 text floor and the 3:1 floor for a meaningful icon.",
    },
  ],

  /* Arbitrary px sizes that have a ramp token, mapped to it. Leave a size
     out on purpose when it is measured against something — a logo lockup
     sized to its mark's stroke is not drift. */
  typeRamp: {
    map: {
      11: "text-2xs", 12: "text-2xs",
      13: "text-xs", 14: "text-sm", 15: "text-base",
      16: "text-base", 18: "text-lg", 20: "text-xl",
      24: "text-2xl", 28: "text-3xl",
    },
    banStockClasses: false,
    stockPattern: "(?<![\\w:-])text-(xs|sm|base|lg|xl|2xl)(?![\\w./-])",
  },

  /* Icon geometry. `illustrativeFrom` is the size above which a glyph stops
     being an icon and becomes a drawing with its own composition. */
  iconScale: {
    element: "Icon[A-Z]\\w*|\\w+\\.Icon|Icon",
    sizes: [14, 16, 18, 20],
    strokeWidth: 1.75,
    illustrativeFrom: 26,
  },

  stateOpacity: {
    allowed: [40, 60],
    why: "40 for a control that does nothing, 60 for a field that still holds a readable value.",
  },

  copyBans: [
    {
      rule: "copy",
      pattern: "—",
      why: "No em dashes anywhere a visitor can read. Comments are exempt and already stripped.",
      detail: "an em dash in copy — rewrite the punctuation",
      limits: "it cannot tell copy from an identifier: a dash inside a key, a URL or a test name is the false positive to expect.",
    },
    /* The two prose patterns from petergyang/no-ai-slop (MIT) that a regex
       can actually hold. That skill names eighteen and edits a draft against
       them, which is a different job from this one and a better fit for it:
       see method/voice.md. These two are here because UI copy is where they
       show up and a checker can see them.

       The binary contrast is the one worth having at any cost. It is the
       single most recognisable generated construction in English, it sounds
       wise, and it says nothing: both halves survive because the sentence
       never had to decide which it meant. */
    {
      rule: "copy",
      pattern: "[Ii]t'?s not (?:just )?[\\w ]{1,30},? (?:it'?s|but)\\b",
      why: "The binary contrast says nothing: state the second half and delete the first.",
      detail: "\"it's not X, it's Y\" — say Y",
      limits: "only the commonest phrasing. The same shape written across two sentences walks past it.",
    },
    {
      rule: "copy",
      pattern: "\\b(?:[Dd]elve|[Ll]everage|[Ss]eamless(?:ly)?|[Rr]obust|[Uu]nlock the|[Ee]levate your)\\b",
      why: "Register, not vocabulary: each of these is a word a product page reaches for when it has not decided what it does.",
      detail: "a stock marketing verb — say what the thing actually does",
      limits: "`leverage` and `robust` are legitimate in a technical sentence. Scope this to the directories that hold visitor-facing copy, or drop it.",
    },
  ],

  tokensDeclaredOnce: {
    allowRedeclareIn: "\\.dark|\\[data-theme",
  },

  /* ── The interaction rules ──────────────────────────────────────────────
     Everything above this point is about what a surface looks like. These
     are about whether it can be used: focus, pointer targets, labels,
     motion, and the two layout bugs that are bugs rather than preferences.

     They are here because they are the half a design doc forgets. A model
     asked for a clean-looking button writes the suppression and skips the
     replacement, and the result passes every rule above. */

  /* A bare `focus:outline-none` with nothing put back. `banRing` is off by
     default: a ring is a perfectly good indicator in most systems. Turn it
     on only if yours has decided the indicator is an outline. */
  focusIndicator: {
    banRing: false,
    why: "An indicator removed with nothing put back leaves a keyboard with no position.",
  },

  /* One card, one radius — the line every design doc writes and the one it
     is least likely to keep. `allowArbitrary` is for a radius that is a
     role chosen elsewhere, carried by a named variable. */
  radius: {
    banArbitrary: true,
    allowArbitrary: ["^rounded-\\[var\\(--[\\w-]*radius\\)\\]$"],
    banned: [{ class: "rounded-3xl", to: "rounded-2xl", why: "Three radii were in use; one is in the law.", detail: "rounded-3xl is not in the law" }],
    /* Two tiers, and padding is the tell for which one you are on rather
       than the element: a card rendered as a `<button>` is still a card. */
    tiers: [
      {
        element: "button",
        pattern: "\\brounded-2xl\\b",
        containerPattern: "\\bp[xy]?-([5-9]|1\\d)\\b",
        onContainer: "rounded-2xl on a card — the container radius is 12px",
        onControl: "rounded-2xl on a control — the control radius is 8px",
        why: "Two radius tiers, and this one is on the wrong tier.",
      },
    ],
  },

  /* WCAG 2.2 §2.5.8. The box is computed from padding and the glyph size,
     and an explicit height stands the rule down: if somebody wrote a height
     they have thought about it. */
  hitTarget: {
    element: "button",
    glyph: "Icon\\w*|\\w+\\.Icon",
    minPx: 24,
    requireAccessibleName: true,
  },

  /* A control revealed on hover and not on focus. `pointer-events-none`
     is exempt: a caption that can never be reached is decoration. */
  hoverReveal: {
    instead: "answer focus-visible and group-focus-within as well as hover",
  },

  /* ── `limits`, on any rule ──────────────────────────────────────────────
     Every rule above prints the sentence that justifies it. Each one can
     also carry a `limits` sentence, printed under its own findings as
     `cannot tell: …`, and the engine ships one for every rule it owns.

     This is worth more than it looks. On one real audit three rules
     reported a *decision* rather than drift — a pane that is correctly a
     flat outlined region, a box-shadow drawing a crop scrim rather than an
     elevation, six deliberate raw images — and nothing in the output
     suggested the rule could not tell the difference. A reader in that
     position either edits code that was right, or stops believing the run.
     Both are worse than the rule not existing.

     So state the blind spot next to the claim. Override the engine's
     sentence, or add one for a rule you named yourself:

       bans: [{ rule: "signal", pattern: "…", why: "…",
                limits: "it cannot see the token arriving through a prop." }],
     ──────────────────────────────────────────────────────────────────── */

  /* Reduced-motion rules are written one class name at a time, so a
     hand-rolled utility animation is covered by none of them.
     `motion-safe:` is accepted, because it never starts at all. */
  motionGuards: [
    {
      class: "animate-pulse",
      why: "An animation no prefers-reduced-motion rule covers.",
      detail: "animate-pulse, unguarded — use the skeleton component, or motion-safe:",
    },
  ],

  /* The controls people type into. For a long time the checker this came
     from inspected only `<button>`, and 171 fields were outside the
     contract while the report said the system was green. */
  fields: {
    requireAccessibleName: true,
    nativePickers: [
      {
        types: "date|time|datetime-local|month|week",
        why: "A native picker shows the OS locale, not the app's, so two people read different days.",
        instead: "use the app's own DatePicker / TimePicker",
      },
    ],
    radius: { allowed: ["lg", "full"], why: "One field radius, 8px, the same one the field component follows." },
    boundaryBans: [],
    skipIn: ["src/components/ui/"],
  },

  /* A raw `<img>` renders the browser's broken glyph on a dead URL, which
     reads as the product being broken. Each allow entry states its reason. */
  imageComponent: {
    component: "Media",
    allow: ["src/components/ui/media\\.tsx$"],
    why: "An image with no fallback renders the browser's broken glyph, which reads as the product being broken.",
  },

  /* A shell that should have come from the component. This is the commonest
     form of locally plausible and globally incoherent: a flat outlined
     rectangle where the doc specifies an object, in two dozen files. */
  shells: [
    {
      rule: "surface",
      pattern: "\\brounded-(?:xl|2xl)\\b",
      requires: ["\\bborder\\b", "\\bbg-white\\b"],
      exempt: ["data-\\[", "aria-\\[", "group-hover:border", "peer-", "focus|placeholder"],
      why: "An object that holds content takes the card component, which carries the radius, the hairline and the ramp together.",
      detail: "a hand-rolled card shell — use the card component",
    },
  ],

  /* The two-scrollbar fault. `flex-1 overflow-y-auto` with no `min-h-0`
     does not shrink below its content, so it grows past its frame. */
  flexShrink: { axes: ["y", "x"] },

  /* A token meant for type, border and ring, used as a ground. Same hue as
     its fill counterpart on light, and it diverges on dark — so every
     screenshot looks fine and one theme is unreadable. */
  inkAsFill: [
    {
      fillPattern: "\\bbg-((?:brand|state-[a-z]+)-(?:ink|fg))\\b",
      textPattern: "\\btext-(white|on-brand|paper|fg-inverse|(?:brand|state)-[a-z-]+)\\b",
      exemptPattern: "\\bbg-fg\\b[^\"'`]*\\btext-fg-inverse\\b",
      why: "A type token carrying text inverts with the theme, so it is unreadable in exactly one of them.",
      detail: "that token is type, border and ring. A ground is bg-brand + text-on-brand.",
    },
  ],

  /* An exemption is a hole unless it is argued and scoped. Name the rules it
     covers, never `"*"` unless you mean it, and re-read this list whenever a
     file moves — an exemption pointing at where something used to be checks
     the sanctioned file and skips the unsanctioned one. */
  exemptions: [
    {
      path: "src/brand/identity-hues\\.ts$",
      rules: ["palette"],
      reason: "The hashed identity hues, argued in place at the top of that file.",
    },
    {
      path: "src/features/roster/shift-chip\\.tsx$",
      rules: ["signal"],
      reason: "The one component the uncovered state belongs to. DESIGN.md § Components.",
    },
  ],
};
