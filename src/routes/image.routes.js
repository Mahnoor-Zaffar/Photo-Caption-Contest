import { Router } from "express";
import { getAllImages, getImageById, getImageWinner, buildImageCacheKey } from "../controllers/image.controller.js";
import { submitCaption } from "../controllers/caption.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { cacheResponse } from "../middlewares/cache.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { validateUuidParam } from "../middlewares/uuid.middleware.js";
import { captionRateLimiter } from "../middlewares/rateLimit.middleware.js";
import { body } from "express-validator";

const router = Router();

/**
 * @swagger
 * /api/images:
 *   get:
 *     summary: List all contest images
 *     tags: [Images]
 *     responses:
 *       200:
 *         description: Images fetched successfully
 */
router.get("/images", cacheResponse("images:all"), getAllImages);

router.get(
  "/images/:id/winner",
  validateUuidParam("id"),
  cacheResponse((req) => `images:${req.params.id}:winner`),
  getImageWinner,
);

/**
 * @swagger
 * /api/images/{id}:
 *   get:
 *     summary: Get a single image with paginated captions
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, votes]
 *           default: recent
 *     responses:
 *       200:
 *         description: Image with captions fetched successfully
 *       404:
 *         description: Image not found
 *       422:
 *         description: Invalid UUID
 */
router.get(
  "/images/:id",
  validateUuidParam("id"),
  optionalVerifyJWT,
  cacheResponse(buildImageCacheKey),
  getImageById,
);

/**
 * @swagger
 * /api/images/{id}/captions:
 *   post:
 *     summary: Submit a caption for an image
 *     tags: [Captions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 280
 *     responses:
 *       201:
 *         description: Caption submitted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Image not found
 *       409:
 *         description: Caption already submitted for this image
 *       422:
 *         description: Validation failed
 */
router.post(
  "/images/:id/captions",
  verifyJWT,
  captionRateLimiter,
  validateUuidParam("id"),
  [
    body("text")
      .trim()
      .notEmpty()
      .withMessage("Caption text is required")
      .isLength({ max: 280 })
      .withMessage("Caption must be at most 280 characters"),
    validate,
  ],
  submitCaption,
);

export default router;
