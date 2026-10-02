require("./register.cjs");
const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { POST } = require("../app/api/extract/route.ts");
const { SAMPLE_OFFER } = require("../lib/sampleExtractions.ts");
const { COMPARISON_FIELDS } = require("../lib/extraction.ts");
const originalFetch = global.fetch;
const originalKey = process.env.OPENAI_API_KEY;
afterEach(() => {
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
});
const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN2kAAAAASUVORK5CYII=";
const extraction = { ...SAMPLE_OFFER, source_quotes: Object.fromEntries(COMPARISON_FIELDS.map(field => [field, ""])) };
function request(body = { imageBase64: png, documentType: "offer" }) {
  return new Request("http://localhost/api/extract", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
}
function response(data) { return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } }); }
function completed(value = extraction) {
  return { status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(value) }] }] };
}

test("invalid JSON, document type, image and oversized request do not call upstream", async () => {
  global.fetch = () => { throw new Error("Unexpected upstream call"); };
  assert.equal((await POST(new Request("http://localhost/api/extract", { method: "POST", body: "{" }))).status, 400);
  for (const body of [null, { imageBase64: png, documentType: ["offer"] }, { imageBase64: "not-base64", documentType: "offer" }, { imageBase64: Buffer.from("not an image").toString("base64"), documentType: "contract" }]) {
    assert.equal((await POST(request(body))).status, 400);
  }
  const big = new Request("http://localhost/api/extract", { method: "POST", body: "{}", headers: { "content-length": "5000000" } });
  assert.equal((await POST(big)).status, 413);
});

test("missing server key gives a safe fallback and makes no upstream call", async () => {
  delete process.env.OPENAI_API_KEY;
  global.fetch = () => { throw new Error("Unexpected upstream call"); };
  const result = await POST(request());
  assert.equal(result.status, 503);
  assert.match((await result.json()).error, /Use sample documents/);
});

test("Responses request has the specified model, image and strict schema; returns parsed JSON", async () => {
  process.env.OPENAI_API_KEY = "test-only-placeholder";
  global.fetch = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(options.headers.Authorization, "Bearer test-only-placeholder");
    const body = JSON.parse(options.body);
    assert.equal(body.model, "gpt-6-astra");
    assert.equal(body.store, false);
    assert.equal(body.text.format.type, "json_schema");
    assert.equal(body.text.format.strict, true);
    assert.equal(body.text.format.schema.additionalProperties, false);
    assert.deepEqual(body.text.format.schema.required, ["document_type", ...COMPARISON_FIELDS, "source_quotes"]);
    assert.equal(body.input[0].content[1].type, "input_image");
    assert.equal(body.input[0].content[1].image_url, `data:image/png;base64,${png}`);
    return response(completed());
  };
  const result = await POST(request());
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.deepEqual(await result.json(), extraction);
});

test("data URLs are accepted, while type mismatches are rejected", async () => {
  process.env.OPENAI_API_KEY = "test-only-placeholder";
  global.fetch = async () => response(completed());
  assert.equal((await POST(request({ imageBase64: `data:image/png;base64,${png}`, documentType: "contract" }))).status, 200);
  assert.equal((await POST(request({ imageBase64: `data:image/jpeg;base64,${png}`, documentType: "contract" }))).status, 400);
});

test("upstream failures, refusal, incomplete or malformed outputs cannot become results", async () => {
  process.env.OPENAI_API_KEY = "test-only-placeholder";
  const cases = [
    [() => new Response("private provider message", { status: 401 }), 502],
    [() => new Response("rate limit", { status: 429 }), 429],
    [() => response({ status: "incomplete", output: [] }), 502],
    [() => response({ status: "completed", output: [{ type: "message", content: [{ type: "refusal" }] }] }), 422],
    [() => response(completed({ ...extraction, monthly_salary_aed: "2000" })), 502],
    [() => response(completed({ ...extraction, extra: "invented" })), 502],
    [() => { throw new DOMException("timed out", "TimeoutError"); }, 504],
  ];
  for (const [mock, expected] of cases) {
    global.fetch = async () => mock();
    const result = await POST(request());
    assert.equal(result.status, expected);
    assert.doesNotMatch(JSON.stringify(await result.json()), /test-only-placeholder|private provider message/);
  }
});
