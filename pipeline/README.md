# `pipeline/`

Three scripts and two typefaces. Each script exists because of a specific
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

## `fonts/`

Inter and Outfit, subset to latin and latin-ext, as woff2. Both under the SIL
Open Font License 1.1 — see `OFL-Inter.txt` and `OFL-Outfit.txt`.

These are vendored rather than linked because a self-hosted webfont is a
build input. Everything else in this pack's resource list is a link, for the
reason given in [`../resources/README.md`](../resources/README.md).

Self-host rather than using `fonts.googleapis.com`: it is a third-party
request on every page load, and it is render-blocking.
