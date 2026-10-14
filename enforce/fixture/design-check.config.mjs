/**
 * Every rule here is off until you turn it on, and every rule carries the
 * sentence that justifies it. Delete what your design doc does not claim.
 *
 * The test for whether a rule belongs: can you point at the section of your
 * design doc it enforces? If not, it is a preference, and a preference that
 * fails a build is how a team learns to pass `--force`.
 *
 * This example is filled in for the worked example in `examples/meridian/`.
 */
export default {
  root: ".",
  src: "src",
  docPath: "DESIGN.md",
  skipDirs: ["node_modules", "dist", "build", "__tests__", ".next"],

  /* Colours the doc retired. The names, for utility classes. */
  retiredHues: ["indigo", "violet", "purple", "fuchsia"],

  /* And the same colours as literals, which the name rule cannot see. List
     the actual hexes that were in use, not the whole family. */
  retiredHex: ["#4f46e5", "#4338ca", "#6c63ff", "#a78bfa", "#c4b5fd"],

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
    banned: [{ class: "rounded-3xl", why: "Three radii were in use; one is in the law.", detail: "rounded-3xl is not in the law" }],
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
    skipIn: ["src/kit/"],
  },

  /* A raw `<img>` renders the browser's broken glyph on a dead URL, which
     reads as the product being broken. Each allow entry states its reason. */
  imageComponent: {
    component: "Media",
    allow: ["src/kit/media\\.tsx$"],
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
  ],
};
