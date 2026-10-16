/**
 * The findings that have exactly one correct fix, applied.
 *
 * A fix is a byte range in the raw source and the text to put there. That
 * representation is available because `strip()` in the checker preserves
 * offsets, so a match index in the stripped code indexes the raw file too —
 * the property that was written for correct line numbers is the one that
 * makes rewriting safe without an AST.
 *
 * Two rules govern what belongs here, and they are the same rule twice:
 *
 *   A fix is only automatic where the design doc already states the target.
 *   The config names `text-sm` for a 14px literal, so that rewrite carries
 *   no judgement. The config names a *pair* of disabled opacities, so
 *   choosing between them does, and that finding stays a finding.
 *
 *   Nothing here touches composition, copy that has to be rewritten rather
 *   than repunctuated, or an accessible name. A fixer that invents a label
 *   is a fixer that ships a wrong label, and a wrong label is worse than a
 *   missing one because the checker then goes quiet.
 */
import { readFileSync, writeFileSync } from "node:fs";

/**
 * Apply fixes to disk, newest offset first so earlier splices do not move
 * later ones.
 *
 * Overlapping ranges are dropped rather than merged. Two rules wanting the
 * same bytes means the doc disagrees with itself there, and the honest
 * outcome is to fix neither and let both findings print — a merge would
 * produce text no rule asked for.
 */
export const applyFixes = (fixes) => {
  const byFile = new Map();
  for (const fix of fixes) byFile.set(fix.file, [...(byFile.get(fix.file) ?? []), fix]);

  const applied = [];
  const conflicted = [];

  for (const [file, list] of byFile) {
    const ordered = [...list].sort((a, b) => b.start - a.start || b.end - a.end);
    const keep = [];
    let lastStart = Infinity;
    for (const fix of ordered) {
      if (fix.end > lastStart) {
        conflicted.push(fix);
        continue;
      }
      keep.push(fix);
      lastStart = fix.start;
    }
    if (!keep.length) continue;

    let src = readFileSync(file, "utf8");
    for (const fix of keep) src = src.slice(0, fix.start) + fix.text + src.slice(fix.end);
    writeFileSync(file, src);
    applied.push(...keep);
  }

  return { applied, conflicted };
};

/** A fix record, or null when the rule has nothing unambiguous to offer. */
export const fixAt = (f, start, end, text, rule) =>
  text == null ? null : { file: f.file, rel: f.rel, start, end, text, rule };

/**
 * Add a class to an existing class expression, before the closing quote.
 *
 * Appending rather than prepending because Tailwind's later-wins ordering is
 * not what decides the cascade, but reviewers read a class list as "what it
 * is, then what was added" — and a fix is easier to audit at the end.
 */
export const addClass = (expr, cls) => {
  const m = expr.match(/(["'`])((?:(?!\1)[\s\S])*)\1/);
  if (!m) return null;
  const inner = m[2];
  if (new RegExp(`\\b${cls}\\b`).test(inner)) return null;
  const at = m.index + 1 + inner.length;
  return { offset: at, text: inner.trimEnd() === inner ? ` ${cls}` : `${cls}` };
};
