process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://localhost:5432/photo_caption_contest";
