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
check("14 findings in 3 files", total === 14, `got ${total}`);

console.log("\nrules fire");
const expected = {
  palette: 3,
  "gradient-text": 1,
  layout: 1,
  plate: 1,
  seam: 1,
  contrast: 1,
  type: 1,
  icon: 2,
  state: 1,
  copy: 1,
  tokens: 1,
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

console.log("\nreport shape");
check("each rule prints its justification", /── palette \(3\) ──\n\s+A retired hue/.test(out));
check("the design doc is cited", out.includes("DESIGN.md has the reasoning"));

console.log("");
if (failures.length) {
  console.error(`✗ ${failures.length} assertion(s) failed\n`);
  console.error(out);
  process.exit(1);
}
console.log("✓ all assertions passed\n");
