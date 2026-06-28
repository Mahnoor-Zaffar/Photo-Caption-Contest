import { Image, Caption } from "../models/index.js";
import sequelize from "../config/sequelize.js";
import { invalidateImageCaches } from "../config/cache.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const submitCaption = asyncHandler(async (req, res) => {
  const { id: imageId } = req.params;
  const { text } = req.body;

  const caption = await sequelize.transaction(async (transaction) => {
    const image = await Image.findByPk(imageId, { transaction });

    if (!image) {
      throw new ApiError(404, "Image not found");
    }

    const existingCaption = await Caption.findOne({
      where: {
        userId: req.user.id,
        imageId,
      },
      transaction,
    });

    if (existingCaption) {
      throw new ApiError(409, "You have already submitted a caption for this image");
    }

    return Caption.create(
      {
        text,
        userId: req.user.id,
        imageId,
      },
      { transaction },
    );
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
