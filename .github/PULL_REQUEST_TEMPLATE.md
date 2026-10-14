## What and why

<!-- The diff shows the what. Use this space for the why. -->

## If this adds or changes a rule

- [ ] The failure it prevents is described, concretely
- [ ] A case is added to `enforce/fixture/src/`
- [ ] An assertion is added to `enforce/test.mjs`
- [ ] A **negative case** is covered — something that looks like a violation and must not fire
- [ ] The `why` string reads as a sentence you would say to a colleague who just hit it

## Checks

- [ ] `node enforce/test.mjs` passes
- [ ] `node pipeline/derive.mjs examples/meridian/tokens.css --check` passes

<!-- refs/ is redistributed unmodified from nexu-io/open-design under
     Apache-2.0. PRs editing package contents will be closed with a pointer
     upstream; see CONTRIBUTING.md. -->
