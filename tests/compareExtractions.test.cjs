require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { compareExtractions } = require("../lib/compareExtractions.ts");
const { SAMPLE_OFFER, SAMPLE_CONTRACT } = require("../lib/sampleExtractions.ts");

test("sample has exactly two different employment terms, excluding metadata", () => {
  const result = compareExtractions(SAMPLE_OFFER, SAMPLE_CONTRACT);
  assert.equal(result.different_count, 2);
  assert.equal(result.rows.length, 9);
  assert.deepEqual(result.rows.filter(row => row.status === "different"), [
    { field: "job_title", offer: "Electrician", contract: "General Helper", status: "different" },
    { field: "monthly_salary_aed", offer: 2000, contract: 1200, status: "different" },
  ]);
  assert.equal(result.rows.find(row => row.field === "weekly_hours").status, "same");
});

test("text trims and lowercases; original values are preserved", () => {
  const contract = { ...SAMPLE_OFFER, job_title: "  ELECTRICIAN  ", source_quotes: { job_title: "different quote" } };
  const row = compareExtractions(SAMPLE_OFFER, contract).rows.find(row => row.field === "job_title");
  assert.deepEqual(row, { field: "job_title", offer: "Electrician", contract: "  ELECTRICIAN  ", status: "same" });
});

test("numbers compare exactly, including zero and fractional differences", () => {
  const offer = { ...SAMPLE_OFFER, allowances_aed: 0 };
  const contract = { ...offer, monthly_salary_aed: 2000.001 };
  const result = compareExtractions(offer, contract);
  assert.equal(result.different_count, 1);
  assert.equal(result.rows.find(row => row.field === "allowances_aed").status, "same");
});

test("either null, or both null, is not found", () => {
  const result = compareExtractions({ ...SAMPLE_OFFER, job_title: null, employer_name: null }, { ...SAMPLE_CONTRACT, monthly_salary_aed: null, employer_name: null });
  for (const field of ["job_title", "monthly_salary_aed", "employer_name"]) {
    assert.equal(result.rows.find(row => row.field === field).status, "not found");
  }
  assert.equal(result.different_count, 0);
});
