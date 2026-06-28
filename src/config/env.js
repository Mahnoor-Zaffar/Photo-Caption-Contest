import { ApiError } from "../utils/ApiError.js";

export const validateEnv = () => {
  if (process.env.NODE_ENV === "test") return;

  const required = ["DATABASE_URL", "JWT_SECRET"];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (
    process.env.NODE_ENV === "production" &&
    ["change-me", "dev-secret-change-in-production"].includes(process.env.JWT_SECRET)
  ) {
    throw new Error("JWT_SECRET must be changed in production");
  }
};

export const getCorsOrigin = () => {
  const origin = process.env.CORS_ORIGIN || "*";
  if (origin === "*") return origin;
  return origin.split(",").map((o) => o.trim());
};
