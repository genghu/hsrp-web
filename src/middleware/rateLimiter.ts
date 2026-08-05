import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter for login endpoint
// Note: This is not distributed and resets on process restart. For production, use a Redis-based limiter.

const attempts = new Map<string, { count: number; firstSeen: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.ip || (req.headers['x-forwarded-for'] as string) || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = attempts.get(key);

    if (!entry) {
      attempts.set(key, { count: 1, firstSeen: now });
      return next();
    }

    if (now - entry.firstSeen > WINDOW_MS) {
      // reset window
      attempts.set(key, { count: 1, firstSeen: now });
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
