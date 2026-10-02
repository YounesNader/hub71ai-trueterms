require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseContractText } = require("../lib/parseContractText.ts");
const { PREPARED_CASES } = require("../lib/preparedCases.ts");
const { compareExtractions } = require("../lib/compareExtractions.ts");
const { buildLocalSummary } = require("../lib/localSummary.ts");
const { isExtraction } = require("../lib/extraction.ts");
const { emptyExtraction } = require("../lib/parseContractText.ts");
const { GET } = require("../app/api/status/route.ts");
const { AUTHORITY_CONTENT, PROJECT_FOOTER, routingResult } = require("../lib/authorityContent.ts");

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

test("plain table rows and paragraph contracts produce comparable terms without colons", () => {
  // Employment facts only; no legal wording or personal document contents in fixtures.
  const offer = parseContractText([
    "EXAMPLE SERVICES LLC", "Position and reporting line Operations Coordinator, reporting to the Manager",
    "Place of work Abu Dhabi, UAE", "Contract type Full-time, fixed term of 2 years",
    "Basic salary AED 7,500 per month", "Allowances Housing AED 3,000 | Transport AED 1,000 | Telephone AED 300",
    "Total monthly salary AED 11,800", "Working hours 8 hours per day, 48 hours per week",
    "Annual leave 30 calendar days per year",
  ].join("\n"), "offer");
  const contract = parseContractText([
    "EXAMPLE SERVICES LLC", "Between Example Services LLC, the employer",
    "2. Position and place. The Employee is employed full-time as Operations Coordinator in Abu Dhabi, reporting to the",
    "Manager.", "3. Term. The contract runs for 2 years from the stated start date.",
    "5. Remuneration. Basic salary AED 7,500, housing AED 3,000, transport AED 1,000, telephone AED 300; total AED 11,800",
    "per month.", "6. Working hours. 8 hours per day and 48 hours per week.",
    "7. Leave. 30 calendar days' paid annual leave per year.",
  ].join("\n"), "contract");
  for (const value of [offer, contract]) {
    assert.equal(value.job_title, "Operations Coordinator"); assert.equal(value.monthly_salary_aed, 11800);
    assert.equal(value.weekly_hours, 48); assert.equal(value.annual_leave_days, 30);
    assert.equal(value.work_location, "Abu Dhabi"); assert.equal(value.contract_duration, "2 years");
    assert.equal(value.allowances_aed, null); assert.equal(value.passport_clause, null);
  }
  const result = compareExtractions(offer, contract);
  assert.equal(result.different_count, 0);
  assert.equal(result.rows.filter((row) => row.status === "same").length, 7);
  assert.equal(contract.source_quotes.monthly_salary_aed, "5. Remuneration. Basic salary AED 7,500, housing AED 3,000, transport AED 1,000, telephone AED 300; total AED 11,800\nper month.");
});

test("stacked labels and values are recognised and conflicting repeated values remain missing", () => {
  const extraction = parseContractText("Job title\nElectrician\nMonthly salary (AED)\nAED 2000\nWeekly hours\n48", "offer");
  assert.equal(extraction.job_title, "Electrician"); assert.equal(extraction.monthly_salary_aed, 2000);
  assert.equal(extraction.weekly_hours, 48); assert.equal(extraction.source_quotes.job_title, "Job title\nElectrician");
  assert.equal(parseContractText("Total monthly salary AED 2000\nTotal monthly salary AED 1200", "offer").monthly_salary_aed, null);
});

test("unreadable documents never generate an everything-matches summary", () => {
  const result = compareExtractions(emptyExtraction("offer"), emptyExtraction("contract"));
  assert.match(buildLocalSummary(result, "English")[0], /No terms could be compared/);
});

test("template summaries have at most four paragraphs and do not claim missing terms match", () => {
  const example = PREPARED_CASES[0];
  const comparison = compareExtractions(example.offer, example.contract);
  for (const language of ["English", "Urdu", "Hindi", "Bengali"]) assert.ok(buildLocalSummary(comparison, language).length <= 4);
  const match = PREPARED_CASES[1];
  assert.match(buildLocalSummary(compareExtractions(match.offer, match.contract), "English")[0], /terms found in both documents match/);
});

test("status exposes only an uncached boolean and changes when the server key is configured", async () => {
  const saved = process.env.OPENAI_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    const offline = await GET();
    assert.deepEqual(await offline.json(), { openaiAvailable: false });
    assert.equal(offline.headers.get("cache-control"), "no-store");
    process.env.OPENAI_API_KEY = "test-placeholder-not-a-secret";
    assert.deepEqual(await (await GET()).json(), { openaiAvailable: true });
  } finally {
    if (saved === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = saved;
  }
});

test("authority content reuses the project disclaimer and returns only worker-selected names", () => {
  assert.equal(AUTHORITY_CONTENT.ruleCard.text, PROJECT_FOOTER);
  assert.ok(require("node:fs").readFileSync("AGENTS.md", "utf8").includes(PROJECT_FOOTER));
  assert.equal(routingResult(AUTHORITY_CONTENT, null), "Other free zone or not sure");
  assert.equal(routingResult(AUTHORITY_CONTENT, "adgm"), "ADGM");
  assert.equal(routingResult(AUTHORITY_CONTENT, "mohre"), "MOHRE");
  assert.deepEqual(AUTHORITY_CONTENT.whatToBring, ["Job offer image", "Contract image"]);
});
