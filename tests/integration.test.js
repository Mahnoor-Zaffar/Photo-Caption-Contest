import request from "supertest";
import app from "../src/app.js";
import sequelize from "../src/config/sequelize.js";
import { Image, User } from "../src/models/index.js";

const runId = Date.now();
const password = "password123";

const userA = {
  username: `testuser_a_${runId}`,
  email: `test_a_${runId}@example.com`,
  password,
};

const userB = {
  username: `testuser_b_${runId}`,
  email: `test_b_${runId}@example.com`,
  password,
};

describe("Integration (requires PostgreSQL)", () => {
  let dbAvailable = false;
  let imageId;
  let tokenA;
  let tokenB;
  let captionId;

  beforeAll(async () => {
    try {
      await sequelize.authenticate();
      dbAvailable = true;

      const image = await Image.findOne({ order: [["createdAt", "ASC"]] });
      if (!image) {
        throw new Error("No seed images found — run npm run db:seed");
      }
      imageId = image.id;
    } catch {
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (!dbAvailable) return;

    await User.destroy({
      where: {
        email: [
          userA.email,
          userB.email,
          `test_c_${runId}@example.com`,
        ],
      },
    });
  });

  const itIfDb = (name, fn) => {
    it(name, async () => {
      if (!dbAvailable) {
        console.warn("Skipping integration test — PostgreSQL unavailable");
        return;
      }
      await fn();
    });
  };

  itIfDb("registers two users and returns tokens", async () => {
    const resA = await request(app).post("/api/auth/register").send(userA);
    expect(resA.status).toBe(201);
    expect(resA.body.data.token).toBeTruthy();
    tokenA = resA.body.data.token;

    const resB = await request(app).post("/api/auth/register").send(userB);
    expect(resB.status).toBe(201);
    tokenB = resB.body.data.token;
  });

  itIfDb("submits captions and records votes", async () => {
    const captionRes = await request(app)
      .post(`/api/images/${imageId}/captions`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ text: `Integration caption ${runId}` });

    expect(captionRes.status).toBe(201);
    captionId = captionRes.body.data.id;

    const voteRes = await request(app)
      .post(`/api/captions/${captionId}/votes`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(voteRes.status).toBe(201);
  });

  itIfDb("sorts captions by votes on GET /api/images/:id", async () => {
    const res = await request(app).get(`/api/images/${imageId}?sort=votes&limit=50`);

    expect(res.status).toBe(200);
    expect(res.body.data.sort).toBe("votes");

    const caption = res.body.data.captions.find((c) => c.id === captionId);
    expect(caption).toBeTruthy();
    expect(caption.voteCount).toBeGreaterThanOrEqual(1);
  });

  itIfDb("refreshes access token via cookie", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: userA.email, password });

    const cookies = loginRes.headers["set-cookie"];
    expect(cookies).toBeTruthy();

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookies);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.token).toBeTruthy();
  });

  itIfDb("returns 409 when voting twice for the same caption", async () => {
    const res = await request(app)
      .post(`/api/captions/${captionId}/votes`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(409);
  });

  itIfDb("moves vote when voting for a different caption on the same image", async () => {
    const userC = {
      username: `testuser_c_${runId}`,
      email: `test_c_${runId}@example.com`,
      password,
    };

    const reg = await request(app).post("/api/auth/register").send(userC);
    const tokenC = reg.body.data.token;

    const captionRes = await request(app)
      .post(`/api/images/${imageId}/captions`)
      .set("Authorization", `Bearer ${tokenC}`)
      .send({ text: `Second caption ${runId}` });

    expect(captionRes.status).toBe(201);
    const secondCaptionId = captionRes.body.data.id;

    const voteRes = await request(app)
      .post(`/api/captions/${secondCaptionId}/votes`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(voteRes.status).toBe(200);
    expect(voteRes.body.data.moved).toBe(true);

    const imageRes = await request(app)
      .get(`/api/images/${imageId}?sort=votes&limit=50`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(imageRes.body.data.myVoteCaptionId).toBe(secondCaptionId);
  });
});
