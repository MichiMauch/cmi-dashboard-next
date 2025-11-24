/**
 * Development-only cache to prevent API rate limiting
 * Only active in NODE_ENV=development
 */

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60000; // 60 seconds in development

/**
 * Get cached data or fetch new data
 * Cache is only active in development mode
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Only use cache in development
  if (process.env.NODE_ENV === 'development') {
    const cached = cache.get(key);
    const now = Date.now();

    // Return cached data if still valid
    if (cached && now - cached.timestamp < CACHE_TTL) {
      console.log(`[DevCache] Cache HIT for key: ${key}`);
      return cached.data as T;
    }

    console.log(`[DevCache] Cache MISS for key: ${key}, fetching...`);
  }

  // Fetch new data
  const data = await fetchFn();

  // Store in cache (development only)
  if (process.env.NODE_ENV === 'development') {
    cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  return data;
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  cache.clear();
  console.log('[DevCache] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
