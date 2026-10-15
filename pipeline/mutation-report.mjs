/**
 * Stryker's JSON report, bucketed by which rule each surviving mutant falls
 * inside, worst-covered first.
 *
 *     node pipeline/mutation-report.mjs [report.json] [--min=N]
 *
 * Stryker's own output is ordered by file position, which answers nothing.
 * The rule headers already in design-check.mjs are the section map, so there
 * is nothing here to keep in step with the engine.
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
