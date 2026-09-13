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
    this._persistTimer = null;
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

  schedulePersist() {
    if (this._persistTimer) clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(() => {
      this.persistToDisk();
    }, 3000);
  }

  persistToDisk() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      const dataToSave = {};
      const now = Date.now();
      this.memoryCache.forEach((val, key) => {
        if (val && val.expiresAt > now) {
          dataToSave[key] = val;
        }
      });
      // Asynchronous non-blocking write, minified without formatting to preserve memory and I/O
      fs.promises.writeFile(this.cacheFile, JSON.stringify(dataToSave), "utf-8").catch((err) => {
        console.warn("[CacheManager] Gagal menyimpan cache ke disk:", err.message);
      });
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
    this.schedulePersist();
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    const deleted = this.memoryCache.delete(key);
    if (deleted) this.schedulePersist();
    return deleted;
  }

  deletePattern(prefix) {
    let count = 0;
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    if (count > 0) this.schedulePersist();
    return count;
  }

  clearMapCache() {
    return this.deletePattern("map:");
  }

  clear() {
    this.memoryCache.clear();
    this.schedulePersist();
  }
}

const cacheManager = new CacheManager();
module.exports = { cacheManager };
