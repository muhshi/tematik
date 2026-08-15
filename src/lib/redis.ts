// {*Fungsi: Utilitas Client Upstash Redis (Serverless Caching) dengan Fallback Aman*}

import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// Inisialisasi client Redis hanya jika URL dan Token valid
export const redis =
  url && token && !url.includes("YOUR-UPSTASH")
    ? new Redis({ url, token })
    : null;

// In-Memory RAM Cache (Instant 0ms fallback)
const inMemoryCache = new Map<string, { value: any; expiry: number }>();

/**
 * Mengambil data dari Redis / RAM Cache. Kembalikan null jika cache miss / timeout.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  // 1. Cek In-Memory RAM Cache dulu (Super cepat 0ms)
  const memData = inMemoryCache.get(key);
  if (memData && memData.expiry > Date.now()) {
    return memData.value as T;
  }

  if (!redis) return null;

  try {
    // 2. Cek Upstash Redis dengan Timeout Max 1.5 Detik
    const redisPromise = redis.get<T>(key);
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 1500)
    );

    const data = await Promise.race([redisPromise, timeoutPromise]);
    if (data) {
      // Simpan ke RAM Cache lokal selama 10 menit
      inMemoryCache.set(key, { value: data, expiry: Date.now() + 600000 });
      return data;
    }
    return null;
  } catch (err) {
    console.warn(`[Redis Get Warning] Gagal membaca key ${key}:`, err);
    return null;
  }
}

/**
 * Menyimpan data ke Redis Cache dan RAM Cache dengan durasi TTL (Time To Live) dalam detik.
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 86400
): Promise<void> {
  // Simpan ke RAM Cache lokal
  inMemoryCache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });

  if (!redis) return;
  try {
    const redisSetPromise = redis.set(key, value, { ex: ttlSeconds });
    const timeoutPromise = new Promise<void>((resolve) =>
      setTimeout(() => resolve(), 1500)
    );
    await Promise.race([redisSetPromise, timeoutPromise]);
  } catch (err) {
    console.warn(`[Redis Set Warning] Gagal menyimpan key ${key}:`, err);
  }
}

/**
 * Menghapus cache berdasarkan key spesifik atau pattern wildcard (misal 'map:*')
 */
export async function deleteCache(pattern: string): Promise<void> {
  // Bersihkan RAM Cache
  if (pattern.includes("*")) {
    const prefix = pattern.replace("*", "");
    for (const k of inMemoryCache.keys()) {
      if (k.startsWith(prefix)) inMemoryCache.delete(k);
    }
  } else {
    inMemoryCache.delete(pattern);
  }

  if (!redis) return;
  try {
    if (pattern.includes("*")) {
      const keysPromise = redis.keys(pattern);
      const timeoutPromise = new Promise<string[]>((resolve) =>
        setTimeout(() => resolve([]), 1500)
      );
      const keys = await Promise.race([keysPromise, timeoutPromise]);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      await redis.del(pattern);
    }
  } catch (err) {
    console.warn(`[Redis Delete Warning] Gagal menghapus pattern ${pattern}:`, err);
  }
}
