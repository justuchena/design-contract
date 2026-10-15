/**
 * Mutation testing for the checker: change the engine on purpose, and see
 * whether the suite notices. The argument for it, what the first run found,
 * and why the score is a diagnostic rather than a target are all in
 * enforce/README.md.
 *
 *     npm run mutate:preflight   # resolve targets, run the suite, no mutants
 *     npm run mutate             # the full sweep, about 90 seconds
 *     npm run mutate:report      # which rules the survivors cluster in
 */
export default {
  packageManager: "npm",
  reporters: ["progress", "clear-text", "json"],
  jsonReporter: { fileName: ".cache/mutation/report.json" },
  mutate: ["enforce/design-check.mjs"],

  /* The command runner, and it is the only one that works here: the suite
     runs the checker as a child process, so an in-process runner would
     instrument a module the test never imports and report every mutant as
     survived. */
  testRunner: "command",
  commandRunner: { command: "node enforce/test.mjs" },

  /* Without this, six workers each copy 152 reference packages to run a
     0.17s suite. */
  ignorePatterns: ["refs", "resources", "skills", "pipeline/fonts", ".cache", "node_modules"],

  /* Almost every string in the engine is the `why` or `detail` prose the
     report prints, and the suite deliberately does not pin report wording.
     Those mutants are unkillable by design, and they were 342 of 1,319. The
     cost: about 94 legitimate kills go with them, the rule names included,
     and those stay covered by `countFor()`. */
  mutator: { excludedMutations: ["StringLiteral"] },

  concurrency: 6,
  timeoutMS: 15000,
  thresholds: { high: 80, low: 60, break: null },
};
