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

Expect **14 findings in 3 files**. The fixture is a deliberately broken
component, and the interesting part is what it does *not* report: the comment
at the top of `src/violations.tsx` names a retired hue and uses an em dash,
and the `accept="image/*"` attribute below it is the exact shape that once
caused a comment to swallow half a file. Neither is reported. The
`aria-hidden` span is not reported either.

If you add a rule, add a line to that fixture. A rule with no fixture is a
rule that silently stops working.

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

`--config <path>` points at a different config, `--max <n>` changes how many
findings print per rule (default 12).

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

🔴 **Re-read this list whenever a file moves.** On a real project an
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

## Adding a rule

The test: **can you point at the section of your design doc it enforces?** If
not, it is a preference, and a preference that fails a build is how a team
learns to pass `--force`.

Every rule carries a `why`, and the report prints it. A check with no
argument behind it gets deleted the first time it is inconvenient — which is
the right outcome for a check with no argument behind it.
