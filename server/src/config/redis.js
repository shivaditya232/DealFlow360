import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 100, 3000),
  enableOfflineQueue: true,
  lazyConnect: false,
  maxRetriesPerRequest: 3,
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

redis.on("close", () => {
  console.warn("⚠️  Redis connection closed");
});

export default redis;
