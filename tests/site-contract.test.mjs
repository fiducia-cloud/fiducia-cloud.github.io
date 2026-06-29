import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const page = await readFile(new URL("../src/pages/index.astro", import.meta.url), "utf8");
const layout = await readFile(new URL("../src/layouts/Layout.astro", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");

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

test("primary calls to action remain internal and deploy-prefix safe", () => {
  assert.match(page, /href="#start"/);
  assert.match(page, /href="#services"/);
  assert.match(page, /href=\{`\$\{base\}api\/info`\}/);
  assert.doesNotMatch(page, /javascript:/i);
});

test("layout keeps production metadata and viewport controls", () => {
  assert.match(layout, /<html lang="en">/);
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
