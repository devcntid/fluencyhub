import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = url && token ? new Redis({ url, token }) : null;

export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "fh",
    })
  : {
      async limit() {
        return { success: true, limit: 10, remaining: 10, reset: Date.now() + 60_000 };
      },
    };

export const paymentRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      prefix: "fh-pay",
    })
  : ratelimit;

export const CACHE_KEYS = {
  publishedCourses: "cache:published-courses",
  landing: "cache:landing",
};

export async function cacheInvalidate(key: string): Promise<void> {
  if (!redis) return;
  await redis.del(key);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  return (await redis.get<T>(key)) ?? null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  await redis.set(key, value, { ex: ttlSeconds });
}

export async function isWebhookDuplicate(key: string): Promise<boolean> {
  if (!redis) return false;
  const existing = await redis.get(key);
  if (existing) return true;
  await redis.set(key, "1", { ex: 60 * 60 * 24 });
  return false;
}
