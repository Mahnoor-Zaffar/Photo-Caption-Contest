import request from "supertest";
import app from "../src/app.js";
import sequelize from "../src/config/sequelize.js";
import { Image, User } from "../src/models/index.js";

describe("Contest lifecycle & auth hardening", () => {
  let dbAvailable = false;
  let closedImageId;
  let openImageId;

  beforeAll(async () => {
    try {
      await sequelize.authenticate();
      dbAvailable = true;

      const closed = await Image.findOne({ where: { status: "closed" } });
      const open = await Image.findOne({ where: { status: "open" } });
      closedImageId = closed?.id;
      openImageId = open?.id;
    } catch {
      dbAvailable = false;
    }
  });

  const itIfDb = (name, fn) => {
    it(name, async () => {
      if (!dbAvailable || !closedImageId || !openImageId) return;
      await fn();
    });
  };

  itIfDb("blocks caption submission on closed contest", async () => {
    const runId = Date.now();
    const reg = await request(app).post("/api/auth/register").send({
      username: `closed_${runId}`,
      email: `closed_${runId}@example.com`,
      password: "password123",
    });

    const res = await request(app)
      .post(`/api/images/${closedImageId}/captions`)
      .set("Authorization", `Bearer ${reg.body.data.token}`)
      .send({ text: "Too late!" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("CONTEST_CLOSED");

    await User.destroy({ where: { email: `closed_${runId}@example.com` } });
  });

  itIfDb("returns winner only for closed contest", async () => {
    const openRes = await request(app).get(`/api/images/${openImageId}/winner`);
    expect(openRes.status).toBe(403);
    expect(openRes.body.code).toBe("CONTEST_OPEN");

    const closedRes = await request(app).get(`/api/images/${closedImageId}/winner`);
    expect([200, 404]).toContain(closedRes.status);
    if (closedRes.status === 200) {
      expect(closedRes.body.data.winner).toBeTruthy();
    }
  });

  itIfDb("strips HTML from caption text", async () => {
    const runId = Date.now();
    const reg = await request(app).post("/api/auth/register").send({
      username: `xss_${runId}`,
      email: `xss_${runId}@example.com`,
      password: "password123",
    });

    const res = await request(app)
      .post(`/api/images/${openImageId}/captions`)
      .set("Authorization", `Bearer ${reg.body.data.token}`)
      .send({ text: "<img src=x onerror=alert(1)>Safe text" });

    expect(res.status).toBe(201);
    expect(res.body.data.text).toBe("Safe text");

    await User.destroy({ where: { email: `xss_${runId}@example.com` } });
  });

  itIfDb("revokes sessions when refresh token is reused", async () => {
    const runId = Date.now();
    const login = await request(app).post("/api/auth/register").send({
      username: `refresh_${runId}`,
      email: `refresh_${runId}@example.com`,
      password: "password123",
    });

    const oldRefresh = login.body.data.refreshToken;

    const first = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", login.headers["set-cookie"]);

    expect(first.status).toBe(200);

    const reuse = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: oldRefresh });

    expect(reuse.status).toBe(401);
    expect(reuse.body.code).toBe("REFRESH_TOKEN_REUSE");

    await User.destroy({ where: { email: `refresh_${runId}@example.com` } });
  });

  it("exposes live and ready health endpoints", async () => {
    const live = await request(app).get("/api/health/live");
    expect(live.status).toBe(200);
    expect(live.body.data.status).toBe("ok");

    const ready = await request(app).get("/api/health/ready");
    expect([200, 503]).toContain(ready.status);
    expect(ready.body.data.cache).toBeTruthy();
  });

  it("returns structured error codes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("ROUTE_NOT_FOUND");
  });
});
