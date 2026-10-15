#!/usr/bin/env node
/**
 * The rules in your design doc that a machine can hold, held.
 *
 *     node enforce/design-check.mjs [--config <path>] [--max <n>]
 *
 * Composition is deliberately not checked, and every rule carries the sentence
 * that justifies it. The argument for both, and for each rule, is in
 * enforce/README.md.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? null : argv[i + 1];
};

const CWD = process.cwd();
const configPath = resolve(CWD, flag("config") ?? "design-check.config.mjs");
if (!existsSync(configPath)) {
  console.error(`design-check: no config at ${relative(CWD, configPath)}`);
  console.error("Copy enforce/design-check.config.example.mjs and edit it.");
  process.exit(2);
}
const config = (await import(pathToFileURL(configPath).href)).default;

const ROOT = resolve(dirname(configPath), config.root ?? ".");
const SRC = resolve(ROOT, config.src ?? "src");
const SKIP = new Set(config.skipDirs ?? ["node_modules", "dist", "build", "__tests__"]);
const EXTENSIONS = config.extensions ?? [".tsx", ".jsx", ".ts", ".js", ".css", ".vue", ".svelte"];

/* A plain recursive walker, and no clever directory API at all. `globSync`
   landed in Node 22 and `readdirSync({recursive:true})` in 18.17, so either
   one trades a rule I can test for a version table I cannot. Twelve lines
   that work on every Node there has ever been are cheaper than being wrong
   about that table twice. */
const listFiles = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, out);
    else if (EXTENSIONS.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
};

/**
 * Blank out comments, preserving offsets, skipping string literals.
 *
 * Both properties are load-bearing. Offsets are preserved because line numbers
 * are counted by newlines, so deleting a comment reports the wrong line. And a
 * regex for the comment opener cannot tell one from `accept="image/*"`, which
 * once opened a comment that ran hundreds of lines and blanked the file.
 */
const strip = (src) => {
  const out = src.split("");
  const n = src.length;
  const blank = (a, b) => {
    for (let k = a; k < b && k < n; k += 1) if (out[k] !== "\n") out[k] = " ";
  };
  let i = 0;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "*") {
      const e = src.indexOf("*/", i + 2);
      const end = e < 0 ? n : e + 2;
      blank(i, end);
      i = end;
    } else if (c === "/" && d === "/") {
      const e = src.indexOf("\n", i);
      const end = e < 0 ? n : e;
      blank(i, end);
      i = end;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < n) {
        if (src[j] === "\\") {
          j += 2;
          continue;
        }
        if (src[j] === c) break;
        j += 1;
      }
      i = j + 1;
    } else {
      i += 1;
    }
  }
  return out.join("");
};

const files = listFiles(SRC).map((file) => {
  const raw = readFileSync(file, "utf8");
  return { file, rel: relative(ROOT, file), raw, code: strip(raw) };
});

if (!files.length) {
  console.error(`design-check: no source files under ${relative(ROOT, SRC)}`);
  process.exit(2);
}

/* The rules this engine has, and what in a config turns each one on. The
   count is derived from this so no prose has to be kept in step with it;
   `limits` is the blind spot a finding cannot tell you, printed under it. */
const RULES = [
  { name: "palette", on: (c) => c.retiredHues?.length || c.retiredHex?.length || c.banArbitraryColor,
    limits: "it reads names and literals, so a colour arriving through a variable or a computed class is invisible to it." },
  { name: "type", on: (c) => c.typeRamp },
  { name: "icon", on: (c) => c.iconScale,
    limits: "size is bound to the type beside it, and this only knows the ramp. It cannot tell you a 16 should have been a 14 here." },
  { name: "state", on: (c) => c.stateOpacity },
  { name: "contrast", on: (c) => c.contrastFloors?.length,
    limits: "it matches the class you measured against the ground you measured it on. It does not re-measure, so a token change makes it confidently wrong." },
  { name: "copy", on: (c) => c.copyBans?.length,
    limits: "it cannot tell copy from an identifier. A banned string inside a key, a URL or a test name is the false positive to expect." },
  { name: "tokens", on: (c) => c.tokensDeclaredOnce },
  { name: "focus", on: (c) => c.focusIndicator,
    limits: "it accepts any substitute that answers focus. Whether that substitute is *visible enough* is a contrast question it does not ask." },
  { name: "radius", on: (c) => c.radius,
    limits: "the tier rules read padding to tell a card from a control, which is a heuristic. A dense card or a roomy button will be read as the other one." },
  { name: "a11y", on: (c) => c.hitTarget,
    limits: "the box is computed from padding and the glyph, so a size set in CSS, by a parent, or through a component boundary is not seen. It under-reports." },
  { name: "reveal", on: (c) => c.hoverReveal,
    limits: "it checks that focus is answered, not that the control is reachable. A reveal inside something `aria-hidden` still passes." },
  { name: "motion", on: (c) => c.motionGuards?.length,
    limits: "it knows the class names you listed. An animation defined in CSS, or one driven by a library, is outside it entirely." },
  { name: "field", on: (c) => c.fields,
    limits: "an `id` counts as named, because chasing a label across components is more machinery than this should carry. A field with an id and no matching label passes." },
  { name: "media", on: (c) => c.imageComponent,
    limits: "it cannot tell a deliberate raw image from a careless one. Every finding is a candidate for the allowlist, and an allowlist nobody maintains is how this rule turns into noise." },
  { name: "surface", on: (c) => c.shells?.length,
    limits: "it cannot tell an object from a region. A full-height pane with its own header is a region, and a flat outlined rectangle is the right treatment for one." },
  { name: "layout", on: (c) => c.flexShrink,
    limits: "it reads one class expression, so a parent that is not a flex container, or a height that arrives from CSS, is not considered." },
  { name: "ink-as-fill", on: (c) => c.inkAsFill?.length,
    limits: "it fires when a fill token shares an expression with a text token. Text that arrives from a child component is not seen." },
  { name: "(your bans)", on: (c) => c.bans?.length },
  { name: "(your element rules)", on: (c) => c.elementRules?.length },
];

/* The limits actually in play: the engine's, plus anything a config states
   for a rule it names itself. A config entry wins, because it is closer to
   the decision. */
const limitsFor = new Map(RULES.filter((r) => r.limits).map((r) => [r.name, r.limits]));
for (const key of ["bans", "elementRules", "contrastFloors", "copyBans", "motionGuards", "shells", "inkAsFill"]) {
  for (const entry of config[key] ?? []) {
    if (entry.limits && entry.rule) limitsFor.set(entry.rule, entry.limits);
  }
}
for (const [key, name] of Object.entries({
  typeRamp: "type", iconScale: "icon", stateOpacity: "state", radius: "radius",
  focusIndicator: "focus", hitTarget: "a11y", hoverReveal: "reveal", fields: "field",
  imageComponent: "media", flexShrink: "layout", tokensDeclaredOnce: "tokens",
})) {
  if (config[key]?.limits) limitsFor.set(name, config[key].limits);
}

const findings = [];
const lineAt = (text, index) => text.slice(0, index).split("\n").length;
const report = (rule, why, place, detail) => findings.push({ rule, why, place, detail });

/* An exemption is a hole unless it is argued and scoped, so each one names a
   path pattern and a reason, and the reason is printed by `--exemptions`.
   The failure mode to avoid: an exemption that outlives what it exempted,
   left pointing at the file a thing used to be in. Then the sanctioned
   module is checked and the unsanctioned one is not. */
const exempt = (rule, rel) =>
  (config.exemptions ?? []).some(
    (x) => (x.rules === "*" || x.rules.includes(rule)) && new RegExp(x.path).test(rel),
  );

const eligible = (rule, f, opts = {}) => {
  if (exempt(rule, f.rel)) return false;
  if (opts.only && !opts.only.some((e) => f.file.endsWith(e))) return false;
  return true;
};

/* The open tag containing an index, so a rule can ask about the element a
   match sits on rather than the whole file. Brace-aware, so
   `className={cond ? a : b}` does not end the tag early. */
const tagAround = (text, index) => {
  const open = text.lastIndexOf("<", index);
  if (open === -1) return "";
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    const c = text[i];
    if (c === "{") depth += 1;
    else if (c === "}") depth -= 1;
    else if (c === ">" && depth === 0) return text.slice(open, i + 1);
  }
  return text.slice(open);
};

const elementsNamed = (text, name) => {
  const out = [];
  const re = new RegExp(`<${name}\\b`, "g");
  for (const m of text.matchAll(re)) out.push({ index: m.index, tag: tagAround(text, m.index) });
  return out;
};

/* ── the second tier of helpers ───────────────────────────────────────────
   Everything above this line reads a file, a match, or one open tag. The
   rules below the next heading ask harder questions — what is *inside* this
   button, what wraps this field, is this whole class expression self
   consistent — and three of them cannot be answered by a regex over a line.
   Each helper here exists because a rule built without it reported something
   true about text that was not there. */

/* The index of the `>` that closes an open tag starting at `from`.
   Brace-aware, so `className={cond ? a : b}` does not end the tag early. */
const openTagEnd = (text, from) => {
  let depth = 0;
  for (let i = from; i < text.length; i += 1) {
    const c = text[i];
    if (c === "{") depth += 1;
    else if (c === "}") depth -= 1;
    else if (c === ">" && depth === 0) return i;
  }
  return -1;
};

/* Elements matching a name pattern, with the open tag, the index of its `>`
   and which alternative actually matched. The last of those is what lets a
   rule find the closing tag of whatever it is standing on. */
const elementsOf = function* (text, namePattern) {
  const re = new RegExp(`<(${namePattern})\\b`, "g");
  let m;
  while ((m = re.exec(text))) {
    const end = openTagEnd(text, m.index + m[0].length);
    if (end === -1) continue;
    yield { index: m.index, tag: text.slice(m.index, end + 1), end, name: m[1] };
  }
};

const classNameOf = (tag) => {
  const m = tag.match(/class(?:Name)?=\{?(["'`])((?:(?!\1)[\s\S])*?)\1/);
  return m ? m[2] : null;
};

/* Every class expression, whole. Several rules look for a contradiction
   *inside* one — `opacity-0` with a hover answer and no focus answer — and a
   line-wise check misreads any class list formatted across several lines,
   which is the normal way to write a long one. */
const CLASS_EXPR =
  /class(?:Name)?=(?:"[^"]*"|'[^']*'|\{`[^`]*`\}|\{\[[\s\S]*?\]\.join\([^)]*\)\}|\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g;
const classExpressions = (text) => [...text.matchAll(CLASS_EXPR)];

/* The open tags still unclosed at `index`. The test a caller should apply is
   the *prop*, not the element: an ancestor that is a `<label>`, or that takes
   a `label=`, is naming what it wraps. Without that, a field labelled by a
   wrapper component reads as nameless. */
const ancestorsOf = (text, index) => {
  const stack = [];
  const re = /<(\/?)([A-Za-z][\w.]*)\b/g;
  let m;
  while ((m = re.exec(text)) && m.index < index) {
    const end = openTagEnd(text, m.index + m[0].length);
    if (end === -1) continue;
    const tag = text.slice(m.index, end + 1);
    if (m[1]) {
      for (let i = stack.length - 1; i >= 0; i -= 1) {
        if (stack[i].name === m[2]) {
          stack.length = i;
          break;
        }
      }
    } else if (!/\/>$/.test(tag)) {
      stack.push({ name: m[2], tag });
    }
  }
  return stack;
};

const MARKUP = [".tsx", ".jsx", ".vue", ".svelte"];

// ── rule: retired colours, by class name ────────────────────────────────
// The commonest drift of all. A hue gets retired in the doc and lives on in
// the tree, because retiring it was a sentence and removing it was work.
if (config.retiredHues?.length) {
  const prefixes = (config.classPrefixes ?? [
    "bg", "text", "border", "ring", "from", "via", "to", "decoration", "shadow", "fill", "stroke",
  ]).join("|");
  const re = new RegExp(`\\b(?:${prefixes})-(${config.retiredHues.join("|")})-\\d{2,3}\\b`, "g");
  for (const f of files) {
    if (!eligible("palette", f)) continue;
    for (const m of f.code.matchAll(re)) {
      report("palette", "A retired hue is still in the tree.",
        `${f.rel}:${lineAt(f.code, m.index)}`, `${m[0]} — ${m[1]} is retired`);
    }
  }
}

// ── rule: retired colours, written as a hex ─────────────────────────────
// A hex walks straight past the rule above, which greps colour *names*.
// That is exactly how a live retired pair survived four sweeps in my own
// repo. A hex also cannot follow the theme: it is the same value in light
// and dark, which is a bug waiting for a dark mode.
if (config.retiredHex?.length) {
  const re = new RegExp(`#(?:${config.retiredHex.map((h) => h.replace(/^#/, "")).join("|")})\\b`, "gi");
  for (const f of files) {
    if (!eligible("palette", f)) continue;
    for (const m of f.code.matchAll(re)) {
      report("palette", "A retired hue as a literal.",
        `${f.rel}:${lineAt(f.code, m.index)}`, `${m[0]} — retired, and a literal cannot follow the theme`);
    }
  }
}

// ── rule: arbitrary colour classes ──────────────────────────────────────
if (config.banArbitraryColor) {
  const prefixes = (config.classPrefixes ?? ["text", "bg", "border", "ring", "from", "via", "to"]).join("|");
  const re = new RegExp(`(?:${prefixes})-\\[#[0-9a-fA-F]{3,8}\\]`, "g");
  for (const f of files) {
    if (!eligible("palette", f)) continue;
    for (const m of f.code.matchAll(re)) {
      report("palette", "A hex cannot follow the theme; a token can.",
        `${f.rel}:${lineAt(f.code, m.index)}`, `${m[0]} — use a token`);
    }
  }
}

// ── rule: flat text and pattern bans ────────────────────────────────────
// The doc's absolute bans, the ones with no legitimate instance.
for (const ban of config.bans ?? []) {
  const re = new RegExp(ban.pattern, ban.flags ?? "g");
  for (const f of files) {
    if (!eligible(ban.rule, f, ban)) continue;
    for (const m of f.code.matchAll(re)) {
      report(ban.rule, ban.why, `${f.rel}:${lineAt(f.code, m.index)}`, ban.detail ?? `${m[0]} is banned`);
    }
  }
}

// ── rule: element-scoped bans ───────────────────────────────────────────
// The distinction prose makes and a flat grep cannot: a *card* may be pure
// white, a *section plate* may not. A divider inside a card is fine, between
// two sections it is banned. So these read one element's open tag, which is
// where the decision is actually declared.
for (const rule of config.elementRules ?? []) {
  const re = new RegExp(rule.pattern, rule.flags ?? "");
  for (const f of files) {
    if (!eligible(rule.rule, f, { only: rule.only ?? [".tsx", ".jsx", ".vue", ".svelte"] })) continue;
    for (const el of elementsNamed(f.code, rule.element)) {
      if (re.test(el.tag)) {
        report(rule.rule, rule.why, `${f.rel}:${lineAt(f.code, el.index)}`, rule.detail);
      }
    }
  }
}

// ── rule: contrast floors ───────────────────────────────────────────────
// A measured value, not a guess. The escape hatch is `aria-hidden` on the
// same element, which is also the honest way to say "this glyph is
// decorative" — so the exemption and the accessibility fact are one edit.
for (const rule of config.contrastFloors ?? []) {
  const re = new RegExp(`\\b${rule.class}\\b`, "g");
  for (const f of files) {
    if (!eligible("contrast", f)) continue;
    for (const m of f.code.matchAll(re)) {
      if (/aria-hidden/.test(tagAround(f.code, m.index))) continue;
      report("contrast", rule.why ?? `${rule.class} fails the contrast floor.`,
        `${f.rel}:${lineAt(f.code, m.index)}`,
        `${rule.class} is ${rule.measured} — use ${rule.instead}, or aria-hidden if it is decorative`);
    }
  }
}

// ── rule: the type ramp ─────────────────────────────────────────────────
// An arbitrary size carries no line height and no tracking, so a browser
// default decides the leading. Stock utility sizes are a subtler miss: they
// are the same size in both themes and invisible to a grep for the app ramp.
if (config.typeRamp) {
  const { map = {}, banStockClasses, stockPattern } = config.typeRamp;
  for (const f of files) {
    if (!eligible("type", f)) continue;
    for (const m of f.code.matchAll(/text-\[([0-9.]+)px\]/g)) {
      const to = map[m[1]];
      if (to) {
        report("type", "The ramp owns leading and tracking; a literal owns neither.",
          `${f.rel}:${lineAt(f.code, m.index)}`, `${m[0]} — the ramp has ${to}`);
      }
    }
    if (banStockClasses && stockPattern) {
      for (const m of f.code.matchAll(new RegExp(stockPattern, "g"))) {
        report("type", "Stock sizes are not the app's scale.",
          `${f.rel}:${lineAt(f.code, m.index)}`, `${m[0]} — use the app ramp`);
      }
    }
  }
}

// ── rule: the icon scale ────────────────────────────────────────────────
// An icon size is bound to the type beside it, not chosen. Before this rule
// my own app had twelve sizes and nine stroke widths in use.
if (config.iconScale) {
  const { element, sizes, strokeWidth, illustrativeFrom = 26 } = config.iconScale;
  const re = new RegExp(`<(?:${element})\\b((?:[^>]|\\n)*?)/>`, "g");
  const ok = new Set(sizes);
  for (const f of files) {
    if (!eligible("icon", f)) continue;
    for (const m of f.code.matchAll(re)) {
      const size = m[1].match(/size=\{(\d+)\}/);
      const stroke = m[1].match(/strokeWidth=\{([\d.]+)\}/);
      if (!size) continue;
      const n = Number(size[1]);
      if (n >= illustrativeFrom) continue; // a drawing, sized to its own composition
      const place = `${f.rel}:${lineAt(f.code, m.index)}`;
      if (!ok.has(n)) {
        report("icon", "Icon size is bound to the type beside it.", place,
          `size={${n}} — the ramp is ${sizes.join(" / ")}`);
      }
      if (strokeWidth && stroke && stroke[1] !== String(strokeWidth)) {
        report("icon", "One stroke width, or the set stops reading as one set.", place,
          `strokeWidth={${stroke[1]}} at size ${n} — the ramp is ${strokeWidth}`);
      }
    }
  }
}

// ── rule: the state pair ────────────────────────────────────────────────
// Two values, and the difference is real: a field that cannot be edited
// still holds a value somebody has to read, so it cannot fade as far as a
// control that does nothing. Five were in use because nobody could tell
// whether a call site meant loading or disabled.
if (config.stateOpacity?.allowed?.length) {
  const allowed = config.stateOpacity.allowed.map(String);
  for (const f of files) {
    if (!eligible("state", f)) continue;
    for (const m of f.code.matchAll(/(?:aria-)?disabled:opacity-(\d+)/g)) {
      if (!allowed.includes(m[1])) {
        report("state", config.stateOpacity.why ?? "The disabled pair is two values.",
          `${f.rel}:${lineAt(f.code, m.index)}`, `${m[0]} — the pair is ${allowed.join(" / ")}`);
      }
    }
  }
}

// ── rule: copy bans ─────────────────────────────────────────────────────
// Punctuation and wording the doc bans anywhere a visitor can read. Comments
// are already blanked, so explaining the ban does not trip it.
for (const ban of config.copyBans ?? []) {
  const re = new RegExp(ban.pattern, ban.flags ?? "g");
  for (const f of files) {
    if (f.file.endsWith(".css")) continue;
    if (!eligible("copy", f)) continue;
    for (const m of f.code.matchAll(re)) {
      report("copy", ban.why, `${f.rel}:${lineAt(f.code, m.index)}`, ban.detail ?? `${m[0]} is banned in copy`);
    }
  }
}

// ── rule: one declaration per token ─────────────────────────────────────
// The same custom property declared in two sheets, one of which a given
// route may not import. The symptom is a colour that is correct on every
// page you tested and wrong on one you did not.
if (config.tokensDeclaredOnce) {
  const declared = new Map();
  const themeSelectors = new RegExp(config.tokensDeclaredOnce.allowRedeclareIn ?? "\\.dark|\\[data-theme");
  for (const f of files) {
    if (!f.file.endsWith(".css")) continue;
    if (!eligible("tokens", f)) continue;
    /* Anchored on `{` or `;` rather than start-of-line. A line-start anchor
       reads correctly formatted CSS and silently skips anything minified or
       written one-line, which is the half of the codebase nobody formats. */
    for (const m of f.code.matchAll(/(?:^|[;{])\s*(--[a-z0-9-]+)\s*:/gim)) {
      const block = f.code.slice(0, m.index);
      const selector = block.slice(block.lastIndexOf("}") + 1);
      if (themeSelectors.test(selector)) continue; // a theme override is the point
      const seen = declared.get(m[1]) ?? new Set();
      seen.add(f.rel);
      declared.set(m[1], seen);
    }
  }
  for (const [name, inFiles] of declared) {
    if (inFiles.size > 1) {
      report("tokens", "One source of truth per token, or a route can import the wrong one.",
        [...inFiles].join(" + "), `${name} is declared in ${inFiles.size} sheets`);
    }
  }
}

// ── rule: the focus indicator ───────────────────────────────────────────
// A bare `focus:outline-none` removes the indicator and puts nothing back.
// Two things keep this usable: `focus-visible:` has to be in the pattern, and
// a substitute that answers focus is a decision rather than a leftover, so the
// whole class expression is read rather than the line.
if (config.focusIndicator) {
  const {
    substitutePattern = "focus(?:-visible)?:(?!outline-none)(?:bg-|text-|ring-|border-|outline-\\d|shadow-)",
    banRing = false,
    why = "An indicator removed with nothing put back leaves a keyboard with no position.",
  } = config.focusIndicator;
  const substitute = new RegExp(substitutePattern);
  /* Class *constants* too. A long class string is as often a `const field =
     "..."` beside the component as it is an attribute, and the suppression
     tends to live in exactly those. */
  const CONST_EXPR = /const \w+ =\s*(?:'[^']*'|"[^"]*"|`[^`]*`)(?:\s*\+\s*\n?\s*(?:'[^']*'|"[^"]*"))*/g;
  for (const f of files) {
    if (!eligible("focus", f)) continue;
    const seen = new Set();
    for (const m of [...classExpressions(f.code), ...f.code.matchAll(CONST_EXPR)]) {
      const killed = m[0].match(/focus(?:-visible)?:outline-none/);
      if (!killed || seen.has(m.index)) continue;
      seen.add(m.index);
      if (substitute.test(m[0])) continue;
      report("focus", why, `${f.rel}:${lineAt(f.code, m.index)}`,
        `${killed[0]} with nothing put back — put an indicator back, or write plain ` +
          `outline-none where a wrapper shows the focus instead`);
    }
    /* Off by default, because a ring is a perfectly good indicator in most
       systems. Turn it on only if yours has decided the indicator is an
       outline: a ring is a box-shadow, so it collides with every elevation
       token you have, and the collision is invisible until the two land on
       the same element. */
    if (banRing) {
      for (const m of f.code.matchAll(/(?:focus|focus-visible|focus-within):ring-[\w./[\]-]+/g)) {
        report("focus", why, `${f.rel}:${lineAt(f.code, m.index)}`,
          `${m[0]} — the indicator is an outline; a ring is a box-shadow and collides with elevation`);
      }
    }
  }
}

// ── rule: geometry ──────────────────────────────────────────────────────
// "One card, one radius" is the line every design doc writes and the one it
// is least likely to keep, because a radius is the cheapest thing in the
// world to type. The audit behind this repo found five live at once under a
// document that specified one.
if (config.radius) {
  const { banArbitrary = true, allowArbitrary = [], banned = [], tiers = [] } = config.radius;
  const allowed = allowArbitrary.map((p) => new RegExp(p));
  for (const f of files) {
    if (!eligible("radius", f)) continue;
    if (banArbitrary) {
      for (const m of f.code.matchAll(/\brounded-\[[^\]]+\]/g)) {
        /* The one exemption shape worth having: a radius that is a *role*
           chosen elsewhere, carried by a named variable — a tenant's own
           theme, say. That is not a sixth number typed here. */
        if (allowed.some((re) => re.test(m[0]))) continue;
        report("radius", "An arbitrary radius is not a role.",
          `${f.rel}:${lineAt(f.code, m.index)}`, `${m[0]} — use one of the named radii`);
      }
    }
    for (const ban of banned) {
      for (const m of f.code.matchAll(new RegExp(`\\b${ban.class}\\b`, "g"))) {
        report("radius", ban.why ?? "A radius outside the law.",
          `${f.rel}:${lineAt(f.code, m.index)}`, ban.detail ?? `${ban.class} is not in the law`);
      }
    }
    /* A container radius on a control, or a control radius on a container,
       is the exact confusion two tiers exist to prevent — and the tell for
       which one you are looking at is padding, not the tag. An account
       picker that is a `<button>` with 28px of padding, an icon, a title and
       a body is a *card* in every way except the element it happens to use,
       and the first version of this rule told it to take a control radius. */
    if (!eligible("radius", f, { only: MARKUP })) continue;
    for (const tier of tiers) {
      const hit = new RegExp(tier.pattern);
      const container = new RegExp(tier.containerPattern ?? "\\bp[xy]?-([5-9]|1\\d)\\b");
      for (const el of elementsOf(f.code, tier.element)) {
        const cls = classNameOf(el.tag);
        if (!cls || !hit.test(cls)) continue;
        report("radius", tier.why ?? "Two radius tiers, and this one is on the wrong tier.",
          `${f.rel}:${lineAt(f.code, el.index)}`,
          container.test(cls) ? tier.onContainer : tier.onControl);
      }
    }
  }
}

// ── rule: the pointer target ────────────────────────────────────────────
// WCAG 2.2 §2.5.8 asks 24px of any pointer target, and an icon-only control
// usually has no accessible name either. An explicit height stands the rule
// down: somebody who wrote a height has thought about the box.
if (config.hitTarget) {
  const {
    element = "button",
    glyph = "Icon\\w*|\\w+\\.Icon",
    minPx = 24,
    padding = { "p-0": 0, "p-0.5": 2, "p-1": 4, "p-1.5": 6, "p-2": 8, "p-2.5": 10, "p-3": 12 },
    sizedPattern = "\\b(?:min-h-|h-\\d|size-\\d|min-w-)",
    assumedGlyph = 24,
    requireAccessibleName = true,
  } = config.hitTarget;
  const glyphEl = new RegExp(`<(?:${glyph})\\b`);
  const glyphSelfClosing = new RegExp(`<(?:${glyph})[^>]*/>`, "g");
  const sized = new RegExp(sizedPattern);
  for (const f of files) {
    if (!eligible("a11y", f, { only: MARKUP })) continue;
    for (const el of elementsOf(f.code, element)) {
      const close = f.code.indexOf(`</${el.name}>`, el.end);
      if (close === -1) continue;
      const body = f.code.slice(el.end + 1, close);
      if (!glyphEl.test(body)) continue;
      /* A glyph *and* a label is a normal control and none of this applies. */
      if (body.replace(glyphSelfClosing, "").trim()) continue;
      const place = `${f.rel}:${lineAt(f.code, el.index)}`;
      if (requireAccessibleName && !/aria-label|aria-labelledby|title=/.test(el.tag)) {
        report("a11y", "An icon-only control has no text for a screen reader to read.",
          place, `icon-only <${el.name}> with no accessible name — give it an aria-label`);
      }
      const cls = classNameOf(el.tag) ?? "";
      if (sized.test(cls)) continue;
      const pads = Object.keys(padding).filter((p) =>
        new RegExp(`(?<![\\w-])${p.replace(".", "\\.")}(?![\\w.\\d-])`).test(cls));
      if (!pads.length) continue;
      const sizes = [...body.matchAll(/size=\{(\d+)\}/g)].map((x) => Number(x[1]));
      const box =
        (sizes.length ? Math.max(...sizes) : assumedGlyph) +
        2 * Math.max(...pads.map((p) => padding[p]));
      if (box < minPx) {
        report("a11y", `WCAG 2.2 §2.5.8 asks ${minPx}px of any pointer target.`,
          place, `${box}px pointer target — ${pads.join(" + ")} around a ${box - 2 * Math.max(...pads.map((p) => padding[p]))}px glyph`);
      }
    }
  }
}

// ── rule: an affordance that appears on hover ───────────────────────────
// A reveal that answers hover and not focus leaves a keyboard on a control at
// `opacity: 0`. `pointer-events-none` is exempt: something unreachable is
// decoration rather than an affordance.
if (config.hoverReveal) {
  const {
    hiddenPattern = "\\bopacity-0\\b",
    hoverPattern = "(?:group-)?hover:opacity-100",
    focusPattern = "focus(?:-visible|-within)?:opacity-100|group-focus-within:opacity-100",
    exemptPattern = "pointer-events-none",
    why = "A control revealed on hover alone is invisible to a keyboard that has landed on it.",
    instead = "answer focus-visible and group-focus-within as well as hover",
  } = config.hoverReveal;
  const hidden = new RegExp(hiddenPattern);
  const hover = new RegExp(hoverPattern);
  const focus = new RegExp(focusPattern);
  const skip = new RegExp(exemptPattern);
  for (const f of files) {
    if (!eligible("reveal", f, { only: MARKUP })) continue;
    for (const m of classExpressions(f.code)) {
      const cls = m[0];
      if (!hidden.test(cls) || skip.test(cls)) continue;
      if (!hover.test(cls) || focus.test(cls)) continue;
      report("reveal", why, `${f.rel}:${lineAt(f.code, m.index)}`,
        `revealed on hover but not on focus — ${instead}`);
    }
  }
}

// ── rule: motion nobody can switch off ──────────────────────────────────
// Reduced-motion rules are written one class name at a time, so a hand-rolled
// utility animation is covered by none of them. `motion-safe:` is accepted as
// the stronger guard: it never starts, rather than being switched off after.
for (const rule of config.motionGuards ?? []) {
  const re = new RegExp(`\\b${rule.class}\\b`, "g");
  for (const f of files) {
    if (!eligible("motion", f)) continue;
    for (const m of f.code.matchAll(re)) {
      const before = f.code.slice(Math.max(0, m.index - 24), m.index);
      const after = f.code.slice(m.index, m.index + 200);
      if (/motion-safe:$/.test(before)) continue;
      if (new RegExp(`${rule.class}[^"'\`]*motion-reduce:animate-none`).test(after)) continue;
      report("motion", rule.why ?? "An animation no reduced-motion rule covers.",
        `${f.rel}:${lineAt(f.code, m.index)}`,
        rule.detail ?? `${rule.class} is not covered by any prefers-reduced-motion rule`);
    }
  }
}

// ── rule: fields ────────────────────────────────────────────────────────
// The controls people type into, which stayed outside the contract for a long
// time because every rule walked `<button>`. These are field rules, not
// use-the-house-component rules: a raw <input> is legitimate.
if (config.fields) {
  const {
    elements = "input|select|textarea",
    requireAccessibleName = true,
    nativePickers = [],
    boundaryBans = [],
    radius = null,
    skipIn = [],
  } = config.fields;
  /* A field that renders nothing a person can see or aim at has no geometry
     to get wrong, and nothing to name. `hidden` is `display: none` — the
     file picker behind a styled drop zone, reached only by the click that
     opens it. `sr-only` is *not* the same exemption: that control is still
     the control, so it keeps every rule including its name. */
  const INVISIBLE = /type=["'{\s]*(?:hidden|submit|image|button|reset)\b/;
  const internal = skipIn.map((p) => new RegExp(p));
  for (const f of files) {
    if (!eligible("field", f, { only: MARKUP })) continue;
    const inKit = internal.some((re) => re.test(f.rel));
    for (const el of elementsOf(f.code, elements)) {
      const cls = classNameOf(el.tag) ?? "";
      const place = `${f.rel}:${lineAt(f.code, el.index)}`;
      if (INVISIBLE.test(el.tag) || /(?<![\w-])hidden(?![\w-])/.test(cls)) continue;

      /* A native date or time control renders as a different widget in every
         browser, cannot be themed in Safari, and shows its value in the
         *operating system's* locale rather than the app's — so one person
         reads 26/08/2026 and the next reads 8/26/2026, which are different
         days. Worth banning platform-wide, with the one argued exception
         being a date of birth, where the native control has a typeable year
         and a month grid is hundreds of chevron presses. */
      for (const picker of nativePickers) {
        const m = el.tag.match(new RegExp(`type=["'{\\s]*(${picker.types ?? "date|time|datetime-local|month|week"})\\b`));
        if (m) {
          report("field", picker.why ?? "A native picker shows the OS locale, not the app's.",
            place, `<input type="${m[1]}"> — ${picker.instead ?? "use the app's own picker"}`);
        }
      }

      /* An accessible name. WCAG 2.2 §3.3.2 and §4.1.2: a placeholder is not
         a label. It is the browser's grey hint, it disappears the moment
         somebody types, and several screen readers never announce it.
         An `id` counts as named here, deliberately — the label may be a
         `<label htmlFor>` in this file or a wrapper rendering one from a
         prop, and chasing the second across components is more machinery
         than this check should carry. What is caught is the shape that is
         always wrong: a field with a placeholder and nothing else. */
      if (requireAccessibleName && !inKit) {
        const named =
          /aria-label(?:ledby)?=/.test(el.tag) ||
          /\bid=/.test(el.tag) ||
          ancestorsOf(f.code, el.index).some(
            (a) => a.name === "label" || /\b(?:aria-)?label=/.test(a.tag));
        if (!named) {
          report("field", "A placeholder is not a label (WCAG 2.2 §3.3.2).", place,
            `<${el.name}> has no accessible name — give it an id its <label> points at, or an aria-label`);
        }
      }

      if (!cls || inKit) continue;
      /* A box, not an edge. WCAG 2.2 §1.4.11 asks 3:1 of the boundary
         somebody needs *to find the control*, and a single `border-b` under
         a full-bleed input inside a dialog that already frames it is not
         that. The first version of this rule flagged a command palette's
         field and was wrong to. */
      const boxed =
        /\bborder(?:-(?:[0-9]|\S+))?(?:\s|$)/.test(cls) && !/\bborder-[btlrxy]\b/.test(cls);
      if (!boxed) continue;
      if (radius) {
        const m = cls.match(/\brounded-(\w+)\b/);
        if (m && !(radius.allowed ?? []).includes(m[1])) {
          report("field", radius.why ?? "One field radius.", place,
            `rounded-${m[1]} on a field — the field radius is ${(radius.allowed ?? []).join(" / ")}`);
        }
      }
      for (const ban of boundaryBans) {
        if (new RegExp(ban.pattern).test(cls)) {
          report("field", ban.why ?? "The box is the control, so its boundary needs 3:1 (WCAG 2.2 §1.4.11).",
            place, ban.detail ?? `${ban.pattern} on a field`);
        }
      }
    }
  }
}

// ── rule: a raw image ───────────────────────────────────────────────────
// A raw <img> renders the browser's broken glyph on a dead URL. The allowlist
// is by file and each entry states its reason: a rule with no sanctioned home
// for what it bans earns a disable comment in its first week.
if (config.imageComponent) {
  const { component, element = "img", allow = [], why } = config.imageComponent;
  const allowed = allow.map((a) => new RegExp(typeof a === "string" ? a : a.path));
  for (const f of files) {
    if (!eligible("media", f, { only: MARKUP })) continue;
    if (allowed.some((re) => re.test(f.rel))) continue;
    if (/\.stories\.(tsx|jsx)$/.test(f.rel)) continue;
    for (const m of f.code.matchAll(new RegExp(`<${element}\\b`, "g"))) {
      report("media", why ?? "An image with no fallback renders the browser's broken glyph.",
        `${f.rel}:${lineAt(f.code, m.index)}`,
        `a raw <${element}> — use ${component}, which carries the fallback, the frame and the loading attributes`);
    }
  }
}

// ── rule: a hand-rolled shell ───────────────────────────────────────────
// A flat outlined rectangle where the doc specifies a component. The exempt
// shapes matter: a border carrying state cannot convert, because a hairline
// drawn as an inset ring inside a box-shadow has no variant to toggle.
for (const rule of config.shells ?? []) {
  const hit = new RegExp(rule.pattern);
  const requires = (rule.requires ?? []).map((p) => new RegExp(p));
  const exempt = (rule.exempt ?? []).map((p) => new RegExp(p));
  for (const f of files) {
    if (!eligible(rule.rule ?? "surface", f, { only: MARKUP })) continue;
    for (const m of classExpressions(f.code)) {
      const cls = m[0];
      if (!hit.test(cls)) continue;
      if (!requires.every((re) => re.test(cls))) continue;
      if (exempt.some((re) => re.test(cls))) continue;
      report(rule.rule ?? "surface", rule.why ?? "A shell that should have come from the component.",
        `${f.rel}:${lineAt(f.code, m.index)}`, rule.detail);
    }
  }
}

// ── rule: a flex child that will not shrink ─────────────────────────────
// `flex-1 overflow-y-auto` without `min-h-0`: a flex item defaults to
// min-content and will not shrink, so the pane grows past its frame and an
// `h-full` child resolves against it and grows a second scrollbar.
if (config.flexShrink) {
  const axes = config.flexShrink.axes ?? ["y"];
  const AXIS = {
    y: { overflow: /\boverflow-y-(?:auto|scroll)\b/, fix: "min-h-0", dim: "height" },
    x: { overflow: /\boverflow-x-(?:auto|scroll)\b/, fix: "min-w-0", dim: "width" },
  };
  for (const f of files) {
    if (!eligible("layout", f, { only: MARKUP })) continue;
    for (const m of classExpressions(f.code)) {
      const cls = m[0];
      if (!/\bflex-1\b/.test(cls)) continue;
      for (const axis of axes) {
        const a = AXIS[axis];
        if (!a || !a.overflow.test(cls) || new RegExp(`\\b${a.fix}\\b`).test(cls)) continue;
        report("layout", "A flex child defaults to min-content and will not shrink below it.",
          `${f.rel}:${lineAt(f.code, m.index)}`,
          `a flex-1 scroller with no ${a.fix} — it grows past its frame, and an h-full child grows a second scrollbar inside it`);
      }
    }
  }
}

// ── rule: a type token used as a fill ───────────────────────────────────
// A token meant for type, border and ring used as a ground under text. The
// two are the same hue on light and diverge on dark, so it is unreadable in
// exactly one theme and every screenshot looks fine.
for (const rule of config.inkAsFill ?? []) {
  const fill = new RegExp(rule.fillPattern);
  const onIt = new RegExp(rule.textPattern);
  const exempt = rule.exemptPattern ? new RegExp(rule.exemptPattern) : null;
  for (const f of files) {
    if (!eligible("ink-as-fill", f, { only: MARKUP })) continue;
    for (const m of classExpressions(f.code)) {
      const ink = fill.exec(m[0]);
      if (!ink || !onIt.test(m[0])) continue;
      if (exempt && exempt.test(m[0])) continue;
      report("ink-as-fill", rule.why ?? "A type token carrying text inverts with the theme.",
        `${f.rel}:${lineAt(f.code, m.index)}`,
        rule.detail ? `${ink[0]} — ${rule.detail}` : `${ink[0]} carries text, and it inverts with the theme`);
    }
  }
}

// ── report ──────────────────────────────────────────────────────────────
const LIMIT = Number(flag("max") ?? 12);

const held = RULES.filter((r) => r.on(config)).map((r) => r.name);
const off = RULES.filter((r) => !r.on(config)).map((r) => r.name);

if (!findings.length) {
  const n = `${files.length} file${files.length === 1 ? "" : "s"}`;
  console.log(`✓ design-check: ${n}, nothing drifted.`);
  console.log(`  held: ${held.join(", ")}`);
  /* A rule that is off has verified nothing, and a green line that does not
     say so lets a config with three rules on read exactly like one with
     twenty. That is the same mistake as a skipped test lane reported as a
     pass: the output has to distinguish "checked and clean" from "not
     checked". */
  if (off.length) console.log(`  off: ${off.join(", ")} — ${off.length} rule(s) verified nothing`);
  process.exit(0);
}

const byRule = new Map();
for (const x of findings) byRule.set(x.rule, [...(byRule.get(x.rule) ?? []), x]);

console.error(`\n✗ design-check: ${findings.length} finding(s) in ${files.length} files\n`);
/* Grouped by rule, and *within* a rule by the argument behind it. One rule
   name can carry several arguments — a `layout` group holding both the
   side-stripe ban and the flex-shrink fault is the normal case, not an edge
   one — and printing the first argument above all of them states a reason
   that does not justify what is underneath it. Which is the one thing the
   report cannot be allowed to do, since every rule here is supposed to be
   traceable to the sentence that earned it. */
for (const [rule, list] of byRule) {
  console.error(`  ── ${rule} (${list.length}) ──`);
  const byWhy = new Map();
  for (const x of list) byWhy.set(x.why, [...(byWhy.get(x.why) ?? []), x]);
  for (const [why, group] of byWhy) {
    console.error(`     ${why}`);
    for (const x of group.slice(0, LIMIT)) console.error(`       ${x.place}  ${x.detail}`);
    if (group.length > LIMIT) console.error(`       … and ${group.length - LIMIT} more`);
  }
  const limits = limitsFor.get(rule);
  if (limits) console.error(`     cannot tell: ${limits}`);
  console.error("");
}
console.error(`${config.docPath ?? "DESIGN.md"} has the reasoning for each of these.`);
console.error(`${held.length} of ${RULES.length} rules on${off.length ? `; off: ${off.join(", ")}` : ""}.\n`);
process.exit(1);
