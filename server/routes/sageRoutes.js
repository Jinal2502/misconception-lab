import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { asyncHandler } from "../lib/httpErrors.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { chatWithSage } from "../controllers/sageController.js";

const router = Router();
router.use(
  requireAuth,
  requireRole("student"),
  rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 12,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "SAGE is taking a short break. Please try again later." },
  }),
);
router.post("/chat", asyncHandler(chatWithSage));

export default router;
