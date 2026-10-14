#!/usr/bin/env node
/**
 * The rules in your design doc that a machine can hold, held.
 *
 *     node enforce/design-check.mjs
 *     node enforce/design-check.mjs --config path/to/design-check.config.mjs
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 * A design system written down is a claim. A design system that runs is a
 * contract. Nothing in a normal toolchain closes that gap: `tsc` cannot see
 * a class name, eslint has no opinion about a border radius, and a test
 * suite is perfectly green on a button with no focus ring.
 *
 * So every rule drifts. Not through carelessness — through the ordinary
 * accumulation of a hundred small decisions made by people who did not read
 * 2,000 lines of prose first. On one audit of my own app I found a grey
 * failing contrast in sixteen places, five card radii where one was meant,
 * a colour the doc explicitly retired still sitting in the stylesheet, and
 * em dashes in copy the same document banned them from. Each had been
 * written down. Each drifted anyway, because a rule nobody runs is a rule
 * nobody keeps.
 *
 * ── What this deliberately does NOT check ────────────────────────────────
 * Composition. Whether a section earns its place, whether the tonal arc
 * reads, whether a headline is any good. Those are the parts of a design
 * doc worth a person's judgement, and a check that pretended to have an
 * opinion about them would produce noise — and noise teaches people to pass
 * `--force`, which costs you every rule at once.
 *
 * ── The shape of a rule ──────────────────────────────────────────────────
 * Every rule carries a `why`, and the report prints it. A check with no
 * argument behind it gets deleted the first time it is inconvenient, and
 * that is the correct outcome for a check with no argument behind it.
 *
 * Every rule reads source *with comments stripped*. A rule that fires on
 * the prose explaining why something is banned is a rule that punishes
 * writing the explanation down.
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
 * Blank out comments, preserving offsets, skipping over string literals.
 *
 * Three hard-won properties, each of which I got wrong first:
 *
 * 1. **Offsets are preserved, never removed.** Line numbers are counted by
 *    newlines, so a comment is blanked in place. Deleting it shifts every
 *    index after it and reports the wrong line, which is worse than no line
 *    at all because somebody goes and looks.
 *
 * 2. **It has to know what a string is.** A regex for `/*` cannot tell a
 *    comment from `accept="image/*"` — and on one file that attribute opened
 *    a comment that ran hundreds of lines to the next `*​/`, blanking
 *    everything between. Every rule then read a file that does not exist and
 *    reported true statements about it.
 *
 * 3. **Strings are skipped, not blanked.** Class names, aria labels and
 *    `accept` values all live in strings, and every rule needs them.
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

// ── report ──────────────────────────────────────────────────────────────
const LIMIT = Number(flag("max") ?? 12);

if (!findings.length) {
  const held = [...new Set(["palette", "type", "icon", "state", "contrast", "copy", "tokens"])];
  const n = `${files.length} file${files.length === 1 ? "" : "s"}`;
  console.log(`✓ design-check: ${n}, nothing drifted (${held.join(", ")}).`);
  process.exit(0);
}

const byRule = new Map();
for (const x of findings) byRule.set(x.rule, [...(byRule.get(x.rule) ?? []), x]);

console.error(`\n✗ design-check: ${findings.length} finding(s) in ${files.length} files\n`);
for (const [rule, list] of byRule) {
  console.error(`  ── ${rule} (${list.length}) ──`);
  console.error(`     ${list[0].why}`);
  for (const x of list.slice(0, LIMIT)) console.error(`     ${x.place}  ${x.detail}`);
  if (list.length > LIMIT) console.error(`     … and ${list.length - LIMIT} more`);
  console.error("");
}
console.error(`${config.docPath ?? "DESIGN.md"} has the reasoning for each of these.\n`);
process.exit(1);
