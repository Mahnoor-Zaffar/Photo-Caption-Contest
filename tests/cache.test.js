import request from "supertest";
import app from "../src/app.js";
import { resetCacheStats } from "../src/config/cache.js";

describe("Cache metrics", () => {
  beforeEach(() => {
    resetCacheStats();
  });

  it("reports hit ratio on /api/health after repeated image requests", async () => {
    const first = await request(app).get("/api/images");
    expect(first.status).toBe(200);

    for (let i = 0; i < 10; i += 1) {
      await request(app).get("/api/images");
    }

    const health = await request(app).get("/api/health");
    expect(health.status).toBe(200);
    expect(health.body.data.cache.hits).toBeGreaterThanOrEqual(10);
    expect(health.body.data.cache.misses).toBeGreaterThanOrEqual(1);
    expect(health.body.data.cache.hitRatioPercent).toBeGreaterThan(80);
  });
});
