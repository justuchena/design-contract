#!/usr/bin/env node
/**
 * SKILL.md → skills/design-contract/SKILL.md. One source, one derived copy.
 *
 *     node pipeline/derive-skill.mjs           # write
 *     node pipeline/derive-skill.mjs --check   # fail if the copy is stale
 *
 * ── Why a second copy exists at all ──────────────────────────────────────
 * The two install paths want the file in different places, and neither is
 * negotiable:
 *
 *   cloned as a skill   ~/.claude/skills/<name>/SKILL.md   → repo root
 *   installed as a plugin   <plugin>/skills/<name>/SKILL.md → skills/<name>/
 *
 * A plugin's skills/ directory is scanned by convention, so a root SKILL.md
 * is simply not found by that path. The root copy is the canonical one
 * because it is the one a reader opens on GitHub.
 *
 * ── Why derived rather than written twice ────────────────────────────────
 * Because two hand-maintained copies of anything diverge — the same argument
 * pipeline/derive.mjs makes about a palette, and the reason that script
 * exists. The copy is rewritten from the source and `--check` fails a build
 * when it is stale, so the divergence cannot ship.
 *
 * The only transformation is depth: a link that reads `method/` from the
 * repo root has to read `../../method/` from two directories down.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "SKILL.md");
const OUT_DIR = join(ROOT, "skills", "design-contract");
const OUT = join(OUT_DIR, "SKILL.md");
const CHECK = process.argv.includes("--check");

/* The top-level paths a link or a command can name. Anything not in this
   list is left alone, so an external URL or an anchor is untouched. */
const TOP_LEVEL = [
  "method", "refs", "enforce", "pipeline", "examples", "resources",
  "LICENSE", "NOTICE", "README.md", "CONTRIBUTING.md", "AGENTS.md", "CHANGELOG.md",
];
const UP = "../../";

const source = readFileSync(SOURCE, "utf8");

/* Markdown link targets only: the display text keeps the repo-relative path,
   which is what a reader should see and is how the file is referred to in
   prose. Only the thing that has to resolve gets rewritten. */
let body = source.replace(/\]\((?!https?:|#|\.\.\/)([^)]+)\)/g, (whole, target) => {
  const head = target.split("/")[0].split("#")[0];
  return TOP_LEVEL.includes(head) ? `](${UP}${target})` : whole;
});

/* Commands inside fenced blocks run from somewhere the skill does not
   control, so they get the note below rather than a rewritten path. */
const notice = `
> **Paths in this file are relative to the pack's own root**, which is two
> directories up from here. Generated from the repo's root \`SKILL.md\` by
> \`pipeline/derive-skill.mjs\`; edit that one, not this copy.
`;

/* After the frontmatter, before the first heading, so an agent reads it
   before it reads a path. */
const fmEnd = body.indexOf("\n---\n", body.indexOf("---") + 3);
if (fmEnd === -1) {
  console.error("SKILL.md has no frontmatter block to insert after");
  process.exit(2);
}
const cut = fmEnd + "\n---\n".length;
const derived = `${body.slice(0, cut)}${notice}${body.slice(cut)}`;

if (CHECK) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== derived) {
    console.error(`✗ skills/design-contract/SKILL.md is stale.`);
    console.error("  Run: node pipeline/derive-skill.mjs");
    process.exit(1);
  }
  console.log("✓ skills/design-contract/SKILL.md matches SKILL.md");
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, derived);

const rewritten = [...source.matchAll(/\]\((?!https?:|#|\.\.\/)([^)]+)\)/g)].filter((m) =>
  TOP_LEVEL.includes(m[1].split("/")[0].split("#")[0]),
).length;
console.log(`✓ skills/design-contract/SKILL.md — ${rewritten} link(s) repointed`);
