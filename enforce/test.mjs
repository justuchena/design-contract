#!/usr/bin/env node
/**
 * Tests the checker against the fixture.
 *
 *     node enforce/test.mjs
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 * This repo's whole argument is that a rule nobody runs is a rule nobody
 * keeps. A checker with no test is exactly that: the rules would keep
 * passing long after they stopped firing, and a rule that silently stops
 * firing is worse than no rule, because you believe you are covered.
 *
 * The negative cases matter more than the positive ones. Any regex catches
 * a violation. The hard part is *not* reporting the comment that explains
 * the ban, the `aria-hidden` glyph that is legitimately decorative, and the
 * `accept="image/*"` attribute that once ate half a file.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, "fixture");

let out;
let status = 0;
try {
  out = execFileSync(process.execPath, [join(HERE, "design-check.mjs")], {
    cwd: FIXTURE,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (e) {
  out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
  status = e.status;
}

const failures = [];
const check = (name, condition, detail = "") => {
  if (condition) console.log(`  ✓ ${name}`);
  else {
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
    failures.push(name);
  }
};

const countFor = (rule) => {
  const m = out.match(new RegExp(`── ${rule} \\((\\d+)\\)`));
  return m ? Number(m[1]) : 0;
};
const total = Number(out.match(/(\d+) finding\(s\)/)?.[1] ?? -1);

console.log("\nexit code");
check("non-zero when findings exist", status === 1, `got ${status}`);

console.log("\ntotals");
check("30 findings in 5 files", total === 30, `got ${total}`);

console.log("\nrules fire");
const expected = {
  palette: 3,
  "gradient-text": 1,
  layout: 2, // the side-stripe ban and the flex-shrink fault, one each
  plate: 1,
  seam: 1,
  contrast: 1,
  type: 1,
  icon: 2,
  state: 1,
  copy: 1,
  tokens: 1,
  /* The interaction rules. */
  focus: 2, // one on an attribute, one in a class constant
  radius: 3, // an arbitrary value, and both tiers
  a11y: 2, // the 22px target, and the nameless icon-only button
  reveal: 1,
  motion: 1,
  field: 3, // no name, a native picker, a field radius
  media: 1,
  surface: 1,
  "ink-as-fill": 1,
};
for (const [rule, n] of Object.entries(expected)) {
  check(`${rule} reports ${n}`, countFor(rule) === n, `got ${countFor(rule)}`);
}

/* The negative cases. Each one is a bug this checker has actually had. */
console.log("\nnegative cases (the ones that matter)");
check(
  "the comment naming a retired hue is not reported",
  !/violations\.tsx:3\b/.test(out) && !out.includes("bg-indigo-500"),
  "a comment explaining a ban must not trip the ban",
);
check(
  "the em dash inside a comment is not reported",
  countFor("copy") === 1,
  "only the em dash in the <h1> should fire",
);
check(
  'accept="image/*" does not open a comment and swallow the file',
  countFor("icon") === 2 && countFor("state") === 1,
  "rules after the attribute still see their markup",
);
check(
  "aria-hidden exempts a decorative glyph from the contrast floor",
  countFor("contrast") === 1,
  "the aria-hidden span must not fire",
);
check(
  "a .dark theme block may redeclare a token",
  countFor("tokens") === 1,
  "only the cross-sheet duplicate should fire",
);
/* ⚠️ **The two assertions below are the only ones allowed to name a line,
   and both earn it.** One is *about* line numbers; the other is about a
   specific comment. Both live in `violations.tsx`, which is frozen for this
   reason — every line-number assertion written against `interaction.tsx`
   has already broken once, on the first run that added a case to it. A test
   pinned to a line number is a test about the fixture's layout. */
check(
  "line numbers survive comment blanking",
  /violations\.tsx:(9|10|11)\b/.test(out),
  "offsets must be preserved, not deleted",
);

/* The interaction rules' negative cases. Each of these is a pattern a real
   codebase uses deliberately, and each one was reported by an early version
   of the rule beside it. A rule that cannot tell the deliberate pattern from
   the leftover is a rule that gets switched off. */
console.log("\nnegative cases (the interaction rules)");
check(
  "an outline suppressed WITH a substitute is a decision, not a leftover",
  countFor("focus") === 2,
  "focus-visible:outline-none beside focus-visible:bg-* must not fire",
);
check(
  "a radius carried by a named variable is a role chosen elsewhere",
  countFor("radius") === 3 && !out.includes("--site-radius"),
  "rounded-[var(--site-radius)] must not fire; the other three radius findings must",
);
check(
  "an explicit height stands the pointer-target rule down",
  /* The exempt control is `min-h-11 p-1` around a 14px glyph, which is the
     same geometry as the one that fires. So if the rule stopped standing
     down, this exact detail would print twice rather than once. Counted
     rather than pinned to a line: a line number is a fact about the
     fixture's layout, and asserting one makes every added case a failure. */
  (out.match(/22px pointer target/g) ?? []).length === 1,
  "min-h-11 means somebody thought about the box",
);
check(
  "a glyph beside a label is an ordinary control",
  countFor("a11y") === 2,
  "only the icon-only buttons should fire",
);
check(
  "a reveal that answers focus, and one that cannot be reached, are both fine",
  countFor("reveal") === 1,
  "focus-visible:opacity-100 and pointer-events-none are the two exemptions",
);
check(
  "motion-safe: is the stronger guard and must not be reported",
  countFor("motion") === 1,
  "motion-safe: never starts the animation at all",
);
check(
  "a wrapping <label> names the field it contains, across no id at all",
  countFor("field") === 3,
  "this is the case the ancestor walk exists for",
);
check(
  "an invisible field has no geometry to get wrong and nothing to announce",
  /* Asserted on content, not on a line range. The original pinned
     `interaction.tsx:65-69` and broke the first time the fixture gained a
     case above it, which makes it a test about the fixture's layout rather
     than about the rule. */
  countFor("field") === 3 && !/type="(?:hidden|file)"/.test(out),
  "type=hidden and the sr-only file picker are exempt",
);
check(
  "the primitive that owns <img> is allowed, and the kit is skipped for names",
  countFor("media") === 1 && !out.includes("kit/media.tsx"),
  "a rule with no sanctioned home for what it bans cannot be satisfied",
);
check(
  "a border that carries state would lose the affordance if it converted",
  countFor("surface") === 1,
  "data-[over=true]:border-* is the exemption",
);
check(
  "a bare ink fill with nothing written on it is a mark, not a ground",
  countFor("ink-as-fill") === 1,
  "the rule fires only when the token carries text",
);
check(
  "min-h-0 satisfies the flex-shrink rule",
  countFor("layout") === 2,
  "one side-stripe and one unshrinkable scroller, and not the fixed pane",
);

/* What the run could NOT tell you, which is the half a `why` leaves out.
   On one real audit three rules reported a decision rather than drift and
   nothing in the output hinted that they could not tell the difference. A
   reader then either edits correct code or stops trusting the run. */
console.log("\nlimits, and coverage");
check(
  "a rule with a blind spot states it, under its own findings",
  /── surface \(1\) ──[\s\S]*?cannot tell: it cannot tell an object from a region/.test(out),
  "the surface rule's blind spot is the one that cost the most on a real tree",
);
check(
  "the limits line is not mistaken for a finding",
  !/cannot tell:.*\.tsx:\d+/.test(out),
  "it carries no file and no line",
);
check(
  "the failing report says how many rules were on",
  /\b(\d+) of (\d+) rules on\b/.test(out),
  "a run that does not say what it covered cannot be read",
);

/* A rule that is off has verified nothing. A green line that does not say so
   lets a config with one rule on read exactly like one with all of them,
   which is the same mistake as a skipped test lane reported as a pass. */
/* The engine is the source of truth for how many rules there are, and the
   docs are checked against it rather than trusted. A hand-maintained count
   of what the checker holds rots exactly the way a hand-maintained design
   rule does, and this repo should not demonstrate its own problem. */
/* Both of these came out of the first mutation run, and neither was visible
   from a green suite. */
console.log("\nwhat mutation testing found missing");
check(
  "the focus rule reads a class list held in a constant, not only an attribute",
  /focus-visible:outline-none with nothing put back/.test(out) &&
    /focus:outline-none with nothing put back/.test(out),
  "22 mutants in CONST_EXPR survived at once: the branch was documented and never executed",
);
check(
  "the radius tier rule is actually triggered, not merely configured",
  /rounded-2xl on a control/.test(out) && /rounded-2xl on a card/.test(out),
  "it had config and no fixture case, so the whole branch was dead",
);

/* A rule that is off has verified nothing, and until this ran the suite had
   only ever used one fully-populated config — so every `config.x?.length`
   guard was unreached. 20 OptionalChaining and UnaryOperator mutants
   survived at a flat 0%, which is the signature of exactly that. */
let sparse;
let sparseStatus = 0;
try {
  sparse = execFileSync(
    process.execPath,
    [join(HERE, "design-check.mjs"), "--config", "minimal.config.mjs"],
    { cwd: FIXTURE, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
} catch (e) {
  sparse = `${e.stdout ?? ""}${e.stderr ?? ""}`;
  sparseStatus = e.status;
}
check(
  "a config with eighteen rules absent does not crash",
  sparseStatus === 1 && /1 finding\(s\)/.test(sparse),
  `got status ${sparseStatus}`,
);
check(
  "it reports how few rules were on",
  /\b1 of 19 rules on\b/.test(sparse),
  "a sparse run must not read like a full one",
);
check(
  "it names every rule that is off",
  /off: palette, type, icon/.test(sparse) && /\(your bans\)/.test(sparse),
  "a rule that is off has verified nothing",
);
check(
  "a rule that is off reports nothing at all",
  !/── (?:palette|surface|a11y|focus) \(/.test(sparse),
  "only the one configured rule may fire",
);

console.log("\nthe rule count is derived, not asserted in prose");
const engineCount = Number(out.match(/\b\d+ of (\d+) rules on\b/)?.[1] ?? -1);
check("the engine reports a rule count", engineCount > 0, `got ${engineCount}`);
for (const doc of ["README.md", "SKILL.md"]) {
  const text = readFileSync(join(HERE, "..", doc), "utf8");
  const claimed = [...text.matchAll(/\b(\d+) rules\b/g)].map((m) => Number(m[1]));
  check(
    `${doc} claims the number the engine actually has`,
    claimed.length > 0 && claimed.every((n) => n === engineCount),
    `doc says ${claimed.join("/") || "nothing"}, engine says ${engineCount}`,
  );
}

console.log("\nreport shape");
check("each rule prints its justification", /── palette \(3\) ──\n\s+A retired hue/.test(out));
check(
  "a rule carrying two arguments prints both, each above its own findings",
  /── layout \(2\) ──\n\s+Side-stripe borders[^\n]*\n\s+\S[^\n]*\n\s+A flex child/.test(out),
  "one argument printed over findings it does not justify is the one thing the report cannot do",
);
check("the design doc is cited", out.includes("DESIGN.md has the reasoning"));

console.log("");
if (failures.length) {
  console.error(`✗ ${failures.length} assertion(s) failed\n`);
  console.error(out);
  process.exit(1);
}
console.log("✓ all assertions passed\n");
