import { Router } from "express";
import { asyncHandler } from "../lib/httpErrors.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getQuestions,
  getResults,
  getStudentAttempts,
  saveAnswer,
  startAssessment,
  submitAssessment,
} from "../controllers/assessmentController.js";

const router = Router();
router.use(requireAuth, requireRole("student"));
router.get("/questions", asyncHandler(getQuestions));
router.post("/start", asyncHandler(startAssessment));
router.get("/attempts", asyncHandler(getStudentAttempts));
router.put("/:attemptId/answers", asyncHandler(saveAnswer));
router.post("/:attemptId/submit", asyncHandler(submitAssessment));
router.get("/:attemptId/results", asyncHandler(getResults));

export default router;
