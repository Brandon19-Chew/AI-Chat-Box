import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "zrytium_cache_";
const CACHE_EXPIRY_PREFIX = "zrytium_expiry_";

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 1 hour)
}

/**
 * Simple but effective caching layer for API responses
 * Reduces network requests and improves app responsiveness
 */
export class CacheManager {
  private static readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Get cached data if it exists and hasn't expired
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;

      const [cachedData, expiryTime] = await Promise.all([
        AsyncStorage.getItem(cacheKey),
        AsyncStorage.getItem(expiryKey),
      ]);

      if (!cachedData || !expiryTime) {
        return null;
      }

      // Check if cache has expired
      if (Date.now() > parseInt(expiryTime, 10)) {
        await this.remove(key);
        return null;
      }

      return JSON.parse(cachedData) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cache data with optional TTL
   */
  static async set<T>(
    key: string,
    data: T,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;
      const ttl = options?.ttl ?? this.DEFAULT_TTL;
      const expiryTime = Date.now() + ttl;

      await Promise.all([
        AsyncStorage.setItem(cacheKey, JSON.stringify(data)),
        AsyncStorage.setItem(expiryKey, expiryTime.toString()),
      ]);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Remove cached data
   */
  static async remove(key: string): Promise<void> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;
      await Promise.all([
        AsyncStorage.removeItem(cacheKey),
        AsyncStorage.removeItem(expiryKey),
      ]);
    } catch (error) {
      console.error(`Cache remove error for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  static async clear(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(
        (key) =>
          key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_PREFIX)
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }
}
