#!/usr/bin/env node
/**
 * Stryker's JSON report → which rules the surviving mutants cluster in.
 *
 *     npm run mutate            # writes .cache/mutation/report.json
 *     node pipeline/mutation-report.mjs
 *
 * ── Why this exists rather than reading Stryker's own output ──────────────
 * Because the number is the least useful part, and the clear-text report is
 * a thousand lines of diffs ordered by file position, which is the one
 * ordering that answers nothing. What you want to know is *which rule* has
 * tests that only look like tests, and the file already says where each rule
 * starts: every rule in `design-check.mjs` opens with a `// ── rule: …`
 * header. So mutants are bucketed by the rule they fall inside, and the
 * worst-covered rule is printed first.
 *
 * That is the whole tool, and it changed the conclusion twice. A flat 48.95%
 * said "the suite is weak". Bucketed, the same run said: the radius tier
 * branch is dead, no test runs a sparse config, and the focus rule's
 * class-constant half has never executed. Three specific defects, each a few
 * lines of fixture, rather than one discouraging percentage.
 *
 * ⚠️ **Ignored mutants are excluded from both halves of the ratio.** A
 * mutant the config deliberately excludes is not a gap in the tests, and
 * counting it as a kill flatters every rule it sits in. I had this wrong in
 * the first pass and it inflated the per-rule table by about ten points.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = process.argv[2] ?? join(ROOT, ".cache/mutation/report.json");
const MIN = Number(process.argv.find((a) => a.startsWith("--min="))?.slice(6) ?? 10);

if (!existsSync(REPORT)) {
  console.error(`mutation-report: no report at ${REPORT}`);
  console.error("Run `npm run mutate` first.");
  process.exit(2);
}

const report = JSON.parse(readFileSync(REPORT, "utf8"));

for (const [path, file] of Object.entries(report.files ?? {})) {
  const lines = file.source.split("\n");
  /* The file's own rule headers are the section map. Nothing to maintain
     here: add a rule with a header and it shows up in this table. */
  const headers = [];
  lines.forEach((line, i) => {
    const m = line.match(/^\s*\/\/ ── (.+?) ─+/);
    if (m) headers.push({ at: i + 1, name: m[1] });
  });
  const sectionOf = (line) => {
    let name = "(helpers, setup and report)";
    for (const h of headers) {
      if (h.at <= line) name = h.name;
      else break;
    }
    return name;
  };

  const live = new Map();
  const killed = new Map();
  const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
  for (const mutant of file.mutants ?? []) {
    if (mutant.status === "Ignored") continue;
    const section = sectionOf(mutant.location.start.line);
    bump(live, section);
    if (mutant.status !== "Survived" && mutant.status !== "NoCoverage") bump(killed, section);
  }

  const rows = [...live]
    .map(([name, n]) => ({ name, n, k: killed.get(name) ?? 0, score: (100 * (killed.get(name) ?? 0)) / n }))
    .filter((r) => r.n >= MIN)
    .sort((a, b) => a.score - b.score);

  const total = [...live.values()].reduce((a, b) => a + b, 0);
  const dead = [...killed.values()].reduce((a, b) => a + b, 0);
  console.log(`\n${path} — ${((100 * dead) / total).toFixed(1)}% of ${total} live mutants killed`);
  console.log(`(rules with fewer than ${MIN} live mutants are hidden; --min=N changes that)\n`);
  const w = Math.max(...rows.map((r) => r.name.length), 10);
  for (const r of rows) {
    const bar = "█".repeat(Math.round(r.score / 5)).padEnd(20, "·");
    console.log(`  ${r.name.padEnd(w)}  ${bar} ${r.score.toFixed(0).padStart(3)}%  ${r.k}/${r.n}`);
  }
  console.log(`\nThe top of that list is where to add a fixture case. A rule near the`);
  console.log(`bottom is not necessarily well tested, only hard to mutate meaningfully.\n`);
}
