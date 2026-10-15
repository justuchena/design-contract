# `enforce/`

```bash
cp enforce/design-check.config.example.mjs design-check.config.mjs
# edit it: every rule should map to a section of your design doc
node enforce/design-check.mjs
```

## Verify it works before you trust it

```bash
cd enforce/fixture && node ../design-check.mjs
```

Expect **27 findings in 5 files**, and `node enforce/test.mjs` asserts all of
it. The fixture is two deliberately broken components, and the interesting
part is what it does *not* report: the comment at the top of
`src/violations.tsx` names a retired hue and uses an em dash, and the
`accept="image/*"` attribute below it is the exact shape that once caused a
comment to swallow half a file. Neither is reported, and nor is the
`aria-hidden` span.

`src/interaction.tsx` is laid out in pairs, positive case then negative:
an outline suppressed with nothing put back beside one suppressed *with* a
substitute; a hover reveal with no focus answer beside one that has it; a
field with a placeholder beside a field whose label wraps it and which has no
`id` at all. Every one of those negative cases was reported by an early
version of the rule beside it. They are the assertions that matter, because
any regex catches the violation and the hard part is leaving the deliberate
pattern alone.

If you add a rule, add a pair to that fixture. A rule with no fixture is a
rule that silently stops working, and that is worse than no rule, because you
believe you are covered.

## It was checked against a real tree, not only the fixture

The interaction rules are ports of rules that had already run for months on a
1,268-file application, and the port was verified by running both versions
over that tree and diffing. `a11y`, `reveal`, `motion`, `media`, `focus` and
`ink-as-fill` agree exactly, down to the same files, the same lines and the
same computed pixel values (`22px pointer target — p-1 around a 14px glyph`).

Two rules find **more** than the originals, and the reason is the whole-class-
expression matching described below. The original matchers stopped at the
first quote, so a class list written as `className={[...].join(" ")}` or as a
template literal with an interpolated constant was invisible to them: eight
more hand-rolled shells and one more unshrinkable scroller, each confirmed by
reading the file. Writing long class lists as an array is completely normal,
so those were not edge cases, they were a blind spot over a whole formatting
style.

Worth stating because it is the pack's own argument turned on itself: the
original rules were right, ran in CI, and still missed real instances of
exactly what they were looking for. A rule that runs is necessary. It is not
sufficient, and the thing to check is not whether it fires but what it cannot
see.

## The rules

| Rule | What it catches | Config key |
|---|---|---|
| `palette` | Retired hues by class name | `retiredHues` |
| `palette` | Retired hues as hex literals | `retiredHex` |
| `palette` | Arbitrary colour classes (`text-[#abc]`) | `banArbitraryColor` |
| *(yours)* | Any pattern with no legitimate instance | `bans[]` |
| *(yours)* | Patterns scoped to one element | `elementRules[]` |
| `contrast` | A measured floor, with `aria-hidden` as the escape | `contrastFloors[]` |
| `type` | Arbitrary px sizes that have a ramp token | `typeRamp` |
| `icon` | Sizes and stroke widths off the ramp | `iconScale` |
| `state` | A disabled opacity that is not one of the sanctioned values | `stateOpacity` |
| `copy` | Punctuation and wording banned in user-visible text | `copyBans[]` |
| `tokens` | The same custom property declared in two sheets | `tokensDeclaredOnce` |

Those hold what a surface looks like. These hold whether it can be used, and
they are the half a design doc forgets:

| Rule | What it catches | Config key |
|---|---|---|
| `focus` | An indicator suppressed with nothing put back | `focusIndicator` |
| `radius` | An arbitrary radius, and a container radius on a control | `radius` |
| `a11y` | A pointer target under 24px, and an icon-only control with no name | `hitTarget` |
| `reveal` | An affordance that answers hover and not focus | `hoverReveal` |
| `motion` | An animation no `prefers-reduced-motion` rule covers | `motionGuards[]` |
| `field` | A placeholder used as a label, a native picker, a field radius | `fields` |
| `media` | A raw `<img>`, which has no fallback for a dead URL | `imageComponent` |
| `surface` | A hand-rolled shell where the doc specifies a component | `shells[]` |
| `layout` | A `flex-1` scroller with no `min-h-0` | `flexShrink` |
| `ink-as-fill` | A token meant for type, used as a ground under text | `inkAsFill[]` |

Every one of these was a rule a design document already claimed and nothing
ran. The last two are the ones worth reading the config comments for: a
hand-rolled shell is the commonest form of *locally plausible and globally
incoherent* there is, and a type token used as a fill is a contrast failure
that is invisible in one theme, so every screenshot anybody took looked
fine.

`--config <path>` points at a different config, `--max <n>` changes how many
findings print per rule (default 12).

## Every run says what it did not check

Two lines that are not findings, and both exist because of the same mistake.

**`cannot tell: …`**, printed under a rule's own findings. Every rule prints
the sentence that justifies it, which is the argument this whole repo makes.
But on one audit of a real tree, three rules reported a *decision* rather
than drift: a pane that is correctly a flat outlined region, a box-shadow
drawing a crop scrim rather than an elevation, and six deliberate raw images
each already carrying a comment arguing the case. Nothing in the output
suggested the rule could not tell the difference, so a reader is left to
either edit code that was right or stop believing the run. Both are worse
than the rule not existing. Every rule now states its blind spot beside its
claim, and `limits` in the config overrides or adds one.

**`off: …`**, on the passing line. A rule that is off has verified nothing,
and a green line that does not say so lets a config with one rule enabled
read exactly like one with all of them. That is the same error as a skipped
test lane reported as a pass, and the fix is the same: the output has to
distinguish *checked and clean* from *not checked*.

The rule count in the report is derived from the engine's own registry rather
than written down, and `enforce/test.mjs` asserts that the number in
`README.md` and `SKILL.md` matches it. A hand-maintained list of what the
checker holds rots exactly the way a hand-maintained design rule does, and
this repo should not demonstrate its own problem in the file meant to solve
it.

## Proving the tests are tests

```bash
npm install                  # the one thing here that needs it
npm run mutate:preflight     # resolve targets, run the suite, no mutants
npm run mutate               # the full sweep, about 90 seconds
npm run mutate:report        # which rules the survivors cluster in
```

This repo's argument is that a rule nobody runs is a rule nobody keeps. The
sequel is why `stryker.conf.mjs` exists: **a test that cannot fail is a test
nobody keeps.** 56 green assertions say every rule fired once on a fixture
built to make it fire. They say nothing about the boundary, and a checker
made of regexes lives entirely at the boundary.

So the sweep changes the engine on purpose and asks whether the suite
notices. The first run scored **48.95%**, and the number was the least
useful thing in it. `npm run mutate:report` buckets the survivors by the
rule they fall inside, and that found three specific defects:

- **The radius tier rule had config and no case.** The fixture config
  declared it; there was not one `rounded-2xl` in the fixture. The whole
  card-versus-control branch was dead, so every mutant in it survived. A
  rule configured and never triggered is this repo's own subject, one level
  in.
- **No test ran a config with rules absent.** Every `OptionalChaining` and
  `UnaryOperator` mutant survived, 20 of them at a flat 0%, which is the
  signature of a branch nothing reaches. The branch was every
  `config.x?.length` guard, so *what happens when a rule is not configured*
  was entirely untested — including the `off:` reporting that exists
  precisely because a rule that is off has verified nothing.
- **The focus rule's class-constant half had never executed.** 22 mutants
  inside one pattern survived together. The rule reads a class list held in a
  `const` as well as one written on an element, and nothing had ever given it
  one. That is not a weak test, it is a documented feature with nothing
  behind it. It works, as it turns out. Nobody knew.

Each was a few lines of fixture. Fixing them took the score from 48.95% to
**63.15%**, and the focus rule from 33% to 45% on its own. The number
mattered much less than a discouraging percentage turning into three closed
holes.

What is still open is readable off the same table, and it is honest to say
so: the focus rule and the field rule are the two with real room left, both
because one pattern in each has many branches and the fixture exercises two
or three of them. That is the next slice, not a crisis.

**The score is a diagnostic, not a target, and `break` is null on purpose.**
Chasing a percentage on regex-dense code buys fixture bloat: many mutants
here are *equivalent*, changing a pattern in a way no real input
distinguishes, and writing a case to kill one of those tests nothing. A
threshold that fails a build would also teach people to pass `--force`, which
is this repo's argument about design rules applied to itself.

`StringLiteral` mutants are excluded, and that is the judgement in there most
worth arguing with. They were 342 of 1,291 and scored 27.5%, which looks
damning and is mostly an artifact: almost every string in the engine is the
`why` or `detail` prose the report prints, and the suite deliberately does
not pin report wording. It should not — a test that asserts a sentence fails
every time the sentence improves. The cost, stated in the config so it is not
a hidden hole: about 94 legitimate kills go with them, the rule *names* among
them, and those stay covered by `countFor()`.

**One more thing it fixed, which was not about coverage at all.** Two
assertions were pinned to fixture line numbers, and both broke the moment the
sweep asked for a new case above them. A test pinned to a line number is a
test about the fixture's layout. They are content-based now, and the two that
legitimately name a line say why.

## Three decisions that make it usable

**Comments are stripped before every rule runs.** A checker that fires on the
prose explaining a ban punishes writing the explanation down, and the
explanation is the most valuable thing in the file. The stripper preserves
byte offsets, so line numbers stay correct — deleting the comment instead
shifts every index after it and reports a line that is wrong, which is worse
than no line at all because somebody goes and looks. It also skips string
literals, because a regex for `/*` cannot tell a comment from
`accept="image/*"`.

**Some rules read one element, not the whole file.** A card may be pure
white; a section plate may not. A divider inside a card is fine; between two
sections it is banned. `elementRules` reads an element's open tag, brace-aware
so `className={cond ? a : b}` does not end the tag early.

**Some read a whole class expression, and one reads a node's ancestors.** The
interaction rules are mostly about a *contradiction inside one expression* —
`opacity-0` with a hover answer and no focus answer, an outline removed with
nothing substituted — and a line-wise check gets every one of them wrong the
moment somebody formats a long class list across five lines, which is the
normal way to write a long one. It then reports a file that is correct, and
the fix a reader applies makes it worse.

The ancestor walk exists for one rule and earned its place: the field rule
without it reported thirteen correctly labelled fields as nameless, because
their label was a local `<Row label="Name">` whose body is a `<label>`
wrapping the children. That association is real, it is implicit, and it
crosses a component boundary no regex over one file can follow. So the test
is the *prop*, not the element — an ancestor taking a `label=` is naming what
it wraps, and a wrapper that accepts a `label` and fails to render one is a
bug belonging to the wrapper's own tests.

**It refuses to check composition.** Whether a section earns its place,
whether the tonal arc reads, whether a headline is good. Those need
judgement, and a check that faked an opinion about them would produce noise.
Noise teaches people to pass `--force`, and that costs you every rule at
once.

## Exemptions

An exemption is a hole unless it is argued and scoped:

```js
exemptions: [
  {
    path: "src/brand/identity-hues\\.ts$",
    rules: ["palette"],
    reason: "The hashed identity hues, argued in place at the top of that file.",
  },
],
```

Name the rules it covers. Avoid `rules: "*"` unless you mean it.

**Re-read this list whenever a file moves.** On a real project an
exemption outlived the thing it exempted and kept pointing at the file the
colours *used to* live in — so the sanctioned module was being checked and
the unsanctioned one was not. That is the exemption pointing at exactly the
wrong file, and it hid a live violation through four sweeps.

## In CI

```yaml
- run: node enforce/design-check.mjs
- run: node pipeline/derive.mjs src/styles/tokens.css --check
- run: node pipeline/contrast.mjs design/palette.json
```

Exit codes: `0` clean, `1` findings, `2` misconfigured.

## `commit-check.mjs`

The same argument, applied to this repo's own commit convention: documenting
one in `CONTRIBUTING.md` and never running it would be the mistake this
project is named after.

```bash
node enforce/commit-check.mjs                            # the last commit
node enforce/commit-check.mjs --range origin/main..HEAD   # a branch
node enforce/commit-check.mjs --range all                 # every commit
node enforce/commit-check.mjs --file .git/COMMIT_EDITMSG  # as a hook
```

```bash
git config core.hooksPath .githooks   # runs it on commit-msg
```

It fails on a malformed subject, an unknown type or scope, a trailing full
stop, an empty opening word (`Update`, `wip`, `misc`), a missing blank line,
and a `Co-Authored-By` trailer.

It only *warns* on a capital first word, a missing body, and a long subject.
The first of those is the interesting one, and it is the same judgement the
design checker makes: sentence case is the convention, but the exception is a
proper noun or a filename, and no regex separates `Meridian, a filled-in
design doc` from `Update the readme`. A rule that cannot hold its own
exception does not get to fail a build.

Subject length is uncapped on purpose, and the warning threshold comes from
measurement rather than from the 72 characters everyone repeats. Across 427
commits of the convention this borrows from: median 99, p90 127, p99 148,
max 178. Warning at 120 would have fired on 15% of them — and a warning that
fires on one commit in seven is exactly the noise that teaches people to stop
reading warnings. It warns above 150 and never fails.

## Adding a rule

The test: **can you point at the section of your design doc it enforces?** If
not, it is a preference, and a preference that fails a build is how a team
learns to pass `--force`.

Every rule carries a `why`, and the report prints it. A check with no
argument behind it gets deleted the first time it is inconvenient — which is
the right outcome for a check with no argument behind it.
