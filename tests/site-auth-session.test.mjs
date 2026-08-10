import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";
import { chromeExecutablePath, startSite } from "./site-browser-harness.mjs";

const APP_ORIGIN = "https://app.fiducia.cloud";
const STATUS_URL = `${APP_ORIGIN}/auth/session/status`;
const REFRESH_URL = `${APP_ORIGIN}/auth/session/refresh`;

test("account bar follows the token-blind session contract", async (t) => {
  const server = await startSite();
  t.after(() => server.stop());

  const browser = await chromium.launch({
    executablePath: chromeExecutablePath(),
    headless: true,
  });
  t.after(() => browser.close());

  const context = await browser.newContext({
    viewport: { height: 900, width: 1440 },
    serviceWorkers: "block",
  });
  t.after(() => context.close());

  let authenticated = false;
  const authRequests = [];
  await context.route(`${APP_ORIGIN}/auth/session/**`, async (route) => {
    authRequests.push([route.request().method(), route.request().url()]);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": new URL(server.url).origin,
        "Access-Control-Allow-Credentials": "true",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({
        authenticated,
        refreshAfterSeconds: 3000,
      }),
    });
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${server.url}/fiducia/`, { waitUntil: "networkidle" });

  const account = page.getByRole("navigation", { name: "Account" });
  const login = account.getByRole("link", { name: "Log in", exact: true });
  await login.waitFor({ state: "visible" });
  assert.equal(await login.getAttribute("href"), `${APP_ORIGIN}/login`);
  await account.getByRole("link", { name: "Sign up", exact: true }).waitFor({
    state: "visible",
  });
  assert.deepEqual(authRequests[0], ["GET", STATUS_URL]);

  authenticated = true;
  await page.evaluate(() => window.dispatchEvent(new Event("online")));

  const dashboard = account.getByRole("link", {
    name: "User dashboard",
    exact: true,
  });
  await dashboard.waitFor({ state: "visible" });
  assert.equal(await dashboard.getAttribute("href"), `${APP_ORIGIN}/app/dashboard`);
  assert.equal(await account.locator("[data-account-signup]").isHidden(), true);
  assert.ok(
    authRequests.some(([method, url]) => method === "POST" && url === REFRESH_URL),
    JSON.stringify(authRequests),
  );
  assert.deepEqual(pageErrors, []);
});
