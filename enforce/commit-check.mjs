#!/usr/bin/env node
/**
 * The commit convention, held.
 *
 *     node enforce/commit-check.mjs                  # HEAD
 *     node enforce/commit-check.mjs --range origin/main..HEAD
 *     node enforce/commit-check.mjs --file .git/COMMIT_EDITMSG
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 * Because this repo's whole argument is that a rule written down and never
 * run is a rule that drifts. Documenting a commit convention in
 * CONTRIBUTING.md and then not checking it would be that mistake, committed
 * by the project that names it.
 *
 * ── What it does not do ──────────────────────────────────────────────────
 * It does not cap the subject length, and that is deliberate. A subject that
 * names the measurement ("— 21,398 lines") is worth more than one that fits
 * a terminal. The threshold is set from the distribution it is meant to
 * describe rather than from the 72 characters everyone repeats: across 427
 * commits of the convention this borrows from, the median subject is 99 and
 * the 99th percentile is 148. Warning at 120 would have fired on 15% of
 * them, and a warning that fires on one commit in seven is the noise this
 * project is otherwise careful to avoid. So it warns above 150, which is
 * the genuine outlier, and never fails.
 *
 * It also cannot tell whether the body explains *why*. That needs a reader.
 *
 * Install as a hook, so it runs before the message is written rather than
 * after CI rejects it:
 *
 *     git config core.hooksPath .githooks
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? null : argv[i + 1];
};

/* Conventional Commits, with the type list taken from what the convention
   is actually used for rather than from the spec's examples. */
const TYPES = ["feat", "fix", "refactor", "docs", "test", "chore", "style", "build", "ci", "perf", "revert"];

/* Scopes are the parts of this repo somebody can change. A scope outside
   this list is usually a sign the change is wider than it looks, so the
   check names it rather than guessing. Add one here when a real area
   appears; do not reach for a vague one. */
const SCOPES = [
  "repo", "refs", "method", "enforce", "pipeline",
  "examples", "resources", "skill", "licence", "deps", "ci",
];

const SUBJECT = /^(?<type>[a-z]+)(?:\((?<scope>[a-z0-9,\-/]+)\))?(?<breaking>!)?: (?<subject>.+)$/;

const messages = [];
const file = arg("file");
const range = arg("range");

if (file) {
  messages.push({ sha: "(pending)", text: readFileSync(file, "utf8") });
} else {
  const spec = range ?? "HEAD (last commit)";
  /* `--all` reads every commit, which is what you want on a young repo
     where `HEAD~N` runs off the end of history. */
  const args = range
    ? ["log", "--format=%H%x00%B%x1e", "--no-merges", ...(range === "all" ? ["--all"] : [range])]
    : ["log", "--format=%H%x00%B%x1e", "-1"];
  let raw;
  try {
    raw = execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    /* A bad range is a typo, not a crash. The stack trace tells the reader
       nothing they can act on. */
    console.error(`commit-check: cannot read "${spec}"`);
    console.error((e.stderr ?? "").trim().split("\n")[0] || "git failed");
    console.error("\nTry --range all, or --range origin/main..HEAD");
    process.exit(2);
  }
  for (const entry of raw.split("\x1e")) {
    if (!entry.trim()) continue;
    const [sha, text] = entry.replace(/^\n/, "").split("\x00");
    messages.push({ sha: sha.slice(0, 8), text });
  }
  if (!messages.length) console.log(`commit-check: no commits in ${spec}`);
}

const problems = [];
const warnings = [];

for (const { sha, text } of messages) {
  /* A comment line in COMMIT_EDITMSG is not part of the message. */
  const lines = text.split("\n").filter((l) => !l.startsWith("#"));
  const subject = (lines[0] ?? "").trim();
  const body = lines.slice(1).join("\n").trim();
  const fail = (detail) => problems.push({ sha, subject, detail });
  const warn = (detail) => warnings.push({ sha, subject, detail });

  if (!subject) {
    fail("empty subject");
    continue;
  }

  const m = SUBJECT.exec(subject);
  if (!m) {
    fail('does not match "type(scope): subject" — e.g. fix(enforce): the stripper swallowed a string literal');
    continue;
  }

  const { type, scope, subject: text_ } = m.groups;

  if (!TYPES.includes(type)) {
    fail(`unknown type "${type}" — one of ${TYPES.join(", ")}`);
  }

  /* Multiple scopes are allowed and used, for a change that genuinely
     crosses areas: refactor(method,enforce): ... */
  if (scope) {
    for (const one of scope.split(",")) {
      if (!SCOPES.includes(one)) {
        fail(`unknown scope "${one}" — one of ${SCOPES.join(", ")}`);
      }
    }
  }

  /* Sentence case is a warning, not a failure, and the reason is the same
     one this project applies to its own checker: the rule has a legitimate
     exception — a proper noun, a filename — and no regex can tell
     "Meridian, a filled-in design doc" from "Update the readme". A check
     that cannot hold its own exception should not fail a build, because the
     first false positive is what teaches people to bypass it. */
  if (/^[A-Z]/.test(text_) && !/^[A-Z][\w-]*\.[a-z]/.test(text_)) {
    warn("subject starts with a capital — lowercase unless it is a proper noun or a filename");
  }
  if (/\.$/.test(text_)) {
    fail("subject ends with a full stop");
  }
  if (/^(update|updates|updated|change|changes|changed|fix stuff|wip|misc)\b/i.test(text_)) {
    fail(`"${text_.split(" ")[0]}" says nothing — name what changed and why it matters`);
  }

  /* The trailer rule, stated in the project's own conventions. */
  if (/^co-authored-by:/im.test(body)) {
    fail("remove the Co-Authored-By trailer");
  }

  if (lines[1]?.trim()) {
    fail("no blank line between the subject and the body");
  }

  /* Warnings only. A typo fix does not owe a paragraph, and a long subject
     that carries a number is usually the better subject. */
  if (!body && !["chore", "style", "ci", "build"].includes(type)) {
    warn("no body — the diff shows the what, so the body should carry the why");
  }
  if (subject.length > 150) {
    warn(`subject is ${subject.length} characters`);
  }
}

for (const w of warnings) {
  console.log(`⚠  ${w.sha}  ${w.detail}`);
  console.log(`   ${w.subject}`);
}

if (problems.length) {
  console.error(`\n✗ commit-check: ${problems.length} problem(s)\n`);
  for (const p of problems) {
    console.error(`  ${p.sha}  ${p.detail}`);
    console.error(`     ${p.subject}\n`);
  }
  console.error("The convention is in CONTRIBUTING.md § Commits.\n");
  process.exit(1);
}

const n = messages.length;
console.log(`✓ commit-check: ${n} ${n === 1 ? "message follows" : "messages follow"} the convention`);
