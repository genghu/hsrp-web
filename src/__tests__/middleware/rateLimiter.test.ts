import { Request, Response, NextFunction } from 'express';
import {
  loginRateLimiter,
  getRateLimiterMapSize,
  clearRateLimiterState
} from '../../middleware/rateLimiter';

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
  status(code: number): MockResponse;
  setHeader(name: string, value: string): void;
  json(body: any): MockResponse;
}

function mockReqRes(ip: string) {
  const req = {
    ip,
    headers: {},
    connection: { remoteAddress: ip }
  } as unknown as Request;

  const res: MockResponse = {
    statusCode: 200,
    headers: {},
    status(code: number): MockResponse {
      res.statusCode = code;
      return res;
    },
    setHeader(name: string, value: string): void {
      res.headers[name] = value;
    },
    json(body: any): MockResponse {
      res.body = body;
      return res;
    }
  };

  const next = jest.fn() as unknown as NextFunction;

  return { req, res: res as unknown as Response & MockResponse, next };
}

describe('loginRateLimiter', () => {
  beforeEach(() => {
    clearRateLimiterState();
  });

  it('no longer counts an entry older than WINDOW_MS toward the limit', () => {
    const ip = '10.0.0.1';
    const nowSpy = jest.spyOn(Date, 'now');

    let currentTime = 1_000_000;
    nowSpy.mockImplementation(() => currentTime);

    // Exhaust the limit within the window.
    for (let i = 0; i < 5; i++) {
      const { req, res, next } = mockReqRes(ip);
      loginRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    }

    // 6th request within window should be blocked.
    const blocked = mockReqRes(ip);
    loginRateLimiter(blocked.req, blocked.res, blocked.next);
    expect(blocked.next).not.toHaveBeenCalled();
    expect(blocked.res.statusCode).toBe(429);

    // Advance time past the window (WINDOW_MS = 60_000).
    currentTime += 60 * 1000 + 1;

    const afterWindow = mockReqRes(ip);
    loginRateLimiter(afterWindow.req, afterWindow.res, afterWindow.next);
    expect(afterWindow.next).toHaveBeenCalled();
    expect(afterWindow.res.statusCode).toBe(200);

    nowSpy.mockRestore();
  });

  it('caps the internal attempts map size when many distinct IPs are seen', () => {
    const TOTAL_IPS = 2000;

    for (let i = 0; i < TOTAL_IPS; i++) {
      const { req, res, next } = mockReqRes(`192.168.${Math.floor(i / 256)}.${i % 256}`);
      loginRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    }

    const size = getRateLimiterMapSize();
    expect(size).toBeLessThanOrEqual(5000);
    expect(size).toBeGreaterThan(0);
  });

  it('regression: allows 5 requests from the same key then returns 429 with Retry-After on the 6th', () => {
    const ip = '10.0.0.2';

    for (let i = 0; i < 5; i++) {
      const { req, res, next } = mockReqRes(ip);
      loginRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    }

    const { req, res, next } = mockReqRes(ip);
    loginRateLimiter(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(429);
    expect(res.headers['Retry-After']).toBeDefined();
  });
});
