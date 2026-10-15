/**
 * One rule on, eighteen off.
 *
 * **Nothing used to exercise this shape, and mutation testing is how it
 * surfaced:** every `OptionalChaining` and `UnaryOperator` mutant in the
 * engine survived, 20 of them, at a flat 0%. That is the signature of a
 * branch no test reaches — and the branch in question is every
 * `config.x?.length` guard, which is to say the entire question of what
 * happens when a rule is *not configured*.
 *
 * The suite had only ever run one fully-populated config, so "the checker
 * does not crash on a sparse config" and "a rule that is off reports itself
 * as off" were both untested claims. The second one matters most: a rule
 * that is off has verified nothing, and that is the whole reason the
 * passing line names it.
 */
export default {
  root: ".",
  src: "src",
  copyBans: [{ rule: "copy", pattern: "—", why: "No em dashes anywhere a visitor can read." }],
};
