# Security

This project is a set of local developer scripts. It makes no network
requests, has no required dependencies, and reads only the files you point it
at.

Two places where a report would nonetheless be worth making:

- **`enforce/design-check.mjs`** imports your `design-check.config.mjs` as an
  ES module, so that file executes. This is intentional and is the same trust
  model as `eslint.config.js` or `vite.config.ts` — but if you find a way to
  make the checker execute something *other* than your own config, that is a
  bug worth reporting.
- **`pipeline/shots.mjs`** drives Playwright against a URL you supply and can
  read an auth token from a file. If you find a path where that token leaks
  into output, a filename, or a screenshot, please report it.

## Reporting

Use GitHub's private vulnerability reporting on this repository
(**Security → Report a vulnerability**), or contact @justuchena on GitHub.

Please do not open a public issue for something exploitable. For anything
else — a crash, a false positive, a wrong number — a normal issue is right.

## Supported versions

The `main` branch. This project has no release branches to backport to.
