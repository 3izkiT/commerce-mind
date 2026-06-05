import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

export function isRateLimitConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export function getRateLimiter(): Ratelimit | null {
  if (!isRateLimitConfigured()) {
    return null;
  }

  if (!ratelimit) {
    const redis = Redis.fromEnv();
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1, "24 h"),
      analytics: true,
      prefix: "commercemind:generate",
    });
  }

  return ratelimit;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
