import NodeCache from "node-cache";

const ttl = parseInt(process.env.CACHE_TTL_SECONDS || "60", 10);

const cache = new NodeCache({
  stdTTL: ttl,
  checkperiod: ttl * 0.2,
  useClones: false,
});

export const getCache = (key) => cache.get(key);

export const setCache = (key, value) => cache.set(key, value);

export const deleteCache = (key) => cache.del(key);

export const invalidateImageCaches = (imageId) => {
  deleteCache("images:all");
  if (imageId) {
    cache.keys()
      .filter((key) => key.startsWith(`images:${imageId}`))
      .forEach((key) => deleteCache(key));
  }
};

export default cache;
