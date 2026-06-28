import { ApiError } from "../utils/ApiError.js";

export const validateEnv = () => {
  if (process.env.NODE_ENV === "test") return;

  const required = ["DATABASE_URL", "JWT_SECRET"];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const insecureSecrets = [
    "change-me",
    "change-me-refresh",
    "dev-secret-change-in-production",
    "docker-dev-secret-change-me",
    "docker-refresh-secret-change-me",
  ];

  if (process.env.NODE_ENV === "production") {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET is required in production");
    }
    if (insecureSecrets.includes(process.env.JWT_SECRET)) {
      throw new Error("JWT_SECRET must be changed in production");
    }
    if (
      insecureSecrets.includes(process.env.JWT_REFRESH_SECRET) ||
      process.env.JWT_REFRESH_SECRET === process.env.JWT_SECRET
    ) {
      throw new Error("JWT_REFRESH_SECRET must be a unique value in production");
    }
  }
};

export const getCorsOrigin = () => {
  const origin = process.env.CORS_ORIGIN || "*";
  if (origin === "*") return origin;
  return origin.split(",").map((o) => o.trim());
};
