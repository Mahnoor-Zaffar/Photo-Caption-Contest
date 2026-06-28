import { Image, Caption, User } from "../models/index.js";
import sequelize from "../config/sequelize.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const formatCaption = (caption) => ({
  id: caption.id,
  text: caption.text,
  author: caption.author?.username || null,
  voteCount: Number(caption.get("voteCount") || 0),
  createdAt: caption.createdAt,
});

export const getAllImages = asyncHandler(async (_req, res) => {
  const images = await Image.findAll({
    attributes: ["id", "title", "url", "description", "createdAt"],
    order: [["createdAt", "ASC"]],
  });

  res.status(200).json(new ApiResponse(200, images, "Images fetched successfully"));
});

export const getImageById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "10", 10)));
  const offset = (page - 1) * limit;

  const image = await Image.findByPk(id, {
    attributes: ["id", "title", "url", "description", "createdAt"],
  });

  if (!image) {
    throw new ApiError(404, "Image not found");
  }

  const { count, rows } = await Caption.findAndCountAll({
    where: { imageId: id },
    attributes: {
      include: [
        [
          sequelize.literal(
            `(SELECT COUNT(*)::int FROM votes WHERE votes."captionId" = "Caption"."id")`,
          ),
          "voteCount",
        ],
      ],
    },
    include: [
      {
        model: User,
        as: "author",
        attributes: ["username"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  const formatted = {
    id: image.id,
    title: image.title,
    url: image.url,
    description: image.description,
    createdAt: image.createdAt,
    captions: rows.map(formatCaption),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };

  res.status(200).json(new ApiResponse(200, formatted, "Image fetched successfully"));
});

export const buildImageCacheKey = (req) => {
  const page = req.query.page || "1";
  const limit = req.query.limit || "10";
  return `images:${req.params.id}:p${page}:l${limit}`;
};
