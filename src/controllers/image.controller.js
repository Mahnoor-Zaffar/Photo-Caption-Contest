import { Image, Caption, User, Vote } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ErrorCodes } from "../utils/errorCodes.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const formatCaption = (caption) => ({
  id: caption.id,
  text: caption.text,
  author: caption.author?.username || null,
  voteCount: Number(caption.voteCount ?? 0),
  createdAt: caption.createdAt,
});

export const getAllImages = asyncHandler(async (_req, res) => {
  const images = await Image.findAll({
    attributes: ["id", "title", "url", "description", "status", "createdAt"],
    order: [["createdAt", "ASC"]],
  });

  res.status(200).json(new ApiResponse(200, images, "Images fetched successfully"));
});

export const getImageById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "10", 10)));
  const offset = (page - 1) * limit;
  const sort = req.query.sort === "votes" ? "votes" : "recent";

  const image = await Image.findByPk(id, {
    attributes: ["id", "title", "url", "description", "status", "createdAt"],
  });

  if (!image) {
    throw new ApiError(404, "Image not found", { code: ErrorCodes.IMAGE_NOT_FOUND });
  }

  const { count, rows } = await Caption.findAndCountAll({
    where: { imageId: id },
    include: [
      {
        model: User,
        as: "author",
        attributes: ["username"],
      },
    ],
    order:
      sort === "votes"
        ? [
            ["voteCount", "DESC"],
            ["createdAt", "DESC"],
          ]
        : [["createdAt", "DESC"]],
    limit,
    offset,
  });

  let myVoteCaptionId = null;
  if (req.user) {
    const myVote = await Vote.findOne({
      where: { userId: req.user.id, imageId: id },
      attributes: ["captionId"],
    });
    myVoteCaptionId = myVote?.captionId ?? null;
  }

  const formatted = {
    id: image.id,
    title: image.title,
    url: image.url,
    description: image.description,
    status: image.status,
    createdAt: image.createdAt,
    captions: rows.map(formatCaption),
    sort,
    myVoteCaptionId,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };

  res.status(200).json(new ApiResponse(200, formatted, "Image fetched successfully"));
});

export const getImageWinner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const image = await Image.findByPk(id, {
    attributes: ["id", "title", "status"],
  });

  if (!image) {
    throw new ApiError(404, "Image not found", { code: ErrorCodes.IMAGE_NOT_FOUND });
  }

  if (image.status !== "closed") {
    throw new ApiError(403, "Contest is still open", { code: ErrorCodes.CONTEST_OPEN });
  }

  const winner = await Caption.findOne({
    where: { imageId: id },
    order: [
      ["voteCount", "DESC"],
      ["createdAt", "ASC"],
    ],
    include: [
      {
        model: User,
        as: "author",
        attributes: ["username"],
      },
    ],
  });

  if (!winner) {
    throw new ApiError(404, "No captions for this contest", { code: ErrorCodes.NO_CAPTIONS });
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        imageId: image.id,
        imageTitle: image.title,
        winner: formatCaption(winner),
      },
      "Winner fetched successfully",
    ),
  );
});

export const buildImageCacheKey = (req) => {
  const page = req.query.page || "1";
  const limit = req.query.limit || "10";
  const sort = req.query.sort === "votes" ? "votes" : "recent";
  return `images:${req.params.id}:p${page}:l${limit}:s${sort}`;
};
