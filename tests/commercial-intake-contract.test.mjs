import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [hub, quote, preInterest, application, component, layout] = await Promise.all([
  read("../src/pages/get-started.astro"),
  read("../src/pages/quote.astro"),
  read("../src/pages/pre-interest.astro"),
  read("../src/pages/apply.astro"),
  read("../src/components/CommercialJourney.astro"),
  read("../src/layouts/Layout.astro"),
]);

const discoverySources = {
  "get-started": hub,
  quote,
  "pre-interest": preInterest,
  apply: application,
  component,
};

test("commercial discovery exposes the three protected customer journeys", () => {
  const destinations = [
    "https://user.fiducia.cloud/quote",
    "https://user.fiducia.cloud/pre-interest",
    "https://user.fiducia.cloud/apply",
  ];

  for (const destination of destinations) {
    assert.ok(
      Object.values(discoverySources).some((source) => source.includes(destination)),
      `missing protected destination: ${destination}`,
    );
  }

  assert.match(layout, /getStarted:\s*`\$\{base\}get-started\/`/);
  assert.match(layout, />Get started<\/a>/);
});

test("the public marketing site never becomes a second intake processor", () => {
  for (const [name, source] of Object.entries(discoverySources)) {
    assert.doesNotMatch(source, /<form\b/i, `${name} must not collect intake data`);
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${name} must not submit intake data`);
    assert.doesNotMatch(source, /https:\/\/api\.fiducia\.cloud/i, `${name} must not call the API`);
    assert.doesNotMatch(source, /supabase/i, `${name} must not embed a database client`);
  }
});

test("quote discovery states the non-binding estimate boundary", () => {
  assert.match(quote, /non-binding estimate/i);
  assert.match(quote, /No offer, capacity reservation, certification, service credit, or contractual SLA/i);
  assert.match(quote, /signed order form/i);
});

test("pre-interest discovery remains a low-friction non-contractual registration", () => {
  assert.match(preInterest, /Low-friction evaluation entry/);
  assert.match(preInterest, /does not create a customer account, order, reservation, SLA/i);
  assert.match(preInterest, /coordination capabilities/i);
});

test("enterprise discovery covers technical, support, service-level, and B2B review", () => {
  for (const phrase of [
    "Architecture and reliability",
    "Security, support, and service levels",
    "B2B contract and procurement",
    "MSA, SOW, order form, SLA, DPA, NDA, AUP",
    "RPO, RTO",
    "technical account management",
    "liability, indemnity, insurance, audit, data processing",
  ]) {
    assert.ok(
      application.includes(phrase) || hub.includes(phrase),
      `missing enterprise application topic: ${phrase}`,
    );
  }

  assert.match(application, /requested SLO\/SLA requirements/i);
  assert.match(application, /remain non-binding until expressly accepted in a signed order form/i);
});

test("commercial copy rejects secret material without embedding secret values", () => {
  assert.match(component, /Do not include passwords, access tokens, private keys/);
  assert.doesNotMatch(
    Object.values(discoverySources).join("\n"),
    /(?:BEGIN [A-Z ]+ PRIVATE KEY|postgres(?:ql)?:\/\/[^\s"']+@|Bearer\s+[A-Za-z0-9._~-]{20,})/i,
  );
});
