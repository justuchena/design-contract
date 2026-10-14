#!/usr/bin/env node
/**
 * Screenshot a running app at several widths, so you can actually look at it.
 *
 *     node pipeline/shots.mjs --base http://localhost:5173 --out .shots \
 *       --routes / /pricing /dashboard
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 * Because a design doc cannot tell you that a section is one card too long,
 * and neither can a checker. Reporting a UI change as done without looking
 * at it is the single most common way to ship something visibly wrong.
 *
 * ── Three things it does that a naive version does not ───────────────────
 * 1. **Waits for a real selector, not a fixed sleep.** A sleep catches the
 *    app mid-recompile after an edit, and a screenshot of a spinner looks
 *    enough like a page to fool you at a glance. `--ready` takes a selector
 *    that only exists once the shell has painted.
 * 2. **Captures page errors.** A screenshot of a blank page and a screenshot
 *    of a working page are the same file size. The console tells you which
 *    one you have.
 * 3. **Shoots narrow first.** The layout that breaks is almost always the
 *    narrow one, and it is the one nobody checks.
 *
 * Requires playwright: `npm i -D playwright && npx playwright install chromium`
 */
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const list = (name, fallback = []) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const out = [];
  for (let k = i + 1; k < argv.length && !argv[k].startsWith("--"); k += 1) out.push(argv[k]);
  return out.length ? out : fallback;
};

const BASE = (arg("base", "http://localhost:5173")).replace(/\/$/, "");
const OUT = arg("out", ".shots");
const ROUTES = list("routes", ["/"]);
const READY = arg("ready");
const FULL = argv.includes("--full");

/* Narrow first, deliberately. 390 is a phone, 768 is the tablet break most
   layouts forget, 1440 is the one everybody designs on and the only one most
   people ever look at. */
const WIDTHS = list("widths", ["390", "768", "1440"]).map(Number);

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("playwright is not installed.");
  console.error("  npm i -D playwright && npx playwright install chromium");
  process.exit(2);
}

/* An auth cookie, when the screens worth looking at are behind a login.
   Takes a file so a token never lands in shell history. */
const cookieFile = arg("cookie-file");
const cookieName = arg("cookie-name", "authToken");
const cookies = [];
if (cookieFile) {
  if (!existsSync(cookieFile)) {
    console.error(`no cookie file at ${cookieFile}`);
    process.exit(2);
  }
  const value = readFileSync(cookieFile, "utf8").trim().replace(/^[A-Z_]+=/, "");
  const { hostname } = new URL(BASE);
  cookies.push({ name: cookieName, value, domain: hostname, path: "/" });
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const errors = [];
let shots = 0;

for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: Math.round(width * 0.66) + 300 },
    deviceScaleFactor: 2,
  });
  if (cookies.length) await ctx.addCookies(cookies);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${width}px ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${width}px console: ${m.text().slice(0, 160)}`);
  });

  for (const route of ROUTES) {
    const url = `${BASE}${route.startsWith("/") ? route : `/${route}`}`;
    const name = route === "/" ? "index" : route.replace(/^\//, "").replace(/[^\w.-]+/g, "-");
    const file = join(OUT, `${name}-${width}.png`);

    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    if (READY) await page.waitForSelector(READY, { timeout: 20000 }).catch(() => {
      errors.push(`${width}px ${route}: never saw ${READY}`);
    });
    /* Fonts specifically. A screenshot taken before the webfont swaps shows
       the fallback, and then you spend an hour on a metrics problem that
       does not exist. */
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    await page.waitForTimeout(400);

    await page.screenshot({ path: file, fullPage: FULL });
    shots += 1;
    console.log(`${file}  ${page.url()}`);
  }
  await ctx.close();
}

await browser.close();

console.log(`\n${shots} screenshot(s) in ${OUT}/`);
if (errors.length) {
  console.log(`\n⚠️  ${errors.length} page error(s) — a blank page screenshots fine:\n`);
  for (const e of [...new Set(errors)].slice(0, 10)) console.log(`  ${e}`);
  process.exit(1);
}
console.log("No page errors. Now open the narrow ones.");
