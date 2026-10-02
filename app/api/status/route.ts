export const dynamic = "force-dynamic";

// Return a capability flag only. Never return the key or any part of it.
export async function GET() {
  return Response.json({ openaiAvailable: Boolean(process.env.OPENAI_API_KEY?.trim()) }, {
    headers: { "Cache-Control": "no-store" },
  });
}
