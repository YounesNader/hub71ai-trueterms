// Checked only when a worker checks real uploads. Examples never call this route.
export async function hasLiveReading(signal: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch("/api/status", { cache: "no-store", signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]) });
    if (!response.ok) return false;
    const result: unknown = await response.json();
    return Boolean(result && typeof result === "object" && "openaiAvailable" in result && result.openaiAvailable === true);
  } catch {
    return false;
  }
}
