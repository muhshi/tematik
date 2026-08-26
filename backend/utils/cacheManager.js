const fs = require("fs");
const path = require("path");

/**
 * CacheManager: Multi-layer In-Memory Cache dengan disk backup
 * Menghindari rate limit BPS dan mempercepat respons frontend.
 */
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheDir = path.join(__dirname, "..", "data");
    this.cacheFile = path.join(this.cacheDir, "bps-cache-store.json");
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const raw = fs.readFileSync(this.cacheFile, "utf-8");
        const parsed = JSON.parse(raw);
        const now = Date.now();
        for (const [key, item] of Object.entries(parsed)) {
          if (item && item.expiresAt > now) {
            this.memoryCache.set(key, item);
          }
        }
      }
    } catch (err) {
      console.warn("[CacheManager] Gagal memuat cache dari disk:", err.message);
    }
  }

  persistToDisk() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      const dataToSave = {};
      this.memoryCache.forEach((val, key) => {
        dataToSave[key] = val;
      });
      fs.writeFileSync(this.cacheFile, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (err) {
      console.warn("[CacheManager] Gagal menyimpan cache ke disk:", err.message);
    }
  }

  /**
   * Mengambil nilai cache berdasarkan key jika belum kedaluwarsa
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  /**
   * Menyimpan data ke cache dengan TTL (Time To Live)
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlMs - Default 24 jam (86.400.000 ms)
   */
  set(key, value, ttlMs = 86400000) {
    const item = {
      value,
      expiresAt: Date.now() + ttlMs,
      savedAt: new Date().toISOString(),
    };
    this.memoryCache.set(key, item);
    this.persistToDisk();
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    const deleted = this.memoryCache.delete(key);
    if (deleted) this.persistToDisk();
    return deleted;
  }

  clear() {
    this.memoryCache.clear();
    this.persistToDisk();
  }
}

const cacheManager = new CacheManager();
module.exports = { cacheManager };
