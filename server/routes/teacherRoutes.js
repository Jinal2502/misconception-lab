import { Router } from "express";
import { asyncHandler } from "../lib/httpErrors.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  archiveQuestion,
  createQuestion,
  getLeaderboard,
  getOverview,
  getStudentDetails,
  getStudents,
  listQuestions,
  updateQuestion,
} from "../controllers/teacherController.js";

const router = Router();
router.use(requireAuth, requireRole("teacher"));
router.get("/overview", asyncHandler(getOverview));
router.get("/leaderboard", asyncHandler(getLeaderboard));
router.get("/students", asyncHandler(getStudents));
router.get("/students/:studentId", asyncHandler(getStudentDetails));
router.get("/questions", asyncHandler(listQuestions));
router.post("/questions", asyncHandler(createQuestion));
router.put("/questions/:questionId", asyncHandler(updateQuestion));
router.delete("/questions/:questionId", asyncHandler(archiveQuestion));

export default router;
