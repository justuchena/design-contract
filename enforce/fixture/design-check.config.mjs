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
