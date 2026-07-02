import { Image, Caption } from "../models/index.js";
import sequelize from "../config/sequelize.js";
import { invalidateImageCaches } from "../config/cache.js";
import { ApiError } from "../utils/ApiError.js";
import { ErrorCodes } from "../utils/errorCodes.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sanitizeCaptionText } from "../utils/sanitize.js";

export const submitCaption = asyncHandler(async (req, res) => {
  const { id: imageId } = req.params;
  const text = sanitizeCaptionText(req.body.text);

  if (!text) {
    throw new ApiError(422, "Caption text is required", { code: ErrorCodes.VALIDATION_FAILED });
  }

  const caption = await sequelize.transaction(async (transaction) => {
    const image = await Image.findByPk(imageId, { transaction });

    if (!image) {
      throw new ApiError(404, "Image not found", { code: ErrorCodes.IMAGE_NOT_FOUND });
    }

    if (image.status === "closed") {
      throw new ApiError(403, "Contest is closed for this image", {
        code: ErrorCodes.CONTEST_CLOSED,
      });
    }

    const existingCaption = await Caption.findOne({
      where: {
        userId: req.user.id,
        imageId,
      },
      transaction,
    });

    if (existingCaption) {
      throw new ApiError(409, "You have already submitted a caption for this image", {
        code: ErrorCodes.CAPTION_DUPLICATE,
      });
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
