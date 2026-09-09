import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const pageUrl = new URL("../src/pages/pub/api.astro", import.meta.url);
const evidenceUrl = new URL("../public/pub/api/evidence.json", import.meta.url);
const page = await readFile(pageUrl, "utf8");
const evidence = JSON.parse(await readFile(evidenceUrl, "utf8"));

const validatorRevision = "dfc28bfc000faba5a963f23c708171dfd5f8debf";
const shaPattern = /^[0-9a-f]{40}$/u;

const requiredConcepts = [
  "Fiducia lease",
  "PostgreSQL transaction-scoped advisory lock",
  "pg_try_advisory_xact_lock",
  "pg_advisory_xact_lock",
  "final renewal",
  "Final renewal and PostgreSQL commit are not atomic",
  "resource-side fencing",
  "fencing_token < $1",
  "full unsigned 64-bit fencing token",
  "TypeSpec",
  "JSON Schema Draft 2020-12",
  "Schema B",
  "Contract IR",
  "tjsv check",
  "tjsv verify-ir",
  "verifyLanguageBoundaries",
  "stale-receipt",
  "Rust",
  "Go",
  "TypeScript",
  "Dart",
  "Gleam",
];

test("the public API route preserves the maintained-lock safety model", () => {
  for (const concept of requiredConcepts) {
    assert.ok(page.includes(concept), `missing maintained-lock concept: ${concept}`);
  }
  assert.ok(page.includes(validatorRevision), "validator must be linked by immutable revision");
  assert.match(page, /ORESoftware\/ores-locks-and-leases/);
  assert.match(page, /ORESoftware\/typespec-json-schema-validator/);
});

test("public evidence binds the page to immutable implementation and validator revisions", () => {
  assert.equal(evidence.schema, "fiducia.public-api.maintained-lock-evidence/v1");
  assert.equal(evidence.implementation.repository, "ORESoftware/ores-locks-and-leases");
  assert.match(evidence.implementation.revision, shaPattern);
  assert.equal(evidence.implementation.pullRequest, 26);
  assert.equal(evidence.implementation.promotionState, "candidate");
  assert.equal(evidence.validator.repository, "ORESoftware/typespec-json-schema-validator");
  assert.equal(evidence.validator.revision, validatorRevision);
  assert.equal(evidence.validator.parityCommand, "tjsv check");
  assert.equal(evidence.validator.contractIrCommand, "tjsv verify-ir");
  assert.equal(evidence.validator.languageBoundaryVerifier, "verifyLanguageBoundaries");
  assert.deepEqual(evidence.requiredLanguages, ["rust", "go", "typescript", "dart", "gleam"]);
  assert.deepEqual(evidence.authorityModel, {
    typeSpec: "independently-authored-peer",
    jsonSchema: "independently-authored-peer",
    generatedSchemaB: "comparison-evidence-only",
    contractIr: "derived-evidence-only",
    precedence: "none",
  });
  assert.equal(evidence.route, "https://fiducia.cloud/pub/api");
  assert.equal(evidence.tracking, "DEN-2050");
});

test("the page does not overclaim atomicity, fencing, or consensus", () => {
  assert.doesNotMatch(page, /final renewal and PostgreSQL commit are atomic/i);
  assert.doesNotMatch(page, /advisory locks eliminate the need for fencing/i);
  assert.doesNotMatch(page, /guarantees (?:linearizability|consensus|exactly-once)/i);
  assert.doesNotMatch(page, /Byzantine fault toleran|\bBFT\b|trustless/i);
  assert.match(page, /does not replace\s+resource-side fencing/i);
});

test("the static marketing page does not collect credentials or customer data", () => {
  assert.doesNotMatch(page, /<form\b/i);
  assert.doesNotMatch(page, /<input\b/i);
  assert.doesNotMatch(page, /SUPABASE_|DATABASE_URL|API_KEY|Bearer\s+[A-Za-z0-9]/i);
  assert.doesNotMatch(page, /javascript:/i);
});

test("the API guide remains accessible and responsive", () => {
  assert.match(page, /<main>/);
  assert.match(page, /aria-labelledby=/);
  assert.match(page, /aria-label="Rust maintained transaction example"/);
  assert.match(page, /aria-label="PostgreSQL fencing update"/);
  assert.match(page, /overflow-x:\s*auto/);
  assert.match(page, /@media \(max-width: 960px\)/);
  assert.match(page, /@media \(max-width: 720px\)/);
});

test("Astro emits /pub/api and evidence metadata when a build is present", async (context) => {
  const builtUrl = new URL("../dist/pub/api/index.html", import.meta.url);
  const builtEvidenceUrl = new URL("../dist/pub/api/evidence.json", import.meta.url);
  let built;
  try {
    built = await readFile(builtUrl, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      context.skip("source-only test run; npm run build verifies emitted route");
      return;
    }
    throw error;
  }
  const builtEvidence = JSON.parse(await readFile(builtEvidenceUrl, "utf8"));
  assert.match(built, /Keep distributed authority through the database commit/);
  assert.match(built, /verifyLanguageBoundaries/);
  assert.match(built, /Final renewal and PostgreSQL commit are not atomic/);
  assert.equal(builtEvidence.implementation.revision, evidence.implementation.revision);
  assert.equal(builtEvidence.validator.revision, validatorRevision);
});
