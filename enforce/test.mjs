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
check("27 findings in 5 files", total === 27, `got ${total}`);

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
  focus: 1,
  radius: 1,
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
  countFor("focus") === 1,
  "focus-visible:outline-none beside focus-visible:bg-* must not fire",
);
check(
  "a radius carried by a named variable is a role chosen elsewhere",
  countFor("radius") === 1,
  "rounded-[var(--site-radius)] must not fire",
);
check(
  "an explicit height stands the pointer-target rule down",
  !/interaction\.tsx:26\b/.test(out),
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
  !/interaction\.tsx:(6[5-9])\b/.test(out),
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
