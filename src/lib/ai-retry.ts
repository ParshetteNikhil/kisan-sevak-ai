/** Server-only: if the AI says "too many requests", wait a few seconds and try once more. */
export const isAiQuotaError = (e: unknown) =>
  [429, 402].includes(Number((e as { status?: unknown })?.status)) || /RESOURCE_EXHAUSTED|429|quota/i.test(String((e as Error)?.message));

export async function withAiRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!isAiQuotaError(e)) throw e;
    await new Promise((r) => setTimeout(r, 4000));
    return fn();
  }
}
