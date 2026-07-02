import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/index.js";
import sequelize from "../config/sequelize.js";
import { getCacheStats } from "../config/cache.js";
import { ApiError } from "../utils/ApiError.js";
import { ErrorCodes } from "../utils/errorCodes.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" },
  );
};

const formatUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const setAuthCookies = (res, accessToken, refreshToken) => {
  res
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, "Email already registered", { code: ErrorCodes.EMAIL_TAKEN });
  }

  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    throw new ApiError(409, "Username already taken", { code: ErrorCodes.USERNAME_TAKEN });
  }

  const user = await User.create({ username, email, password });
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await user.update({ refreshToken });

  setAuthCookies(res, accessToken, refreshToken);

  res.status(201).json(
    new ApiResponse(
      201,
      { user: formatUser(user), token: accessToken, refreshToken },
      "User registered",
    ),
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid email or password", { code: ErrorCodes.INVALID_CREDENTIALS });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await user.update({ refreshToken });

  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json(
    new ApiResponse(
      200,
      { user: formatUser(user), token: accessToken, refreshToken },
      "Login successful",
    ),
  );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.header("X-Refresh-Token");

  if (!token) {
    throw new ApiError(401, "Refresh token required", { code: ErrorCodes.REFRESH_REQUIRED });
  }

  let decoded;

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    );
  } catch {
    throw new ApiError(401, "Invalid refresh token", { code: ErrorCodes.INVALID_REFRESH_TOKEN });
  }

  const user = await User.findByPk(decoded.id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token", { code: ErrorCodes.INVALID_REFRESH_TOKEN });
  }

  if (!user.refreshToken) {
    throw new ApiError(401, "Session revoked", { code: ErrorCodes.SESSION_REVOKED });
  }

  if (user.refreshToken !== token) {
    await user.update({ refreshToken: null });
    throw new ApiError(401, "Refresh token reuse detected — all sessions revoked", {
      code: ErrorCodes.REFRESH_TOKEN_REUSE,
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await user.update({ refreshToken });

  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json(
    new ApiResponse(
      200,
      { token: accessToken, refreshToken },
      "Token refreshed",
    ),
  );
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, formatUser(req.user), "User profile fetched"));
});

export const logout = asyncHandler(async (req, res) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await User.update({ refreshToken: null }, { where: { id: decoded.id } });
    } catch {
      // Token invalid or expired — still clear cookies
    }
  }

  res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .status(200)
    .json(new ApiResponse(200, null, "Logout successful"));
});

export const healthLive = asyncHandler(async (_req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "ok",
        app: "photo-caption-contest",
        timestamp: new Date().toISOString(),
      },
      "Service is alive",
    ),
  );
});

export const healthReady = asyncHandler(async (_req, res) => {
  let dbStatus = "ok";

  try {
    await sequelize.authenticate();
  } catch {
    dbStatus = "error";
  }

  const cache = getCacheStats();
  const ok = dbStatus === "ok";

  res.status(ok ? 200 : 503).json(
    new ApiResponse(
      ok ? 200 : 503,
      {
        status: ok ? "ok" : "degraded",
        app: "photo-caption-contest",
        timestamp: new Date().toISOString(),
        database: dbStatus,
        cache,
      },
      ok ? "Service is ready" : "Service not ready",
    ),
  );
});

/** @deprecated Use /api/health/ready */
export const healthCheck = healthReady;
