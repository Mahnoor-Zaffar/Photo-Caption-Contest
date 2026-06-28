import { Caption, Vote } from "../models/index.js";
import sequelize from "../config/sequelize.js";
import { invalidateImageCaches } from "../config/cache.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const voteForCaption = asyncHandler(async (req, res) => {
  const { id: captionId } = req.params;

  const result = await sequelize.transaction(async (transaction) => {
    const caption = await Caption.findByPk(captionId, { transaction });

    if (!caption) {
      throw new ApiError(404, "Caption not found");
    }

    if (caption.userId === req.user.id) {
      throw new ApiError(403, "You cannot vote for your own caption");
    }

    const existingVote = await Vote.findOne({
      where: { userId: req.user.id, imageId: caption.imageId },
      transaction,
    });

    if (existingVote) {
      if (existingVote.captionId === captionId) {
        throw new ApiError(409, "You have already voted for this caption");
      }

      await existingVote.update({ captionId }, { transaction });
      return { vote: existingVote, moved: true };
    }

    const vote = await Vote.create(
      {
        userId: req.user.id,
        captionId,
        imageId: caption.imageId,
      },
      { transaction },
    );

    return { vote, moved: false };
  });

  invalidateImageCaches(result.vote.imageId);

  const statusCode = result.moved ? 200 : 201;
  const message = result.moved ? "Vote moved to this caption" : "Vote recorded";

  res.status(statusCode).json(
    new ApiResponse(
      statusCode,
      {
        id: result.vote.id,
        captionId: result.vote.captionId,
        imageId: result.vote.imageId,
        moved: result.moved,
        createdAt: result.vote.createdAt,
      },
      message,
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
    where: { userId: req.user.id, imageId: caption.imageId },
  });

  if (!deleted) {
    throw new ApiError(404, "Vote not found");
  }

  invalidateImageCaches(caption.imageId);

  res.status(200).json(new ApiResponse(200, null, "Vote removed"));
});
