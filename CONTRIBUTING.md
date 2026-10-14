# Contributing

Thanks for looking. This repo has an unusual bar for one kind of
contribution, so it is worth stating plainly before you spend time.

## The bar for a new rule

**A rule must come with the argument that justifies it.** Not a preference, a
convention, or a thing you have seen recommended — an argument about what
goes wrong without it.

This is not gatekeeping for its own sake. The checker's usefulness depends
entirely on its findings being worth reading. A rule that fires on something
defensible teaches people that the output is noise, and once they learn that,
they start passing `--force`. That costs every rule at once, including the
ones that were catching real defects. One bad rule is worse than ten missing
ones.

So a rule PR needs four things:

1. **The failure it prevents**, concretely. "I shipped this and it broke in
   Safari" or "this grey measured 2.37:1 on our plate and nobody noticed for
   four months". A specific incident beats a general principle.
2. **Why prose alone does not hold it.** If a design doc reliably prevents
   it, it does not need to be a check.
3. **A fixture case** in `enforce/fixture/src/`, and an assertion in
   `enforce/test.mjs`. A rule with no fixture is a rule that will silently
   stop working.
4. **A negative case** — something that looks like a violation and must not
   fire. This is the part people skip, and it is the part that decides
   whether the rule survives contact with a real codebase.

The `why` string you write is printed in the report. Write it as the sentence
you would say to a colleague who just hit it.

### Rules that will be declined

- Anything about composition, hierarchy, or whether a design is good. The
  checker refuses this category on purpose; see the README.
- Framework or library preferences.
- Formatting that a formatter already owns.
- A rule whose only justification is that a popular design system does it.

If your rule is really a *default* rather than a check — something most
projects should do but which has legitimate exceptions — it belongs in
`method/` or in the bans list in `SKILL.md`, not in `enforce/`.

## Other contributions, all welcome

- **Fixing a false positive.** The most valuable bug report there is. Include
  the source line that fired and why it is legitimate.
- **Resource list corrections**, especially a licence that has changed. The
  list in `resources/README.md` is a snapshot and licences move.
- **Method docs.** If `method/references.md` or `method/voice.md` is wrong or
  incomplete in a way you have felt in practice, say so.
- **Worked examples.** `examples/meridian/` is one filled-in design doc. A
  second, for a different kind of product, would help — it must use an
  invented brand and real measured numbers.
- **Typos and broken links.** Always fine, no issue needed.

## Running the checks

```bash
node enforce/test.mjs                                        # 23 assertions
node pipeline/derive.mjs examples/meridian/tokens.css --check
node pipeline/contrast.mjs examples/meridian/palette.json    # exits 1 by design
```

Or `npm run verify`. Please run it before opening a PR. The same suite is in
[`.github/workflows/verify.yml`](.github/workflows/verify.yml), which also
covers Node 18, 20, 22 and 24 and link-checks every doc.

No build step, no dependencies, no formatter config to fight. The scripts are
plain ESM and are meant to stay readable — they are also teaching material,
which is why they carry more comment than code of this size usually would.

**Keep the comments.** The explanation of *why* a rule exists is the thing
that stops it being deleted in a year by someone who cannot see what it was
for. If you change a rule's behaviour, change the comment with it.

## On `refs/`

The 152 packages in `refs/` are redistributed from
[`nexu-io/open-design`](https://github.com/nexu-io/open-design) under
Apache-2.0, unmodified. **Please do not send PRs editing their contents** —
fixes belong upstream, and keeping them unmodified is what makes the
attribution in [`NOTICE`](NOTICE) accurate and the statement of changes
honest. Corrections to `refs/INDEX.md`, which is this repo's own writing, are
welcome.

## Commits and PRs

- Explain *why* in the body. The what is in the diff.
- One concern per PR.
- No need to update a changelog; that happens at release.

## Conduct

Be decent. See [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
