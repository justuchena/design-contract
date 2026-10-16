# `pipeline/`

Six scripts and two typefaces. Each script exists because of a specific
mistake it prevents.

## `contrast.mjs`

```bash
node pipeline/contrast.mjs examples/meridian/palette.json
```

Every foreground against every ground it is *for*, as a matrix.

**The mistake it prevents:** measuring contrast against white only. A system
with a page colour and a plate colour has two grounds, and a grey can clear
4.5:1 on one and miss it on the other. That is the commonest real
accessibility bug in any system with more than one surface, and no
single-ground tool will ever show it to you.

Each foreground declares the grounds it applies to:

```json
"fg-subtle": { "value": "#6b7280", "requires": "text", "on": ["paper", "tint"] },
"on-ink":    { "value": "#fcfcfa", "requires": "text", "on": ["ink"] }
```

Without `on`, the matrix dutifully reports that dark type fails on a dark
ground — true, expected, and it buries the finding worth having. Unscoped
pairs still print their ratio in brackets, without a floor.

`requires` takes `text` (4.5:1), `large` or `ui` (3:1), `decorative` (no
floor), or a number. Exits non-zero if a declared pair misses its floor.

The output section headed **Conditional** is the point of the tool.

## `derive.mjs`

```bash
node pipeline/derive.mjs src/styles/tokens.css          # write
node pipeline/derive.mjs src/styles/tokens.css --check   # fail if stale
```

`tokens.css` → `design-tokens.json`, in [Design Tokens Format
Module](https://tr.designtokens.org/format/) shape.

**The mistake it prevents:** two hand-maintained copies of a palette. They
always diverge. The CSS has to be the source, because that is what the
browser reads — but anything that is not a browser needs the values as data,
so the JSON is written *from* the CSS and `--check` fails a build when it is
stale. Put `--check` in CI; it is the only thing that actually keeps them
equal.

Two details that matter:

- **Only the base `:root` block is read.** A `.dark` or `[data-theme]` block
  is a theme override, and folding it in would overwrite base values
  depending on declaration order.
- **Comments are stripped before matching.** A comment is usually where the
  *rejected* value is recorded, which is precisely the value you least want
  in your token file.

A token whose prefix matches no group lands in `other` and the script says
so. A growing `other` means your naming has drifted from your structure.

## `shots.mjs`

```bash
node pipeline/shots.mjs --base http://localhost:5173 --routes / /pricing \
  --ready "main" --widths 390 768 1440
```

Screenshots a running app at several widths.

**The mistake it prevents:** reporting a UI change as done without looking at
it. A design doc cannot tell you a section is one card too long, and neither
can a checker.

Three things it does that a naive script does not:

1. **Waits for a real selector (`--ready`), not a fixed sleep.** A sleep
   catches the app mid-recompile, and a screenshot of a spinner looks enough
   like a page to fool you at a glance.
2. **Captures page errors and console errors.** A screenshot of a blank page
   and one of a working page are the same file size. Exits non-zero if any
   fired.
3. **Shoots narrow first.** 390 before 1440, because the layout that breaks
   is almost always the narrow one and it is the one nobody checks.

It also waits on `document.fonts.ready`, so you are not looking at the
fallback face and debugging a metrics problem that does not exist.

Needs playwright:

```bash
npm i -D playwright && npx playwright install chromium
```

For screens behind a login, `--cookie-file path --cookie-name authToken`
reads the token from a file so it never lands in shell history.

## `fix-gate.mjs`

```bash
node pipeline/fix-gate.mjs --base http://localhost:5173 --routes / /pricing
```

Shoots the app, runs `design-check --fix`, shoots it again, and says what
moved.

It exists because `--fix` can only ever satisfy a rule. Whether the page
still says what it said before is a different question, and no rule in this
repo can answer it — `min-h-0` is *supposed* to change the layout, and a
retired hue swapped for a token is supposed to change the colour. So the gate
has no opinion about whether a change was right. Its whole job is that nobody
reports the work done without seeing it:

```
── what moved ──

  index-390.png                unchanged
  pricing-390.png              10.04% of pixels (24096)
  apply-1440.png               1440×2210 → 1440×1612, the page changed size

7 fix(es) applied. 2 of 6 screenshot(s) moved.
Masks in .fix-gate/diff/ — the marked pixels are the ones that moved.
Exit 1 because something moved, not because something broke.
```

Four properties that matter:

**The "before" shots are taken first.** So a missing browser aborts the run
with the tree untouched — the gate never rewrites code it could not
photograph. A test asserts the ordering, because getting it backwards would
leave a diff whose effect nobody can see.

**It shoots the full page, not the viewport** — the opposite of
`shots.mjs`, and the default rather than a flag. A fix lands wherever the
class it rewrote happens to be. `--viewport-only` opts out when a
full-height capture is the slow part.

**A page that changed size is reported as that, not as a percentage.** It is
the strongest signal available and needs no number beside it.

**It exits non-zero whenever anything moved at all.** Not because the change
is wrong, but so a CI lane cannot carry a visual change through on a green
tick. A changed page is not a failure; an unexamined one is.

Two of those four are in the shape they are because of the first live run
against a real app, and both were the same bug wearing different clothes — a
silent pass:

| What went wrong | Why |
|---|---|
| The gate rewrote a file, then reported "nothing was rewritten", skipped the after shots and exited 0 | The checker prints its report to stderr, and `execFileSync` returns only stdout. With nothing left to decide it exits 0, so there was no exception to read stderr from. It reads both streams now, and a missing summary is treated as *unknown* rather than as nothing. |
| With the fix applied, every route reported unchanged although a colour had plainly moved | The rewritten class was 7,500px down an 18,000px landing page, and the shots were viewport-only. Full page is now the default. |

Neither was reachable from the fixture, and neither would have been caught by
a test that mocked the browser. A gate whose failure mode is a green tick has
to be run against something real before it is trusted.

## `visual-diff.mjs`

```bash
node pipeline/visual-diff.mjs .fix-gate/before .fix-gate/after --diff .fix-gate/diff
```

The comparison on its own, for any two directories of screenshots: two
branches, two themes, before and after any change at all. It is a separate
script for a second reason as well — a comparison that needs a running
browser to test is a comparison that does not get tested, and this one is
covered by nineteen assertions over synthetic images.

The default pixel threshold is a channel delta of 8, which is the band that
two runs of the same browser differ by on font rasterisation. Raising it is
how you stop seeing a one-step colour token swap, which is the change this
most needs to catch.

## `png.mjs`

Enough PNG to compare two screenshots: one inflate and five row filters,
over `node:zlib`. Not a general decoder, and that is the point — 16-bit
samples, a palette and Adam7 interlacing are all legal PNG, none of them come
out of a browser screenshot, and each one throws by name rather than being
half-handled. A decoder that silently mangles an unexpected format would
report a visual change that is not there, which is the one thing a gate must
never do.

It is here rather than in `package.json` because this repo's answer to a
dependency is the same every time: a hundred lines that work on every Node
there has ever been are cheaper than being wrong about a version table twice.
Validated by round-tripping real screenshots from three different encoders.

## `fonts/`

Inter and Outfit, subset to latin and latin-ext, as woff2. Both under the SIL
Open Font License 1.1 — see `OFL-Inter.txt` and `OFL-Outfit.txt`.

These are vendored rather than linked because a self-hosted webfont is a
build input. Everything else in this pack's resource list is a link, for the
reason given in [`../resources/README.md`](../resources/README.md).

Self-host rather than using `fonts.googleapis.com`: it is a third-party
request on every page load, and it is render-blocking.
