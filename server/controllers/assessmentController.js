import mongoose from "mongoose";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import Question from "../models/Question.js";
import { assessmentQuestions } from "../data/assessmentQuestions.js";
import { gradeAnswers, toPublicQuestion } from "../lib/assessment.js";
import { HttpError } from "../lib/httpErrors.js";

const ASSESSMENT_VERSION = "fullstack-2026-v1";

async function getAttemptForStudent(attemptId, studentId) {
  if (!mongoose.isValidObjectId(attemptId)) throw new HttpError(400, "Invalid assessment ID.");
  const attempt = await AssessmentAttempt.findOne({ _id: attemptId, student: studentId })
    .select("+resultSnapshot");
  if (!attempt) throw new HttpError(404, "Assessment attempt not found.");
  return attempt;
}

async function serializeResult(attempt) {
  if (attempt.resultSnapshot?.length) {
    return {
      attemptId: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      results: attempt.resultSnapshot,
      score: attempt.score,
      total: attempt.total,
      percentage: attempt.percentage,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
    };
  }
  const questions = await Question.find({ questionId: { $in: attempt.questionIds } })
    .select("+correctOptionId +explanation +commonWrongExplanation +commonWrongOptionId");
  return {
    attemptId: attempt.id,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    ...gradeAnswers(questions, attempt.answers, attempt.questionIds),
  };
}

export async function getQuestions(_request, response) {
  const records = await Question.find({
    active: true,
    questionId: { $in: assessmentQuestions.map(({ questionId }) => questionId) },
  }).sort({ sequence: 1 });
  response.json({ questions: records.map(toPublicQuestion) });
}

export async function startAssessment(request, response) {
  let attempt = await AssessmentAttempt.findOne({
    student: request.user.id,
    status: "in_progress",
    assessmentVersion: ASSESSMENT_VERSION,
  }).sort({ startedAt: -1 });

  if (!attempt) {
    const availableQuestions = await Question.find({
      active: true,
      questionId: { $in: assessmentQuestions.map(({ questionId }) => questionId) },
    }).sort({ sequence: 1 }).select("questionId");
    if (availableQuestions.length !== 10) {
      throw new HttpError(503, "The full assessment is not available yet. Please contact your teacher.");
    }
    try {
      attempt = await AssessmentAttempt.create({
        student: request.user.id,
        assessmentVersion: ASSESSMENT_VERSION,
        questionIds: availableQuestions.map((question) => question.questionId),
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      attempt = await AssessmentAttempt.findOne({
        student: request.user.id,
        status: "in_progress",
        assessmentVersion: ASSESSMENT_VERSION,
      });
      if (!attempt) throw error;
    }
  }

  const questions = await Question.find({ questionId: { $in: attempt.questionIds } }).sort({ sequence: 1 });
  if (questions.length !== 10) {
    throw new HttpError(503, "A question in this assessment is no longer available. Please contact your teacher.");
  }

  response.status(200).json({
    attemptId: attempt.id,
    status: attempt.status,
    startedAt: attempt.startedAt,
    answers: attempt.answers.map(({ questionId, optionId }) => ({ questionId, optionId })),
    questionIds: attempt.questionIds,
    questions: questions.map(toPublicQuestion),
  });
}

export async function saveAnswer(request, response) {
  const { questionId, optionId } = request.body ?? {};
  if (typeof questionId !== "string" || !["a", "b", "c", "d"].includes(optionId)) {
    throw new HttpError(400, "Choose a valid answer for this question.");
  }
  const attempt = await getAttemptForStudent(request.params.attemptId, request.user.id);
  if (attempt.status !== "in_progress") throw new HttpError(409, "This assessment has already been submitted.");
  if (!attempt.questionIds.includes(questionId)) throw new HttpError(400, "Question does not belong to this assessment.");

  const question = await Question.findOne({ questionId }).select("options.id");
  if (!question || !question.options.some((option) => option.id === optionId)) {
    throw new HttpError(400, "That answer option is not available.");
  }

  const existingAnswer = attempt.answers.find((answer) => answer.questionId === questionId);
  if (existingAnswer) {
    existingAnswer.optionId = optionId;
    existingAnswer.savedAt = new Date();
  } else {
    attempt.answers.push({ questionId, optionId, savedAt: new Date() });
  }
  await attempt.save();
  response.json({ saved: true, questionId, savedAt: existingAnswer?.savedAt ?? attempt.answers.at(-1).savedAt });
}

export async function submitAssessment(request, response) {
  const attempt = await getAttemptForStudent(request.params.attemptId, request.user.id);
  if (attempt.status === "completed") {
    response.json(await serializeResult(attempt));
    return;
  }

  const answered = new Set(attempt.answers.map(({ questionId }) => questionId));
  const unanswered = attempt.questionIds.filter((questionId) => !answered.has(questionId));
  if (unanswered.length > 0) {
    throw new HttpError(409, "Answer every question before submitting.", { unanswered });
  }

  const questions = await Question.find({ questionId: { $in: attempt.questionIds } })
    .select("+correctOptionId +explanation +commonWrongExplanation +commonWrongOptionId");
  const graded = gradeAnswers(questions, attempt.answers, attempt.questionIds);
  attempt.answers.forEach((answer) => {
    answer.correct = graded.results.find((result) => result.questionId === answer.questionId).isCorrect;
  });
  attempt.score = graded.score;
  attempt.total = graded.total;
  attempt.percentage = graded.percentage;
  attempt.correctCount = graded.correctCount;
  attempt.incorrectCount = graded.incorrectCount;
  attempt.resultSnapshot = graded.results;
  attempt.status = "completed";
  attempt.submittedAt = new Date();
  await attempt.save();
  response.json({
    attemptId: attempt.id,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    ...graded,
  });
}

export async function getResults(request, response) {
  const attempt = await getAttemptForStudent(request.params.attemptId, request.user.id);
  if (attempt.status !== "completed") throw new HttpError(409, "Submit this assessment before viewing results.");
  response.json(await serializeResult(attempt));
}

export async function getStudentAttempts(request, response) {
  const attempts = await AssessmentAttempt.find({ student: request.user.id })
    .select("assessmentVersion score total percentage correctCount incorrectCount status startedAt submittedAt")
    .sort({ startedAt: -1 })
    .limit(50);
  response.json({
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      assessmentVersion: attempt.assessmentVersion,
      score: attempt.score,
      total: attempt.total,
      percentage: attempt.percentage,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
    })),
  });
}

export async function getQuestionForAttempt(attemptId, studentId, questionId) {
  const attempt = await getAttemptForStudent(attemptId, studentId);
  if (attempt.status !== "in_progress") throw new HttpError(409, "SAGE is available during an active assessment only.");
  if (!attempt.questionIds.includes(questionId)) throw new HttpError(400, "Question does not belong to this assessment.");
  const question = await Question.findOne({ questionId })
    .select("questionId topic scenario prompt evidence evidenceLabel options");
  if (!question) throw new HttpError(404, "Question not found.");
  return question;
}
