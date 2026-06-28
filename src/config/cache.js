import NodeCache from "node-cache";

const ttl = parseInt(process.env.CACHE_TTL_SECONDS || "60", 10);

const cache = new NodeCache({
  stdTTL: ttl,
  checkperiod: ttl * 0.2,
  useClones: false,
});

const stats = {
  hits: 0,
  misses: 0,
};

export const getCache = (key) => {
  const value = cache.get(key);
  if (value !== undefined) {
    stats.hits += 1;
  } else {
    stats.misses += 1;
  }
  return value;
};

export const setCache = (key, value) => cache.set(key, value);

export const deleteCache = (key) => cache.del(key);

export const getCacheStats = () => {
  const total = stats.hits + stats.misses;
  const hitRatio = total === 0 ? 0 : stats.hits / total;

  return {
    hits: stats.hits,
    misses: stats.misses,
    total,
    hitRatio: Math.round(hitRatio * 1000) / 1000,
    hitRatioPercent: Math.round(hitRatio * 1000) / 10,
    keys: cache.keys().length,
    ttlSeconds: ttl,
  };
};

export const resetCacheStats = () => {
  stats.hits = 0;
  stats.misses = 0;
};

export const invalidateImageCaches = (imageId) => {
  deleteCache("images:all");
  if (imageId) {
    cache.keys()
      .filter((key) => key.startsWith(`images:${imageId}`))
      .forEach((key) => deleteCache(key));
  }
};

export default cache;
