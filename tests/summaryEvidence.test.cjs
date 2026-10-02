require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { compareExtractions } = require("../lib/compareExtractions.ts");
const { SAMPLE_OFFER, SAMPLE_CONTRACT } = require("../lib/sampleExtractions.ts");
const { buildLocalSummary } = require("../lib/localSummary.ts");
const { evidenceRows, generatedDate, EVIDENCE_TITLE, EVIDENCE_DECLARATION } = require("../lib/evidence.ts");
const { LocalSummary } = require("../app/LocalSummary.tsx");
const { EvidenceSheet } = require("../app/EvidenceSheet.tsx");
const { ResultsAuthority } = require("../app/ResultsAuthority.tsx");
const { routingResult } = require("../lib/authorityContent.ts");
const comparison = compareExtractions(SAMPLE_OFFER, SAMPLE_CONTRACT);

// Deliberately non-legal fixtures. Production authority constants await supplied text.
const authorityFixture = {
  ruleCard: { text: "Fixture rule text.\nSecond fixture line.", source: "Fixture source line." },
  routingQuestion: "Fixture routing question?",
  routingOptions: [{ id: "fixture", label: "Fixture option", result: "Fixture selected result." }],
  fallbackRoutingResult: "Other free zone or not sure: fixture fallback result.",
  whatToBring: ["Fixture item one.", "Fixture item two."],
};

test("four deterministic summaries contain the sample values without legal claims", () => {
  for (const language of ["English", "Urdu", "Hindi", "Bengali"]) {
    const text = buildLocalSummary(comparison, language).join("\n");
    for (const value of ["Electrician", "General Helper", "2000", "1200"]) assert.ok(text.includes(value));
    assert.doesNotMatch(text, /illegal|deadline|fine|80084|MOHRE|ADGM/);
  }
  assert.match(buildLocalSummary(comparison, "English").join("\n"), /This is different from your offer/);
});

test("Urdu summary container is RTL; other languages are LTR", () => {
  for (const language of ["English", "Urdu", "Hindi", "Bengali"]) {
    const html = renderToStaticMarkup(React.createElement(LocalSummary, { comparison, language, usingSample: true }));
    assert.ok(html.includes(`dir="${language === "Urdu" ? "rtl" : "ltr"}"`));
    assert.ok(html.includes("installed language or English voice"));
  }
});

test("evidence has only differences and preserves exact quotes including whitespace", () => {
  const offer = { ...SAMPLE_OFFER, source_quotes: { job_title: "  Electrician\n", monthly_salary_aed: "AED 2000" } };
  const contract = { ...SAMPLE_CONTRACT, source_quotes: { job_title: "General Helper", monthly_salary_aed: "AED 1200" } };
  const rows = evidenceRows(comparison, offer, contract);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].offer_quote, "  Electrician\n");
  assert.equal(rows[1].contract_quote, "AED 1200");
  assert.equal(evidenceRows(comparison, SAMPLE_OFFER, SAMPLE_CONTRACT)[0].offer_quote, "");
});

test("evidence renders in English with fixed content in the requested order and no controls", () => {
  const html = renderToStaticMarkup(React.createElement(EvidenceSheet, {
    comparison, offer: SAMPLE_OFFER, contract: SAMPLE_CONTRACT, date: "2 October 2026",
    authorityContent: authorityFixture, routingResult: null,
  }));
  assert.ok(html.includes('lang="en" dir="ltr"'));
  const inOrder = [EVIDENCE_TITLE, "2 October 2026", "Job title", authorityFixture.ruleCard.text,
    authorityFixture.ruleCard.source, authorityFixture.fallbackRoutingResult, "What to bring", "Fixture item one.", EVIDENCE_DECLARATION];
  let previous = -1;
  for (const text of inOrder) {
    const next = html.indexOf(text, previous + 1);
    assert.ok(next > previous, `Missing or out of order: ${text}`);
    previous = next;
  }
  assert.doesNotMatch(html, /<button|<audio|Fixture routing question|Weekly hours/);
  const selected = renderToStaticMarkup(React.createElement(EvidenceSheet, {
    comparison, offer: SAMPLE_OFFER, contract: SAMPLE_CONTRACT, date: "2 October 2026",
    authorityContent: authorityFixture, routingResult: authorityFixture.routingOptions[0].result,
  }));
  assert.ok(selected.includes(authorityFixture.routingOptions[0].result));
  assert.ok(!selected.includes(authorityFixture.fallbackRoutingResult));
});

test("date uses the UAE date and English format across a UTC day boundary", () => {
  assert.equal(generatedDate(new Date("2026-10-01T21:30:00Z")), "2 October 2026");
});

test("rule card, routing result and bring list are present without disclosure controls", () => {
  const html = renderToStaticMarkup(React.createElement(ResultsAuthority, {
    content: authorityFixture, selectedId: null, onSelect: () => {},
  }));
  for (const text of [authorityFixture.ruleCard.text, authorityFixture.ruleCard.source,
    authorityFixture.fallbackRoutingResult, ...authorityFixture.whatToBring]) assert.ok(html.includes(text));
  assert.doesNotMatch(html, /<details|<summary|hidden=/);
  assert.equal(routingResult(authorityFixture, null), authorityFixture.fallbackRoutingResult);
  assert.equal(routingResult(authorityFixture, "fixture"), authorityFixture.routingOptions[0].result);
  assert.equal(routingResult(authorityFixture, "unknown"), authorityFixture.fallbackRoutingResult);
});
