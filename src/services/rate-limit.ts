export type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};

type ClientRecord = {
  count: number;
  resetAt: number;
};

export class RateLimiter {
  private records = new Map<string, ClientRecord>();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  check(ip: string, nowMs: number = Date.now()): { allowed: boolean; remaining: number; retryAfter?: number } {
    const existing = this.records.get(ip);
    if (!existing || nowMs > existing.resetAt) {
      this.records.set(ip, {
        count: 1,
        resetAt: nowMs + this.config.windowMs,
      });
      return { allowed: true, remaining: this.config.maxRequests - 1 };
    }

    if (existing.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((existing.resetAt - nowMs) / 1000);
      return { allowed: false, remaining: 0, retryAfter: Math.max(1, retryAfter) };
    }

    existing.count++;
    return { allowed: true, remaining: this.config.maxRequests - existing.count };
  }

  reset(): void {
    this.records.clear();
  }
}

export const rateLimiter = new RateLimiter();

export function extractClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}
