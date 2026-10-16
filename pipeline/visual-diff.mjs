#!/usr/bin/env node
/**
 * Compare two directories of screenshots and say what moved.
 *
 *     node pipeline/visual-diff.mjs .fix-gate/before .fix-gate/after
 *
 * Standalone because the comparison is useful on its own — two branches,
 * two themes, before and after any change at all — and because a half that
 * needs a running browser to test is a half that does not get tested.
 * `pipeline/fix-gate.mjs` drives it around a `design-check --fix`.
 *
 * It states what moved and writes a mask. It has no opinion about whether
 * the change was correct, because it cannot have one.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { decode, encode } from "./png.mjs";

/* A channel delta this small is font rasterisation and antialiasing noise
   between two runs of the same browser, not a design change. Raise it and
   the comparison stops seeing a one-step colour token swap, which is the
   change it most needs to catch. */
export const PIXEL_THRESHOLD = 8;
/* Not a pass mark. Below this a shot is still listed, just not ranked as
   worth opening first. */
export const QUIET_UNDER = 0.02;

/**
 * Compare matching filenames in two directories.
 *
 * Returns a row per screenshot, narrow widths first and then by how much
 * moved — narrow first because that is the layout that breaks and the one
 * nobody opens.
 */
export const compare = (beforeDir, afterDir, opts = {}) => {
  const threshold = opts.pixelThreshold ?? PIXEL_THRESHOLD;
  const diffDir = opts.diffDir ?? null;
  if (diffDir) mkdirSync(diffDir, { recursive: true });

  const names = [...new Set([
    ...(existsSync(beforeDir) ? readdirSync(beforeDir) : []),
    ...(existsSync(afterDir) ? readdirSync(afterDir) : []),
  ])].filter((n) => n.endsWith(".png"));

  const rows = [];
  for (const name of names) {
    const a = join(beforeDir, name);
    const b = join(afterDir, name);
    /* shots.mjs names them `<route>-<width>.png`, and the width is what the
       ranking needs. A name that does not carry one sorts first rather than
       being dropped. */
    const width = Number(name.match(/-(\d+)\.png$/)?.[1] ?? 0);

    if (!existsSync(a) || !existsSync(b)) {
      rows.push({
        name, width, moved: 100,
        note: existsSync(a) ? "missing after — the route stopped rendering" : "only exists after",
      });
      continue;
    }

    let before;
    let after;
    try {
      before = decode(readFileSync(a));
      after = decode(readFileSync(b));
    } catch (e) {
      rows.push({ name, width, moved: 100, note: `could not be read: ${e.message}` });
      continue;
    }

    if (before.width !== after.width || before.height !== after.height) {
      /* The strongest signal there is, and it needs no percentage: the page
         is a different size than it was. A `min-h-0` fix lands here. */
      rows.push({
        name, width, moved: 100,
        note: `${before.width}×${before.height} → ${after.width}×${after.height}, the page changed size`,
      });
      continue;
    }

    const total = before.width * before.height;
    const mask = diffDir ? Buffer.alloc(total * 4) : null;
    let moved = 0;
    for (let p = 0; p < total; p += 1) {
      const i = p * 4;
      const delta = Math.max(
        Math.abs(before.pixels[i] - after.pixels[i]),
        Math.abs(before.pixels[i + 1] - after.pixels[i + 1]),
        Math.abs(before.pixels[i + 2] - after.pixels[i + 2]),
        Math.abs(before.pixels[i + 3] - after.pixels[i + 3]),
      );
      if (delta > threshold) {
        moved += 1;
        if (mask) {
          mask[i] = 255;
          mask[i + 1] = 0;
          mask[i + 2] = 102;
          mask[i + 3] = 255;
        }
      } else if (mask) {
        /* The unchanged page, washed out, so the marked pixels read as marks
           rather than as part of the design. */
        const grey = Math.round(
          0.299 * after.pixels[i] + 0.587 * after.pixels[i + 1] + 0.114 * after.pixels[i + 2],
        );
        const pale = Math.round(grey * 0.25 + 191);
        mask[i] = mask[i + 1] = mask[i + 2] = pale;
        mask[i + 3] = 255;
      }
    }

    if (mask && moved) {
      writeFileSync(join(diffDir, name), encode({ width: before.width, height: before.height, pixels: mask }));
    }
    rows.push({ name, width, moved: (moved / total) * 100, pixels: moved });
  }

  return rows.sort((x, y) => x.width - y.width || y.moved - x.moved);
};

/** The report, and the count of shots that moved enough to be worth opening. */
export const report = (rows, opts = {}) => {
  const quiet = opts.quietUnder ?? QUIET_UNDER;
  const notable = rows.filter((r) => r.note || r.moved > quiet);
  const lines = rows.map((r) =>
    r.note
      ? `  ${r.name.padEnd(28)} ${r.note}`
      : r.moved > quiet
        ? `  ${r.name.padEnd(28)} ${r.moved.toFixed(2)}% of pixels (${r.pixels})`
        : `  ${r.name.padEnd(28)} unchanged`,
  );
  return { lines, notable };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const [beforeDir, afterDir] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!beforeDir || !afterDir) {
    console.error("usage: visual-diff.mjs <before-dir> <after-dir> [--diff <dir>]");
    process.exit(2);
  }
  const i = process.argv.indexOf("--diff");
  const rows = compare(beforeDir, afterDir, { diffDir: i === -1 ? null : process.argv[i + 1] });
  if (!rows.length) {
    console.error("no screenshots to compare");
    process.exit(2);
  }
  const { lines, notable } = report(rows);
  console.log(`\n── what moved ──\n`);
  for (const line of lines) console.log(line);
  console.log(`\n${notable.length} of ${rows.length} screenshot(s) moved.\n`);
  process.exit(notable.length ? 1 : 0);
}
