#!/usr/bin/env node
/**
 * Shoot the app, apply the mechanical fixes, shoot it again, and say what moved.
 *
 *     node pipeline/fix-gate.mjs --base http://localhost:5173 --routes / /pricing
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 * `design-check --fix` can only ever satisfy a rule. Whether the page still
 * says what it said before is a different question, and no rule in this repo
 * can answer it: `min-h-0` is *supposed* to change the layout, and a retired
 * hue swapped for a token is supposed to change the colour. So the honest
 * job here is not to judge the change. It is to make sure nobody reports the
 * work done without seeing it.
 *
 * What it does, therefore:
 *   - states the percentage of pixels that moved, per route and per width,
 *   - writes a mask so the moved pixels are the ones you see first,
 *   - ranks the routes by how much moved, narrow widths first,
 *   - and exits non-zero when anything moved at all, so a CI lane cannot
 *     carry a visual change through on a green tick.
 *
 * A changed page is not a failure. An unexamined one is.
 *
 * Requires playwright, same as pipeline/shots.mjs.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compare, report } from "./visual-diff.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const list = (name) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return null;
  const out = [];
  for (let k = i + 1; k < argv.length && !argv[k].startsWith("--"); k += 1) out.push(argv[k]);
  return out.length ? out : null;
};

const OUT = resolve(arg("out", ".fix-gate"));
const BEFORE = join(OUT, "before");
const AFTER = join(OUT, "after");
const DIFF = join(OUT, "diff");
const THRESHOLD = arg("pixel-threshold");
const QUIET = arg("quiet-under");

const passthrough = [];
for (const name of ["base", "ready", "cookie-file", "cookie-name"]) {
  const v = arg(name);
  if (v) passthrough.push(`--${name}`, v);
}
for (const name of ["routes", "widths"]) {
  const v = list(name);
  if (v) passthrough.push(`--${name}`, ...v);
}
if (argv.includes("--full")) passthrough.push("--full");

const shoot = (into, when) => {
  mkdirSync(into, { recursive: true });
  console.log(`\n── shooting ${when} ──`);
  try {
    execFileSync(process.execPath, [join(HERE, "shots.mjs"), "--out", into, ...passthrough], {
      stdio: "inherit",
    });
  } catch (e) {
    /* shots.mjs exits 1 for a page error and 2 when playwright is missing.
       A page error is worth continuing through — the screenshot is still
       taken, and a page that was already erroring before the fix is useful
       to see. A missing browser is not something to continue through. */
    if (e.status === 2) process.exit(2);
    console.log("  (page errors above; continuing, the shots were still taken)");
  }
};

shoot(BEFORE, "before the fix");

console.log("\n── applying the mechanical fixes ──");
const checkArgs = [join(HERE, "..", "enforce", "design-check.mjs"), "--fix"];
const config = arg("config");
if (config) checkArgs.push("--config", config);
let fixOutput = "";
try {
  fixOutput = execFileSync(process.execPath, checkArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
} catch (e) {
  fixOutput = `${e.stdout ?? ""}${e.stderr ?? ""}`;
  if (e.status === 2) {
    console.error(fixOutput);
    process.exit(2);
  }
}
console.log(fixOutput.trim());

const applied = Number(fixOutput.match(/(\d+) fix\(es\)/)?.[1] ?? 0);
if (!applied) {
  console.log("\nNothing was rewritten, so there is nothing to look at.");
  process.exit(0);
}

shoot(AFTER, "after the fix");
mkdirSync(DIFF, { recursive: true });

const rows = compare(BEFORE, AFTER, {
  diffDir: DIFF,
  pixelThreshold: THRESHOLD == null ? undefined : Number(THRESHOLD),
});
const { lines, notable } = report(rows, { quietUnder: QUIET == null ? undefined : Number(QUIET) });

console.log(`\n── what moved ──\n`);
for (const line of lines) console.log(line);

console.log(`\n${applied} fix(es) applied. ${notable.length} of ${rows.length} screenshot(s) moved.`);
if (!notable.length) {
  console.log("Nothing visible changed. Read the code diff anyway, then ship it.\n");
  process.exit(0);
}
console.log(`Masks in ${DIFF}/ — the marked pixels are the ones that moved.`);
console.log("Open the narrow ones first, and compare each against the diff of the code.");
/* Non-zero on any visible change, deliberately. The gate has no opinion
   about whether the change is right, and the whole point is that a person
   has to form one. */
console.log("Exit 1 because something moved, not because something broke.\n");
process.exit(1);
