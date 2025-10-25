import { createClient, RedisClientType } from 'redis';

/**
 * Redis cache utility for performance optimization
 * Provides methods for caching user data, QR states, and API responses
 */

let redisClient: RedisClientType | null = null;
let isRedisAvailable = false;

export async function initializeCache() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('✓ Connected to Redis');
      isRedisAvailable = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.warn('⚠️  Redis not available, falling back to in-memory cache');
    isRedisAvailable = false;
    return null;
  }
}

export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient !== null;
}

/**
 * In-memory fallback cache using LRU-like Map
 */
class InMemoryCache {
  private cache: Map<string, { value: any; expiry: number }>;
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(key: string, value: any, ttlSeconds: number): void {
    // Implement simple LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const inMemoryCache = new InMemoryCache();

/**
 * Cache utility functions with automatic fallback
 */

export async function cacheSet(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
  try {
    if (isRedisConnected() && redisClient) {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } else {
      inMemoryCache.set(key, value, ttlSeconds);
    }
  } catch (error) {
    console.error('Cache set error:', error);
    // Fallback to in-memory
    inMemoryCache.set(key, value, ttlSeconds);
  }
}

export async function cacheGet(key: string): Promise<any | null> {
  try {
    if (isRedisConnected() && redisClient) {
      const data = await redisClient.get(key);
      return data && data !== null ? JSON.parse(data) : null;
    } else {
      return inMemoryCache.get(key);
    }
  } catch (error) {
    console.error('Cache get error:', error);
    return inMemoryCache.get(key);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    if (isRedisConnected() && redisClient) {
      await redisClient.del(key);
    } else {
      inMemoryCache.del(key);
    }
  } catch (error) {
    console.error('Cache delete error:', error);
    inMemoryCache.del(key);
  }
}

export async function cacheFlush(): Promise<void> {
  try {
    if (isRedisConnected() && redisClient) {
      await redisClient.flushAll();
    } else {
      inMemoryCache.clear();
    }
  } catch (error) {
    console.error('Cache flush error:', error);
    inMemoryCache.clear();
  }
}

/**
 * QR Code state management
 */

export interface QRCodeState {
  ticket: string;
  status: 'pending' | 'scanned' | 'expired';
  provider: 'wechat' | 'qq';
  createdAt: number;
  userData?: any;
}

export async function setQRState(ticket: string, state: QRCodeState, ttlSeconds: number = 300): Promise<void> {
  await cacheSet(`qr:${ticket}`, state, ttlSeconds);
}

export async function getQRState(ticket: string): Promise<QRCodeState | null> {
  return await cacheGet(`qr:${ticket}`);
}

export async function deleteQRState(ticket: string): Promise<void> {
  await cacheDel(`qr:${ticket}`);
}

/**
 * User cache management
 */

export async function cacheUser(userId: string, userData: any, ttlSeconds: number = 300): Promise<void> {
  await cacheSet(`user:${userId}`, userData, ttlSeconds);
}

export async function getCachedUser(userId: string): Promise<any | null> {
  return await cacheGet(`user:${userId}`);
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await cacheDel(`user:${userId}`);
}

/**
 * API response caching
 */

export async function cacheAPIResponse(
  endpoint: string,
  queryParams: any,
  response: any,
  ttlSeconds: number = 60
): Promise<void> {
  const key = `api:${endpoint}:${JSON.stringify(queryParams)}`;
  await cacheSet(key, response, ttlSeconds);
}

export async function getCachedAPIResponse(endpoint: string, queryParams: any): Promise<any | null> {
  const key = `api:${endpoint}:${JSON.stringify(queryParams)}`;
  return await cacheGet(key);
}

export async function invalidateAPICache(pattern: string): Promise<void> {
  // For Redis, we'd use SCAN + DEL
  // For in-memory, clear everything matching pattern
  if (isRedisConnected() && redisClient) {
    // Simple implementation - in production use proper pattern matching
    await cacheFlush();
  } else {
    // In-memory doesn't support pattern deletion easily
    inMemoryCache.clear();
  }
}
