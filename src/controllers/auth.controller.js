import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import sequelize from "../config/sequelize.js";
import { getCacheStats } from "../config/cache.js";
import { ApiError } from "../utils/ApiError.js";
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
    { id: user.id },
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
    throw new ApiError(409, "Email already registered");
  }

  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    throw new ApiError(409, "Username already taken");
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
    throw new ApiError(401, "Invalid email or password");
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
    throw new ApiError(401, "Refresh token required");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    );

    const user = await User.findByPk(decoded.id);

    if (!user || user.refreshToken !== token) {
      throw new ApiError(401, "Invalid refresh token");
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
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }
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

export const healthCheck = asyncHandler(async (_req, res) => {
  let dbStatus = "ok";

  try {
    await sequelize.authenticate();
  } catch {
    dbStatus = "error";
  }

  const cache = getCacheStats();

  res.status(dbStatus === "ok" ? 200 : 503).json(
    new ApiResponse(
      dbStatus === "ok" ? 200 : 503,
      {
        status: dbStatus === "ok" ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        database: dbStatus,
        cache,
      },
      dbStatus === "ok" ? "Service is healthy" : "Service degraded",
    ),
  );
});
