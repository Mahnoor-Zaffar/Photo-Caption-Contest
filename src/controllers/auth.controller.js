import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
};

const formatUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  const existingUsername = await User.findOne({
    where: { username },
  });

  if (existingUsername) {
    throw new ApiError(409, "Username already taken");
  }

  const user = await User.create({ username, email, password });
  const token = generateToken(user);

  res
    .cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(201)
    .json(
      new ApiResponse(201, { user: formatUser(user), token }, "User registered"),
    );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(user);

  res
    .cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json(new ApiResponse(200, { user: formatUser(user), token }, "Login successful"));
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, formatUser(req.user), "User profile fetched"));
});

export const logout = asyncHandler(async (_req, res) => {
  res
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .status(200)
    .json(new ApiResponse(200, null, "Logout successful"));
});

export const healthCheck = asyncHandler(async (_req, res) => {
  res.status(200).json(
    new ApiResponse(200, { status: "ok", timestamp: new Date().toISOString() }, "Service is healthy"),
  );
});
