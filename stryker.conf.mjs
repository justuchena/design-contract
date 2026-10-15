/**
 * Mutation testing for the checker.
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 * This repo's argument is that a rule nobody runs is a rule nobody keeps.
 * The sequel is the reason for this file: **a test that cannot fail is a
 * test nobody keeps**, and nothing in a normal toolchain tells you which of
 * yours those are. `enforce/test.mjs` is 49 green assertions. Green says
 * every rule fired once on a fixture built to make it fire. It says nothing
 * about the boundary, and a checker made of regexes lives entirely at the
 * boundary.
 *
 * So this changes the code on purpose and asks whether the tests notice.
 * Loosen a `\b`, widen a character class, flip a `<` in the pointer-target
 * arithmetic: if 49 assertions stay green, those assertions are decoration.
 *
 * ── How to read a result ─────────────────────────────────────────────────
 * ⚠️ **The score is a diagnostic, not a target, and `break` is null on
 * purpose.** A mutation score chased for its own sake on regex-dense code
 * buys fixture bloat: many mutants here are *equivalent*, changing a pattern
 * in a way no real input distinguishes, and writing a case to kill one of
 * those tests nothing. What is worth reading is **which rules** the
 * survivors cluster in. That names the rules whose tests only look like
 * tests, which is the same audit that produced v0.2.1, aimed one level in.
 *
 *     npm run mutate:preflight   # resolve targets, run the suite, no mutants
 *     npm run mutate             # the full sweep
 */
export default {
  packageManager: "npm",
  reporters: ["progress", "clear-text", "json"],
  jsonReporter: { fileName: ".cache/mutation/report.json" },

  /* The engine only, to begin with. `commit-check.mjs` and the pipeline
     scripts have their own argument for being next; one target at a time
     keeps the first report readable. */
  mutate: ["enforce/design-check.mjs"],

  /* 🔴 **The `command` runner, and it is the only one that works here.**
     The suite is a plain script rather than a framework, and it runs the
     checker as a *child process* with `execFileSync`. An in-process runner
     would instrument a module the test never imports and report every
     mutant as survived. The command runner mutates the file on disk inside
     a sandbox, so the child picks the mutant up, which is exactly what is
     wanted. It costs a process per mutant — about 0.2s here, so the whole
     sweep is minutes. */
  testRunner: "command",
  commandRunner: { command: "node enforce/test.mjs" },

  /* The sandbox is a copy of the tree, and 152 reference packages have
     nothing to do with the checker. Without this, every worker copies 60MB
     to run a 0.169s suite. */
  ignorePatterns: ["refs", "resources", "skills", "pipeline/fonts", ".cache", "node_modules"],

  /* 🔴 **String literals are excluded, and this is the one judgement in
     this file worth arguing with.** They were 342 of 1,291 mutants and
     scored 27.5%, which looks like a damning gap and is mostly an artifact:
     almost every string in this engine is the `why` or `detail` prose that
     gets printed in the report, and the suite deliberately does not pin
     report wording. It should not. A test that asserts a sentence fails
     every time the sentence improves, which trains people to edit the test
     without reading it, and the prose is the most valuable thing in the
     file.

     So those mutants are unkillable *by design* rather than by omission,
     and leaving them in buries the signal: with them excluded the score
     moves from 48.95% to the number that is actually about logic.

     ⚠️ **What this does cost**, stated so it is not a hidden hole: it also
     drops ~94 legitimate kills, the rule *names* passed to `report()`
     among them. Those stay covered by `countFor()` in the suite, which
     asserts each rule's name and its count, so the loss is smaller than it
     looks. If this file ever grows a string literal that decides
     behaviour rather than describing it, that argument stops holding. */
  mutator: { excludedMutations: ["StringLiteral"] },

  concurrency: 6,
  timeoutMS: 15000,

  /* ⚠️ **Non-blocking, deliberately, and not only because CI is parked.** A
     threshold that fails a build teaches people to pass `--force`, which is
     the argument this repo makes about design rules and applies here
     unchanged. The sweep reports; a person reads it. */
  thresholds: { high: 80, low: 60, break: null },
};
