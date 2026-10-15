#!/usr/bin/env node
/**
 * tokens.css → design-tokens.json. One source, one derived mirror.
 *
 *     node pipeline/derive.mjs src/styles/tokens.css
 *     node pipeline/derive.mjs src/styles/tokens.css --check
 *
 * ── Why a derived file rather than two hand-written ones ─────────────────
 * Because the CSS is the thing the browser reads, so the CSS has to be the
 * source. But a document cannot be imported, and anything that is not the
 * browser — a Figma sync, a native app, a slide template, an agent asking
 * what the brand's accent is — needs the values as data.
 *
 * Two hand-maintained copies of a palette diverge. They always diverge. So
 * this writes one from the other, and `--check` fails a build when the
 * mirror is stale, which is the only thing that actually keeps them equal.
 *
 * Emits the Design Tokens Format Module shape (`$value` / `$type`) so the
 * output is readable by standard tooling:
 * https://tr.designtokens.org/format/
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const argv = process.argv.slice(2);
const source = argv.find((a) => !a.startsWith("--"));
const CHECK = argv.includes("--check");

if (!source) {
  console.error("usage: node pipeline/derive.mjs <tokens.css> [--check] [--out <file>]");
  process.exit(2);
}
if (!existsSync(source)) {
  console.error(`no file at ${source}`);
  process.exit(2);
}

const outIndex = argv.indexOf("--out");
const out = outIndex === -1 ? join(dirname(source), "design-tokens.json") : argv[outIndex + 1];

const css = readFileSync(source, "utf8");

/* Only the base `:root` block. A `.dark` or `[data-theme]` block is a theme
   override, and folding it in here would silently overwrite a base value
   with its dark counterpart depending on declaration order. Themes are a
   separate projection; this one is the contract. */
const start = css.indexOf(":root");
if (start === -1) {
  console.error(`${source} has no :root block`);
  process.exit(2);
}
const open = css.indexOf("{", start);
let depth = 0;
let end = open;
for (let i = open; i < css.length; i += 1) {
  if (css[i] === "{") depth += 1;
  else if (css[i] === "}") {
    depth -= 1;
    if (depth === 0) {
      end = i;
      break;
    }
  }
}
const root = css.slice(open + 1, end);

/* Strip comments before matching, so a hex written inside an explanatory
   note is never mistaken for a declaration. The comment is usually where
   the *rejected* value is recorded, which is exactly the value you least
   want in the output. */
const declarations = root.replace(/\/\*[\s\S]*?\*\//g, "");

/* The grouping is the only thing this script knows that the CSS does not.
   A token whose prefix matches nothing lands in `other`, which is the signal
   to add a group rather than to leave it there — a growing `other` means the
   naming has drifted from the structure. */
const GROUPS = [
  ["color", /^--(?:color|brand|accent|fg|bg|paper|tint|ink|surface|line|border|signal|status|state)/, "color"],
  ["dimension", /^--(?:radius|space|spacing|size|width|height|gap|inset)/, "dimension"],
  ["typography", /^--(?:font|text|leading|tracking|letter|weight)/, null],
  ["shadow", /^--(?:shadow|elevation)/, "shadow"],
  ["motion", /^--(?:dur|duration|ease|easing|transition)/, "duration"],
  ["z", /^--(?:z|layer)/, "number"],
];

const inferType = (value, declared) => {
  if (declared) return declared;
  if (/^#[0-9a-f]{3,8}$/i.test(value) || /^(?:rgb|hsl|oklch|lab|color)\(/i.test(value)) return "color";
  if (/^[\d.]+m?s$/.test(value)) return "duration";
  if (/^-?[\d.]+(?:px|rem|em|%|vh|vw|ch)$/.test(value)) return "dimension";
  if (/^-?[\d.]+$/.test(value)) return "number";
  if (/^cubic-bezier\(|^(?:ease|linear|steps)/.test(value)) return "cubicBezier";
  return "other";
};

const tokens = {};
const counts = {};
let total = 0;

for (const m of declarations.matchAll(/(?:^|[;{])\s*(--[a-z0-9-]+)\s*:\s*([^;}]+)/gi)) {
  const name = m[1];
  const value = m[2].trim();
  if (!value) continue;

  const hit = GROUPS.find(([, re]) => re.test(name));
  const group = hit ? hit[0] : "other";
  const type = inferType(value, hit?.[2] ?? null);

  const key = name.replace(/^--/, "");
  tokens[group] ??= {};
  tokens[group][key] = {
    $value: value,
    $type: type,
    $extensions: { "org.designpack.cssVar": name },
  };
  counts[group] = (counts[group] ?? 0) + 1;
  total += 1;
}

if (!total) {
  console.error(`${source}: parsed no custom properties from :root`);
  process.exit(2);
}

const payload = {
  $description: `Derived from ${basename(source)} by pipeline/derive.mjs. Do not edit by hand.`,
  ...tokens,
};
const json = `${JSON.stringify(payload, null, 2)}\n`;

if (CHECK) {
  const current = existsSync(out) ? readFileSync(out, "utf8") : "";
  if (current !== json) {
    console.error(`✗ ${out} is stale. Run: node pipeline/derive.mjs ${source}`);
    process.exit(1);
  }
  console.log(`✓ ${out} matches ${source} (${total} tokens)`);
  process.exit(0);
}

writeFileSync(out, json);
const summary = Object.entries(counts).map(([g, n]) => `${g} ${n}`).join(", ");
console.log(`✓ ${out} — ${total} tokens (${summary})`);
if (counts.other) {
  console.log(`\n${counts.other} token(s) landed in "other". Add a group, or rename them.`);
}
