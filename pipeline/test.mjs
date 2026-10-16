/**
 * Tests the PNG codec and the screenshot comparison.
 *
 *     node pipeline/test.mjs
 *
 * Synthetic images throughout, because a comparison that needs a running
 * browser to test is a comparison that does not get tested — which is the
 * reason the compare step is its own module rather than part of the gate.
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { decode, encode } from "./png.mjs";
import { compare, report } from "./visual-diff.mjs";

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

/** A flat field, optionally with a differently coloured block in it. */
const image = (w, h, [r, g, b], block = null) => {
  const pixels = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const inBlock =
        block && x >= block.x && x < block.x + block.w && y >= block.y && y < block.y + block.h;
      const [cr, cg, cb] = inBlock ? block.color : [r, g, b];
      pixels[i] = cr;
      pixels[i + 1] = cg;
      pixels[i + 2] = cb;
      pixels[i + 3] = 255;
    }
  }
  return { width: w, height: h, pixels };
};

console.log("\nthe PNG codec");
const round = decode(encode(image(40, 30, [20, 120, 200], { x: 5, y: 5, w: 10, h: 10, color: [255, 0, 102] })));
check("a round trip is byte-identical", round.pixels.equals(
  image(40, 30, [20, 120, 200], { x: 5, y: 5, w: 10, h: 10, color: [255, 0, 102] }).pixels));
check("dimensions survive", round.width === 40 && round.height === 30);

/* The formats a browser never emits are the ones a half-written decoder
   mangles silently, and a silent mangle reads as a visual change that is not
   there. Each has to throw by name. */
const bad = (mutate) => {
  const buf = encode(image(4, 4, [0, 0, 0]));
  mutate(buf);
  try {
    decode(buf);
    return null;
  } catch (e) {
    return e.message;
  }
};
check("16-bit samples are refused by name", /16-bit/.test(bad((b) => { b[24] = 16; }) ?? ""), bad((b) => { b[24] = 16; }) ?? "no throw");
check("a palette is refused by name", /colour type 3/.test(bad((b) => { b[25] = 3; }) ?? ""), bad((b) => { b[25] = 3; }) ?? "no throw");
check("interlacing is refused by name", /interlaced/.test(bad((b) => { b[28] = 1; }) ?? ""), bad((b) => { b[28] = 1; }) ?? "no throw");
check("a non-PNG is refused", /not a PNG/.test((() => {
  try { decode(Buffer.from("this is not a png at all")); return ""; } catch (e) { return e.message; }
})()));

console.log("\nthe comparison");
const ROOT = mkdtempSync(join(tmpdir(), "design-contract-diff-"));
const before = join(ROOT, "before");
const after = join(ROOT, "after");
const diff = join(ROOT, "diff");
mkdirSync(before);
mkdirSync(after);

const put = (dir, name, img) => writeFileSync(join(dir, name), encode(img));
const PAGE = [250, 250, 248];

/* Identical. */
put(before, "index-390.png", image(60, 40, PAGE));
put(after, "index-390.png", image(60, 40, PAGE));
/* A colour token swapped: a small block changes hue. */
put(before, "pricing-390.png", image(60, 40, PAGE, { x: 0, y: 0, w: 6, h: 40, color: [79, 70, 229] }));
put(after, "pricing-390.png", image(60, 40, PAGE, { x: 0, y: 0, w: 6, h: 40, color: [17, 94, 89] }));
/* Rasterisation noise: one step on one channel, under the threshold. */
put(before, "about-768.png", image(60, 40, [250, 250, 248]));
put(after, "about-768.png", image(60, 40, [250, 250, 244]));
/* A layout change: the page is taller than it was. */
put(before, "apply-1440.png", image(60, 40, PAGE));
put(after, "apply-1440.png", image(60, 64, PAGE));
/* A route that stopped rendering. */
put(before, "gone-1440.png", image(60, 40, PAGE));

const rows = compare(before, after, { diffDir: diff });
const row = (name) => rows.find((r) => r.name === name);

check("an identical page reads as unchanged", row("index-390.png").moved === 0);
check("a colour swap is measured as a percentage",
  Math.abs(row("pricing-390.png").moved - 10) < 0.01,
  `6 of 60 columns is 10%, got ${row("pricing-390.png").moved}`);
check("rasterisation noise under the threshold is not a change",
  row("about-768.png").moved === 0,
  "a four-step delta on one channel is two runs of the same browser, not a design change");
check("a page that changed size says so instead of a percentage",
  /changed size/.test(row("apply-1440.png").note ?? ""), row("apply-1440.png").note);
check("a route that stopped rendering is reported, not skipped",
  /missing after/.test(row("gone-1440.png").note ?? ""), row("gone-1440.png").note);

console.log("\nthe ranking and the masks");
check("narrow widths come first",
  rows.map((r) => r.width).every((w, i, all) => i === 0 || all[i - 1] <= w),
  rows.map((r) => r.width).join(" "));
check("within a width, the biggest change comes first",
  rows.filter((r) => r.width === 390)[0].name === "pricing-390.png");
check("a mask is written only for a shot that moved",
  existsSync(join(diff, "pricing-390.png")) && !existsSync(join(diff, "index-390.png")),
  readdirSync(diff).join(" "));
const mask = decode(readFileSync(join(diff, "pricing-390.png")));
check("the mask marks the pixels that moved",
  mask.pixels[0] === 255 && mask.pixels[1] === 0 && mask.pixels[2] === 102);
check("and washes out the ones that did not",
  mask.pixels[59 * 4] > 200 && mask.pixels[59 * 4] === mask.pixels[59 * 4 + 1],
  "an unchanged pixel should be pale grey, so the marks read as marks");

const { notable } = report(rows);
check("the unchanged and the sub-threshold shots are not ranked as worth opening",
  notable.length === 3 && !notable.some((r) => r.name === "index-390.png"),
  notable.map((r) => r.name).join(" "));

console.log("\nthe gate cannot rewrite what it could not photograph");
/* Structural, because the real check depends on playwright being absent and
   that is not a thing to assert about somebody's machine. The property is
   the ordering: the "before" shots are taken first, so a missing browser
   aborts the run with the tree untouched. Getting this backwards would
   rewrite the code and then fail, leaving a diff nobody can see the effect
   of. */
const gate = readFileSync(new URL("fix-gate.mjs", import.meta.url), "utf8");
check("the before shots are taken before the fix is applied",
  gate.indexOf('shoot(BEFORE') < gate.indexOf('"--fix"'),
  "a missing browser must abort with the tree untouched");
check("a missing browser aborts rather than continuing",
  /if \(e\.status === 2\) process\.exit\(2\)/.test(gate));
/* The first live run of the gate failed exactly here: the checker reports to
   stderr, execFileSync returns only stdout, and with nothing left to decide
   it exits 0 — so the gate rewrote a file, read an empty stream, concluded
   nothing had happened and exited green without taking the after shots. */
check("the fix summary is read from both streams",
  /run\.stdout \?\? ""\}\$\{run\.stderr \?\? ""/.test(gate),
  "a silent stream must never be read as no work done");
check("no fix summary is treated as unknown rather than as nothing",
  /printed no fix summary/.test(gate) && /process\.exit\(2\)/.test(gate));
/* Also found live: the rewritten class was 7,500px down an 18,000px page, so
   the viewport shots called every route unchanged while a colour had moved. */
check("the shots are full-page unless opted out",
  /if \(!argv\.includes\("--viewport-only"\)\) passthrough\.push\("--full"\)/.test(gate),
  "a gate that only sees the first screen is another silent pass");

console.log("");
if (failures.length) {
  console.error(`✗ ${failures.length} assertion(s) failed\n`);
  process.exit(1);
}
console.log(`✓ all ${passed} pipeline assertion(s) passed\n`);
