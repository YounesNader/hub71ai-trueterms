require("./register.cjs");
const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { POST } = require("../app/api/speak/route.ts");

const originalFetch = global.fetch;
const originalKey = process.env.OPENAI_API_KEY;
afterEach(() => {
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
});
function request(body = { text: "This is different from your offer.", language: "English" }) {
  return new Request("http://localhost/api/speak", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

test("speech rejects malformed, blank, oversized or unsupported input before calling OpenAI", async () => {
  global.fetch = () => { throw new Error("Unexpected upstream request"); };
  assert.equal((await POST(new Request("http://localhost/api/speak", { method: "POST", body: "{" }))).status, 400);
  for (const body of [null, [], { text: " ", language: "Urdu" }, { text: 1, language: "Hindi" }, { text: "Summary", language: ["English"] }, { text: "Summary", language: "unapproved-language" }]) {
    assert.equal((await POST(request(body))).status, 400);
  }
  assert.equal((await POST(request({ text: "x".repeat(4097), language: "English" }))).status, 413);
  const oversized = new Request("http://localhost/api/speak", { method: "POST", body: "{}", headers: { "content-length": "40000" } });
  assert.equal((await POST(oversized)).status, 413);
});

test("missing server key returns a safe error without calling OpenAI", async () => {
  delete process.env.OPENAI_API_KEY;
  global.fetch = () => { throw new Error("Unexpected upstream request"); };
  const result = await POST(request());
  assert.equal(result.status, 503);
  assert.match((await result.json()).error, /still read or print/);
});

test("speech sends unchanged text and fixed language instructions and returns uncached audio", async () => {
  process.env.OPENAI_API_KEY = "test-only-placeholder";
  const text = "آپ کی پیشکش اور معاہدے میں 2 فرق ملے۔";
  const audioBytes = Uint8Array.from([73, 68, 51, 1, 2, 3]);
  global.fetch = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/audio/speech");
    assert.equal(options.headers.Authorization, "Bearer test-only-placeholder");
    assert.equal(options.cache, "no-store");
    const body = JSON.parse(options.body);
    assert.equal(body.model, "gpt-4o-mini-tts");
    assert.equal(body.input, text);
    assert.equal(body.response_format, "mp3");
    assert.match(body.instructions, /exactly in Urdu/);
    assert.match(body.instructions, /Do not translate/);
    return new Response(audioBytes, { headers: { "Content-Type": "audio/mpeg" } });
  };
  const result = await POST(request({ text, language: "ur" }));
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("content-type"), "audio/mpeg");
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.deepEqual(new Uint8Array(await result.arrayBuffer()), audioBytes);
});

test("speech hides provider errors and handles rate limits and timeout", async () => {
  process.env.OPENAI_API_KEY = "test-only-placeholder";
  for (const [mock, expected] of [
    [() => new Response("provider secret", { status: 401 }), 502],
    [() => new Response("provider secret", { status: 429 }), 429],
    [() => { throw new DOMException("provider secret", "TimeoutError"); }, 504],
  ]) {
    global.fetch = async () => mock();
    const result = await POST(request());
    assert.equal(result.status, expected);
    assert.doesNotMatch(JSON.stringify(await result.json()), /provider secret|test-only-placeholder/);
  }
});
