const { Redis } = require("@upstash/redis");
require("dotenv").config();

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;

if (url && token && !url.includes("your-redis-url.upstash.io")) {
  try {
    redis = new Redis({ url, token });
    console.log("⚡ Upstash Redis client initialized.");
  } catch (err) {
    console.error("Failed to initialize Upstash Redis client:", err.message);
  }
} else {
  console.warn("⚠️ Upstash Redis credentials unconfigured in .env - running with local in-memory fallback.");
}

module.exports = { redis };
