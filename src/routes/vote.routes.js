import { Router } from "express";
import { voteForCaption, removeVote } from "../controllers/vote.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateUuidParam } from "../middlewares/uuid.middleware.js";
import { voteRateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/captions/{id}/votes:
 *   post:
 *     summary: Vote for a caption
 *     tags: [Votes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Vote recorded
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Caption not found
 *       409:
 *         description: Already voted
 */
router.post(
  "/captions/:id/votes",
  voteRateLimiter,
  verifyJWT,
  validateUuidParam("id"),
  voteForCaption,
);

/**
 * @swagger
 * /api/captions/{id}/votes:
 *   delete:
 *     summary: Remove vote from a caption
 *     tags: [Votes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vote removed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vote or caption not found
 */
router.delete(
  "/captions/:id/votes",
  voteRateLimiter,
  verifyJWT,
  validateUuidParam("id"),
  removeVote,
);

export default router;
