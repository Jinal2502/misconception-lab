import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { asyncHandler } from "../lib/httpErrors.js";
import { requireAuth } from "../middleware/auth.js";
import { getCurrentUser, login, logout, register } from "../controllers/authController.js";

const router = Router();
const registrationLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again later." },
});

router.post("/register", registrationLimit, asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.get("/me", requireAuth, getCurrentUser);

export default router;
