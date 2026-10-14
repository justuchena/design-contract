#!/usr/bin/env node
/**
 * Every foreground against every ground, as a matrix.
 *
 *     node pipeline/contrast.mjs examples/meridian/palette.json
 *
 * ── Why a matrix and not a checker ───────────────────────────────────────
 * Because the interesting failures are conditional. A grey that clears 4.5:1
 * on the page and misses it on a tinted plate is the commonest real
 * accessibility bug in a system that has more than one ground, and it is
 * invisible to any tool that only ever tests against white.
 *
 * That case cannot be expressed as a ban — the colour is fine where it is
 * fine — so this prints the numbers and lets you write the conditional rule
 * in prose. The design doc holds the judgement; this holds the measurement.
 *
 * Exits non-zero if any pair marked `requires` in the palette file misses
 * its floor, so it can run in CI once you have decided which pairs are
 * load-bearing.
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node pipeline/contrast.mjs <palette.json>");
  process.exit(2);
}
const palette = JSON.parse(readFileSync(file, "utf8"));

const channel = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
};

const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return (hi + 0.05) / (lo + 0.05);
};

/* WCAG 2.2: 4.5:1 for body text, 3:1 for large text and for any graphic or
   UI component that carries meaning. A decorative glyph has no floor, which
   is why `aria-hidden` is the honest escape hatch rather than a lower
   number. */
const FLOORS = { text: 4.5, large: 3, ui: 3, decorative: 0 };

const grounds = Object.entries(palette.grounds ?? {});
const foregrounds = Object.entries(palette.foregrounds ?? {});
if (!grounds.length || !foregrounds.length) {
  console.error("palette needs both `grounds` and `foregrounds`");
  process.exit(2);
}

const width = Math.max(...foregrounds.map(([n]) => n.length)) + 2;
const col = 14;

console.log(`\n${palette.name ?? file}\n`);
process.stdout.write("".padEnd(width));
for (const [gn, gv] of grounds) process.stdout.write(`${gn} ${gv}`.padEnd(col + 10));
console.log("\n");

const failures = [];

/* A foreground declares which grounds it is *for*. Without that, the matrix
   dutifully reports that dark type fails on a dark ground — true, expected,
   and it buries the one finding worth having. An unscoped pair still prints
   its ratio, in brackets, because the number is occasionally useful; it just
   does not carry a floor. */
const scopeOf = (fv) => (typeof fv === "string" ? null : fv.on ?? null);
const inScope = (fv, gn) => {
  const on = scopeOf(fv);
  return on === null || on.includes(gn);
};

for (const [fn, fv] of foregrounds) {
  process.stdout.write(fn.padEnd(width));
  for (const [gn, gv] of grounds) {
    const r = ratio(typeof fv === "string" ? fv : fv.value, gv);
    const role = typeof fv === "string" ? null : fv.requires;
    const scoped = inScope(fv, gn);
    const floor = role && scoped ? FLOORS[role] ?? Number(role) : null;
    const bad = floor !== null && r < floor;
    if (bad) failures.push({ fn, gn, r, floor, role });
    const cell = scoped ? `${r.toFixed(2)}:1${bad ? " ✗" : ""}` : `(${r.toFixed(2)})`;
    process.stdout.write(cell.padEnd(col + 10));
  }
  console.log("");
}

/* A pair that passes on one ground and fails on another is the finding worth
   surfacing by name, because it is the one a single-ground test never sees. */
const conditional = foregrounds
  .map(([fn, fv]) => {
    const value = typeof fv === "string" ? fv : fv.value;
    const role = typeof fv === "string" ? null : fv.requires;
    if (!role) return null;
    const floor = FLOORS[role] ?? Number(role);
    const results = grounds
      .filter(([gn]) => inScope(fv, gn))
      .map(([gn, gv]) => ({ gn, pass: ratio(value, gv) >= floor }));
    const passing = results.filter((r) => r.pass).map((r) => r.gn);
    const failing = results.filter((r) => !r.pass).map((r) => r.gn);
    return passing.length && failing.length ? { fn, passing, failing, floor } : null;
  })
  .filter(Boolean);

if (conditional.length) {
  console.log("\nConditional — passes on one ground, fails on another:");
  for (const c of conditional) {
    console.log(
      `  ${c.fn}: clears ${c.floor}:1 on ${c.passing.join(", ")} but not on ${c.failing.join(", ")}`,
    );
  }
  console.log("\n  This cannot be a ban. Write the condition into the design doc.");
}

if (failures.length) {
  console.log(`\n✗ ${failures.length} pair(s) below their declared floor\n`);
  process.exit(1);
}
console.log("\n✓ every declared pair clears its floor\n");
