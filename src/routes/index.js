import { Router } from "express";
import authRoutes from "./auth.routes.js";
import imageRoutes from "./image.routes.js";
import voteRoutes from "./vote.routes.js";

const router = Router();

router.use(authRoutes);
router.use(imageRoutes);
router.use(voteRoutes);

export default router;
