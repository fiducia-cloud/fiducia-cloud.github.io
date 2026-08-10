import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const page = await readFile(new URL("../src/pages/index.astro", import.meta.url), "utf8");
const layout = await readFile(new URL("../src/layouts/Layout.astro", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
const accountCss = await readFile(
  new URL("../src/styles/account-nav.css", import.meta.url),
  "utf8",
);
const sessionClient = await readFile(
  new URL("../public/account-session.js", import.meta.url),
  "utf8",
);
const sessionWorker = await readFile(
  new URL("../public/account-session-sw.js", import.meta.url),
  "utf8",
);

test("landing page keeps every coordination primitive visible", () => {
  for (const label of [
    "Locks & Semaphores",
    "Rate Limiting",
    "Cron & Scheduling",
    "Config KV & Watches",
    "Leader Election",
    "Service Discovery",
  ]) {
    assert.ok(
      page.includes(label) || page.includes(label.replace("&", "&amp;")),
      `missing service label: ${label}`,
    );
  }
});

test("landing page speaks directly to AI-agent fleet coordination", () => {
  assert.match(page, /AI-agent\s+fleets/);
  for (const phrase of [
    "AI agent coordination",
    "Claim work once",
    "Gate scarce tools",
    "Elect supervisors",
  ]) {
    assert.ok(page.includes(phrase), `missing agent positioning: ${phrase}`);
  }
  assert.match(layout, /AI-agent fleets/);
});

test("primary calls to action remain internal and deploy-prefix safe", () => {
  assert.match(page, /href="#start"/);
  assert.match(page, /href="#services"/);
  assert.match(page, /href=\{`\$\{base\}api\/info`\}/);
  assert.doesNotMatch(page, /javascript:/i);
});

test("account bar is neutral until the token-blind Rust BFF check resolves", () => {
  for (const route of [
    "https://app.fiducia.cloud",
    "/login",
    "/app/signup",
    "/app/dashboard",
  ]) {
    assert.ok(layout.includes(route), `missing account destination: ${route}`);
  }

  assert.match(layout, /<header class="account-bar">/);
  assert.match(layout, /aria-label="Account"/);
  assert.match(layout, /data-account-primary/);
  assert.match(layout, /data-account-signup/);
  assert.match(layout, />Account<\/a>/);
  assert.match(layout, /data-account-signup[\s\S]*hidden[\s\S]*>Sign up<\/a>/);
  assert.doesNotMatch(layout, />Log in<\/a>/);
  assert.doesNotMatch(layout, />Dashboard<\/a>/);
  assert.match(layout, /Content-Security-Policy/);
  assert.match(layout, /connect-src \$\{accountOrigin\}/);
});

test("session client renders anonymous and authenticated states without token storage", () => {
  assert.match(sessionClient, /primary\.textContent = "Log in"/);
  assert.match(sessionClient, /primary\.textContent = "User dashboard"/);
  assert.match(sessionClient, /signup\.hidden = false/);
  assert.match(sessionClient, /signup\.hidden = true/);
  assert.match(sessionClient, /50 \* 60 \* 1000/);
  assert.match(sessionClient, /\/auth\/session\/status/);
  assert.match(sessionClient, /\/auth\/session\/refresh/);
  assert.match(sessionClient, /credentials: "include"/);
  assert.match(sessionClient, /visibilitychange/);
  assert.match(sessionClient, /periodicSync/);
  assert.match(sessionWorker, /periodicsync/);
  assert.match(sessionWorker, /credentials: "include"/);

  const sources = [layout, sessionClient, sessionWorker].join("\n");
  assert.doesNotMatch(sources, /SUPABASE_(URL|KEY|PUBLISHABLE_KEY|SERVICE_ROLE)/);
  assert.doesNotMatch(sources, /shared-auth.*secret/i);
  assert.doesNotMatch(sources, /localStorage|sessionStorage/);
  assert.doesNotMatch(sources, /access_token|refresh_token/);
});

test("account actions remain visible while the tested product nav is preserved", () => {
  assert.match(accountCss, /body\s*>\s*\.nav\s*\{\s*top:\s*var\(--fiducia-account-bar-height\);/);
  assert.match(accountCss, /\.account-bar__actions\s*\{[\s\S]*display:\s*flex;/);
  assert.match(accountCss, /@media \(max-width: 560px\)/);
  assert.match(accountCss, /\.account-bar__link\s*\{[\s\S]*min-height:\s*42px;/);
  assert.match(accountCss, /\.account-bar__link\[hidden\]\s*\{[\s\S]*display:\s*none;/);
  assert.doesNotMatch(accountCss, /\.account-bar__actions\s*\{[^}]*display:\s*none;/);
  assert.doesNotMatch(layout, /legacy-page-shell/);
});

test("layout keeps production metadata and viewport controls", () => {
  assert.match(layout, /lang="en"/);
  assert.match(layout, /name="viewport"/);
  assert.match(layout, /name="description"/);
  assert.match(layout, /property="og:title"/);
  assert.match(layout, /property="og:description"/);
});

test("responsive CSS protects mobile nav, grids, and terminal overflow", () => {
  assert.match(css, /@media \(max-width: 880px\)/);
  assert.match(css, /\.grid-3\s*\{\s*grid-template-columns: 1fr;/);
  assert.match(css, /\.nav__links\s*\{\s*display: none;/);
  assert.match(css, /overflow-x: auto;/);
});

test("CNAME and astro config agree on the canonical domain fiducia.cloud", async () => {
  const cname = (await readFile(new URL("../public/CNAME", import.meta.url), "utf8")).trim();
  assert.equal(cname, "fiducia.cloud");

  const { default: config } = await import("../astro.config.mjs");
  assert.equal(config.site, "https://fiducia.cloud");
  assert.equal(new URL(config.site).hostname, cname);
});

test("consensus pitching carries the crash-fault (CFT, not Byzantine) qualifier", () => {
  const sources = { "src/pages/index.astro": page, "src/layouts/Layout.astro": layout };
  const pitches = /consensus|election|financial|payout|custody|exactly-once/i;
  const qualifier = /crash-fault\s+tolerant\s*\(CFT\)[^.]*not\s+Byzantine/is;

  const pitching = Object.entries(sources)
    .filter(([, text]) => pitches.test(text))
    .map(([name]) => name);
  assert.ok(pitching.length > 0);
  assert.ok(
    Object.values(sources).some((text) => qualifier.test(text)),
    `these sources pitch consensus/elections (${pitching.join(", ")}) but no page copy carries the crash-fault qualifier`,
  );

  for (const [name, text] of Object.entries(sources)) {
    assert.doesNotMatch(text, /trustless/i, `${name}: never pitch trustless security`);
    assert.doesNotMatch(
      text,
      /byzantine[\s-]+fault[\s-]+toleran|\bBFT\b/i,
      `${name}: never claim Byzantine fault tolerance`,
    );
  }
});
