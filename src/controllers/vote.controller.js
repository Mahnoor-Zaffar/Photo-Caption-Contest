import { Caption, Vote } from "../models/index.js";
import sequelize from "../config/sequelize.js";
import { invalidateImageCaches } from "../config/cache.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const voteForCaption = asyncHandler(async (req, res) => {
  const { id: captionId } = req.params;

  const vote = await sequelize.transaction(async (transaction) => {
    const caption = await Caption.findByPk(captionId, { transaction });

    if (!caption) {
      throw new ApiError(404, "Caption not found");
    }

    const existingVote = await Vote.findOne({
      where: { userId: req.user.id, captionId },
      transaction,
    });

    if (existingVote) {
      throw new ApiError(409, "You have already voted for this caption");
    }

    return Vote.create(
      { userId: req.user.id, captionId },
      { transaction },
    );
  });

  const caption = await Caption.findByPk(captionId);
  invalidateImageCaches(caption.imageId);

  res.status(201).json(
    new ApiResponse(
      201,
      { id: vote.id, captionId: vote.captionId, createdAt: vote.createdAt },
      "Vote recorded",
    ),
  );
});

export const removeVote = asyncHandler(async (req, res) => {
  const { id: captionId } = req.params;

  const caption = await Caption.findByPk(captionId);

  if (!caption) {
    throw new ApiError(404, "Caption not found");
  }

  const deleted = await Vote.destroy({
    where: { userId: req.user.id, captionId },
  });

  if (!deleted) {
    throw new ApiError(404, "Vote not found");
  }

  invalidateImageCaches(caption.imageId);

  res.status(200).json(new ApiResponse(200, null, "Vote removed"));
});
