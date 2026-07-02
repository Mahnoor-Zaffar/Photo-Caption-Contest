import rateLimit from "express-rate-limit";
import { ErrorCodes } from "../utils/errorCodes.js";

const rateLimitBody = (message) => ({
  success: false,
  code: ErrorCodes.RATE_LIMITED,
  message,
  errors: [],
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitBody("Too many auth attempts, please try again later"),
});

export const voteRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: rateLimitBody("Too many vote requests, please try again later"),
});

export const captionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: rateLimitBody("Too many caption requests, please try again later"),
});
