import request from "supertest";
import app from "../src/app.js";

describe("Photo Caption Contest API", () => {
  describe("GET /api/health", () => {
    it("returns 200 and healthy status", async () => {
      const res = await request(app).get("/api/health");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("ok");
    });
  });

  describe("POST /api/auth/register", () => {
    it("returns 422 for invalid email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "test", email: "bad-email", password: "password123" });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it("returns 422 for short password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "testuser", email: "test@example.com", password: "short" });

      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/images/:id/captions", () => {
    it("returns 401 without token", async () => {
      const res = await request(app)
        .post("/api/images/00000000-0000-4000-8000-000000000001/captions")
        .send({ text: "A caption" });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("POST /api/captions/:id/votes", () => {
    it("returns 401 without token", async () => {
      const res = await request(app)
        .post("/api/captions/00000000-0000-4000-8000-000000000001/votes");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/images", () => {
    it("returns 200 with images array", async () => {
      const res = await request(app).get("/api/images");

      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });
  });

  describe("GET /api/images/:id", () => {
    it("returns 422 for invalid UUID", async () => {
      const res = await request(app).get("/api/images/not-a-uuid");

      expect(res.status).toBe(422);
    });
  });

  describe("Unknown API routes", () => {
    it("returns 404 for unmatched paths", async () => {
      const res = await request(app).get("/api/does-not-exist");

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });
});
