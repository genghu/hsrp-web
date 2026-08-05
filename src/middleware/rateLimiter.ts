import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter for login endpoint
// Note: This is not distributed and resets on process restart. For production, use a Redis-based limiter.

const attempts = new Map<string, { count: number; firstSeen: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;
// Hard cap on the number of distinct keys (IPs) tracked at once, to prevent
// unbounded memory growth from a flood of distinct/spoofed IPs.
const MAX_ENTRIES = 5000;

function setEntry(key: string, entry: { count: number; firstSeen: number }) {
  // Enforce the hard size cap using the same "evict oldest (first inserted)
  // key" pattern as InMemoryCache.set() in src/utils/cache.ts, since Map
  // iteration order is insertion order.
  if (!attempts.has(key) && attempts.size >= MAX_ENTRIES) {
    const firstKey = attempts.keys().next().value;
    if (firstKey !== undefined) {
      attempts.delete(firstKey);
    }
  }
  attempts.set(key, entry);
}

// Periodic sweep to drop stale entries whose window has already expired, so
// memory doesn't grow simply from a steady trickle of distinct one-off IPs
// that never hit the MAX_ENTRIES cap. `.unref()` ensures this timer never
// keeps the Node/Jest process alive.
const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now - entry.firstSeen > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}, WINDOW_MS);
sweepTimer.unref();

// Test-only helper: expose current map size without reaching into module
// internals unsafely.
export function getRateLimiterMapSize(): number {
  return attempts.size;
}

// Test-only helper: reset all tracked attempts between test cases.
export function clearRateLimiterState(): void {
  attempts.clear();
}

export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.ip || (req.headers['x-forwarded-for'] as string) || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = attempts.get(key);

    if (!entry) {
      setEntry(key, { count: 1, firstSeen: now });
      return next();
    }

    if (now - entry.firstSeen > WINDOW_MS) {
      // reset window
      setEntry(key, { count: 1, firstSeen: now });
      return next();
    }

    if (entry.count >= MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((WINDOW_MS - (now - entry.firstSeen)) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ success: false, error: `Too many login attempts. Try again in ${retryAfter} seconds.` });
    }

    entry.count += 1;
    attempts.set(key, entry);
    return next();
  } catch (err) {
    // In case of unexpected errors, allow request to proceed
    return next();
  }
}
