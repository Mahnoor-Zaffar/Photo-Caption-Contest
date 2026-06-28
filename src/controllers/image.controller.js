import { Image, Caption, User } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const formatCaption = (caption) => ({
  id: caption.id,
  text: caption.text,
  author: caption.author?.username || null,
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

  const image = await Image.findByPk(id, {
    attributes: ["id", "title", "url", "description", "createdAt"],
    include: [
      {
        model: Caption,
        as: "captions",
        attributes: ["id", "text", "createdAt"],
        separate: true,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            as: "author",
            attributes: ["username"],
          },
        ],
      },
    ],
  });

  if (!image) {
    throw new ApiError(404, "Image not found");
  }

  const formatted = {
    id: image.id,
    title: image.title,
    url: image.url,
    description: image.description,
    createdAt: image.createdAt,
    captions: image.captions.map(formatCaption),
  };

  res.status(200).json(new ApiResponse(200, formatted, "Image fetched successfully"));
});
