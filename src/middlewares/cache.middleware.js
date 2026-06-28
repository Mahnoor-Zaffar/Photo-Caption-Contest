import { getCache, setCache } from "../config/cache.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const cacheResponse = (keyBuilder) =>
  asyncHandler(async (req, res, next) => {
    const key =
      typeof keyBuilder === "function" ? keyBuilder(req) : keyBuilder;

    const cached = getCache(key);
    if (cached) {
      return res.status(200).json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(key, body);
      }
      return originalJson(body);
    };

    next();
  });
