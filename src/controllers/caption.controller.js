import { Image, Caption } from "../models/index.js";
import { invalidateImageCaches } from "../config/cache.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const submitCaption = asyncHandler(async (req, res) => {
  const { id: imageId } = req.params;
  const { text } = req.body;

  const image = await Image.findByPk(imageId);

  if (!image) {
    throw new ApiError(404, "Image not found");
  }

  const existingCaption = await Caption.findOne({
    where: {
      userId: req.user.id,
      imageId,
    },
  });

  if (existingCaption) {
    throw new ApiError(409, "You have already submitted a caption for this image");
  }

  const caption = await Caption.create({
    text,
    userId: req.user.id,
    imageId,
  });

  invalidateImageCaches(imageId);

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id: caption.id,
        text: caption.text,
        author: req.user.username,
        imageId: caption.imageId,
        createdAt: caption.createdAt,
      },
      "Caption submitted successfully",
    ),
  );
});
