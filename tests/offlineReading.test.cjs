require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseContractText } = require("../lib/parseContractText.ts");
const { PREPARED_CASES } = require("../lib/preparedCases.ts");
const { compareExtractions } = require("../lib/compareExtractions.ts");
const { buildLocalSummary } = require("../lib/localSummary.ts");
const { isExtraction } = require("../lib/extraction.ts");

test("each printed example parses to its prepared extraction with exact quotes", () => {
  for (const example of PREPARED_CASES) {
    for (const type of ["offer", "contract"]) {
      const parsed = parseContractText(Object.values(example[type].source_quotes).join("\n"), type);
      assert.deepEqual(parsed, example[type]);
      assert.ok(isExtraction(parsed));
    }
    assert.equal(compareExtractions(example.offer, example.contract).different_count, example.id === "matching" ? 0 : 2);
  }
});

test("parser does not infer currencies, annual amounts, ambiguous values, or conflicting labels", () => {
  for (const line of ["Monthly salary: USD 2000", "Monthly salary: AED 2000 per year", "Salary: AED 2000", "Monthly salary: AED 1200 to 2000", "Monthly salary: AED -2000", "Monthly salary: AED 2000\nMonthly salary: AED 1200"]) {
    assert.equal(parseContractText(line, "offer").monthly_salary_aed, null, line);
  }
  assert.equal(parseContractText("Weekly hours: 8 per day", "offer").weekly_hours, null);
  assert.equal(parseContractText("Annual leave: 30", "offer").annual_leave_days, null);
});

test("parser preserves source whitespace and recognises money separators and labels", () => {
  const extraction = parseContractText("  Position: Electrician  \nMonthly wage: AED 2,000.50 per month\nEmployer name: Demo Company", "offer");
  assert.equal(extraction.job_title, "Electrician");
  assert.equal(extraction.monthly_salary_aed, 2000.5);
  assert.equal(extraction.source_quotes.job_title, "  Position: Electrician  ");
});

test("template summaries have at most four paragraphs and do not claim missing terms match", () => {
  const example = PREPARED_CASES[0];
  const comparison = compareExtractions(example.offer, example.contract);
  for (const language of ["English", "Urdu", "Hindi", "Bengali"]) assert.ok(buildLocalSummary(comparison, language).length <= 4);
  const match = PREPARED_CASES[1];
  assert.match(buildLocalSummary(compareExtractions(match.offer, match.contract), "English")[0], /terms found in both documents match/);
});
