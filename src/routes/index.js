import { Router } from "express";
import authRoutes from "./auth.routes.js";
import imageRoutes from "./image.routes.js";

const router = Router();

router.use(authRoutes);
router.use(imageRoutes);

export default router;
