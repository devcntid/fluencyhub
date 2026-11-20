import { neon, neonConfig } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const RETRY_DELAYS_MS = [300, 800, 1500];

async function resilientNeonFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await fetch(input, {
        ...init,
        cache: "no-store",
        signal: init?.signal ?? AbortSignal.timeout(15_000),
      });

      // Retry transient gateway / Neon cold-start HTTP errors
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < RETRY_DELAYS_MS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
        continue;
      }

      return res;
    } catch (err) {
      const digest = (err as { digest?: string } | null)?.digest;
      if (digest === "DYNAMIC_SERVER_USAGE") {
        throw err;
      }
      lastError = err;
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

neonConfig.fetchFunction = resilientNeonFetch;

export const sql = neon(process.env.DATABASE_URL);

export function asNum(value: unknown): number {
  return Number(value);
}

export function asDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value));
}

export function asDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  return asDate(value);
}
