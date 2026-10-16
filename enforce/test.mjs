/**
 * Tests the checker against the fixture.
 *
 *     node enforce/test.mjs
 *
 * The negative cases are the ones that matter: any regex catches a
 * violation, and the hard part is leaving a deliberate pattern alone. Each
 * one here is a bug this checker has actually had.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, cpSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
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
let passed = 0;
const check = (name, condition, detail = "") => {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  }
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
check("33 findings in 5 files", total === 33, `got ${total}`);

console.log("\nrules fire");
const expected = {
  palette: 4,
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
  focus: 3, // an attribute, a string constant and a template literal
  radius: 4, // an arbitrary value, a banned class, and both tiers
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
/* **The two assertions below are the only ones allowed to name a line,
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
  countFor("focus") === 3,
  "focus-visible:outline-none beside focus-visible:bg-* must not fire",
);
check(
  "a radius carried by a named variable is a role chosen elsewhere",
  countFor("radius") === 4 && !out.includes("--site-radius"),
  "rounded-[var(--site-radius)] must not fire; the other four radius findings must",
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
  "a submit or button input has nothing to announce and no box to get wrong",
  countFor("field") === 3 && !/value="(?:Save|Cancel)"/.test(out),
  "hidden, file, submit and button are the four the field rule skips",
);
check(
  "aria-labelledby names a field, as much as an id or a wrapper does",
  !out.includes("query-label"),
  "the third of the three ways a field can be named",
);
check(
  "a single border edge is not the boundary that identifies a control",
  !out.includes("rounded-md on a field — the field radius") ||
    (out.match(/rounded-md on a field/g) ?? []).length === 1,
  "border-b under a full-bleed input is a divider; WCAG 2.2 §1.4.11 wants a box",
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

/* The section dividers in the engine are load-bearing: mutation-report.mjs
   buckets survivors by them, so losing one silently misattributes hundreds of
   mutants and still prints a plausible table. Nine went missing at once when
   the comments were leaned, and nothing caught it. A count is a blunt guard
   and it is the one that would have. Adding a rule means bumping it on
   purpose. */
console.log("\nthe engine keeps its section structure");
{
  const engine = readFileSync(join(HERE, "design-check.mjs"), "utf8");
  const headers = engine.match(/^\/\/ ── rule: .+$/gm) ?? [];
  check("21 rule dividers in design-check.mjs", headers.length === 21, `got ${headers.length}`);
  check(
    "every divider is padded to the same width",
    headers.every((h) => h.length === headers[0].length),
    "a short divider is a sign one was hand-written rather than copied",
  );
}

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
check("each rule prints its justification", /── palette \(4\) ──\n\s+A retired hue/.test(out));
check(
  "a rule carrying two arguments prints both, each above its own findings",
  /── layout \(2\) ──\n\s+Side-stripe borders[^\n]*\n\s+\S[^\n]*\n\s+A flex child/.test(out),
  "one argument printed over findings it does not justify is the one thing the report cannot do",
);
check("the design doc is cited", out.includes("DESIGN.md has the reasoning"));

/* ── --fix ──────────────────────────────────────────────────────────────
   Run against a copy, because these assertions are about what changed on
   disk. The negative cases are again the ones that matter: a fixer is easy
   to make satisfy a rule and easy to make rewrite something nobody asked
   it to. */
console.log("\n--fix applies the mechanical findings");

const SANDBOX = mkdtempSync(join(tmpdir(), "design-contract-fix-"));
cpSync(FIXTURE, SANDBOX, { recursive: true });

const runFix = () => {
  try {
    return {
      out: execFileSync(process.execPath, [join(HERE, "design-check.mjs"), "--fix"], {
        cwd: SANDBOX, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      }),
      status: 0,
    };
  } catch (e) {
    return { out: `${e.stdout ?? ""}${e.stderr ?? ""}`, status: e.status };
  }
};

const first = runFix();
const read = (rel) => readFileSync(join(SANDBOX, rel), "utf8");
const violations = read("src/violations.tsx");
const interaction = read("src/interaction.tsx");

check("it reports the number of fixes and the files touched",
  /✎ design-check --fix: 7 fix\(es\) in 2 file\(s\)/.test(first.out), first.out.split("\n")[1]);
check("the findings left are counted, not reprinted as resolved",
  /26 finding\(s\) still need a decision/.test(first.out));
check("it still exits non-zero while findings remain", first.status === 1, `got ${first.status}`);
check("it says to look at the result",
  /screenshot the routes you changed/.test(first.out),
  "a rewrite that satisfies a rule and moves the page is still wrong, and no rule in here can tell which happened");

console.log("\neach fix lands on the target the config named");
check("a type literal becomes the ramp class", violations.includes('className="text-xs bg-clip-text'));
check("a renamed scale keeps its prefix and its shade", violations.includes("bg-accent-500"));
check("a retired hex becomes the token", violations.includes("text-[var(--accent)]"));
check("a stroke width becomes the one in the ramp", violations.includes("strokeWidth={1.75}"));
check("a banned radius becomes the legal one", violations.includes("rounded-2xl text-ink-secondary"));
/* The shape a real tree needed: `text-slate-600` became `text-ink-secondary`
   there, and a hue-segment swap would have written `text-ink-secondary-600`. */
check("a hue retired for a semantic token drops the shade",
  violations.includes("text-ink-secondary") && !violations.includes("ink-secondary-700"));
check("the flex scroller gains the class the rule named",
  /className="flex-1 overflow-y-auto min-h-0">Grows past its frame/.test(interaction));

console.log("\nwhat --fix must not touch");
/* The load-bearing one. Offsets come from the stripped copy and are spliced
   into the raw file, so a stripper that moved a byte would rewrite a
   comment. This fixture comment names a retired hue and uses an em dash
   precisely so that mistake cannot pass. */
check("a comment naming a retired hue and holding an em dash is untouched",
  violations.includes("it names bg-indigo-500") && violations.includes("uses an em dash —"),
  "offsets come from the stripped copy and are applied to the raw file");
check("a retired hex with no replacement declared is left alone",
  read("src/tokens.css").includes("#6c63ff") || violations.includes("#4338ca") ||
    !/#4f46e5/.test(violations),
  "a hue the doc has not decided about stays a finding");
/* Counted on the line, not in the file: the fixture's own comment mentions
   the class, and a file-wide count quietly asserts the comment too. */
const correctPane = interaction.split("\n").find((l) => l.includes("Shrinks correctly")) ?? "";
check("an already-correct pane does not gain a second min-h-0",
  (correctPane.match(/min-h-0/g) ?? []).length === 1,
  `got ${(correctPane.match(/min-h-0/g) ?? []).length} on that line`);
check("an off-ramp icon size is not guessed at", violations.includes("size={22}"),
  "four candidates, and the right one depends on the type beside it");
check("the disabled pair is not chosen for you", violations.includes("aria-disabled:opacity-50"),
  "two allowed values means picking one is a decision");
/* Decided by evidence, not taste: four em dashes in a real tree were
   repaired four different ways — a colon, a comma, a middot, and one
   deletion — so any default would have been wrong three times in four. */
check("a banned copy pattern is never rewritten", violations.includes("Pricing — simple"),
  "a ban names a prohibition, not a target");

console.log("\nrunning it again changes nothing");
const second = runFix();
check("the second run finds nothing mechanical left",
  /none of them mechanical/.test(second.out), second.out.split("\n")[1]);
check("and says so rather than reporting a clean tree", second.status === 1, `got ${second.status}`);
check("the file is byte-identical after the second run",
  read("src/violations.tsx") === violations);

console.log("");
if (failures.length) {
  console.error(`✗ ${failures.length} assertion(s) failed\n`);
  console.error(out);
  process.exit(1);
}
/* Counted from what ran, not written down. A hand-maintained total rots
   exactly the way a hand-maintained design rule does, and this repo should
   not demonstrate its own problem in its own test output. */
console.log(`✓ all ${passed} assertion(s) passed\n`);
