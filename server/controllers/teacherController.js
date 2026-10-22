import mongoose from "mongoose";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import Question from "../models/Question.js";
import User from "../models/User.js";
import { gradeAnswers } from "../lib/assessment.js";
import { HttpError } from "../lib/httpErrors.js";

function parseSearch(value) {
  if (typeof value !== "string" || value.length > 80) {
    throw new HttpError(400, "Search text must be 80 characters or fewer.");
  }
  return value.trim();
}

async function studentPerformance(search = "") {
  const query = { role: "student" };
  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { email: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const students = await User.find(query).select("name email createdAt").sort({ name: 1 });
  if (!students.length) return [];

  const totals = await AssessmentAttempt.aggregate([
    { $match: { student: { $in: students.map(({ _id }) => _id) }, status: "completed" } },
    {
      $group: {
        _id: "$student",
        attempts: { $sum: 1 },
        averageScore: { $avg: "$score" },
        mostRecentCompletion: { $max: "$submittedAt" },
      },
    },
  ]);
  const byStudent = new Map(totals.map((row) => [String(row._id), row]));

  return students.map((student) => {
    const aggregate = byStudent.get(String(student._id));
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      registeredAt: student.createdAt,
      completedAttempts: aggregate?.attempts ?? 0,
      averageScore: aggregate ? Math.round(aggregate.averageScore * 100) / 100 : null,
      mostRecentCompletion: aggregate?.mostRecentCompletion ?? null,
    };
  });
}

export async function getOverview(_request, response) {
  const [studentCount, completedAttempts, attemptAverage] = await Promise.all([
    User.countDocuments({ role: "student" }),
    AssessmentAttempt.countDocuments({ status: "completed" }),
    AssessmentAttempt.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, averageScore: { $avg: "$score" } } },
    ]),
  ]);
  response.json({
    totalStudents: studentCount,
    completedAssessments: completedAttempts,
    averageScore: attemptAverage[0] ? Math.round(attemptAverage[0].averageScore * 100) / 100 : null,
    averageOutOf: 10,
  });
}

export async function getLeaderboard(_request, response) {
  const eligible = (await studentPerformance()).filter((student) => student.completedAttempts > 0);
  eligible.sort((left, right) =>
    right.averageScore - left.averageScore ||
    right.completedAttempts - left.completedAttempts ||
    new Date(left.mostRecentCompletion) - new Date(right.mostRecentCompletion) ||
    left.id.localeCompare(right.id),
  );
  response.json({
    rankingRule: "Average score descending, then completed attempts descending, then earlier most-recent completion, then stable account ID.",
    students: eligible.slice(0, 3),
  });
}

export async function getStudents(request, response) {
  const search = parseSearch(request.query.search ?? "");
  response.json({ students: await studentPerformance(search) });
}

export async function getStudentDetails(request, response) {
  if (!mongoose.isValidObjectId(request.params.studentId)) throw new HttpError(400, "Invalid student ID.");
  const student = await User.findOne({ _id: request.params.studentId, role: "student" })
    .select("name email createdAt");
  if (!student) throw new HttpError(404, "Student not found.");

  const attempts = await AssessmentAttempt.find({ student: student._id })
    .select("+resultSnapshot")
    .sort({ startedAt: -1 })
    .limit(50);
  const completed = attempts.filter((attempt) => attempt.status === "completed");
  const history = await Promise.all(attempts.map(async (attempt) => {
    if (attempt.status === "completed") {
      if (attempt.resultSnapshot?.length) {
        return {
          attemptId: attempt.id,
          submittedAt: attempt.submittedAt,
          startedAt: attempt.startedAt,
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
        submittedAt: attempt.submittedAt,
        startedAt: attempt.startedAt,
        ...gradeAnswers(questions, attempt.answers, attempt.questionIds),
      };
    }

    const questions = await Question.find({ questionId: { $in: attempt.questionIds } })
      .select("questionId topic prompt options");
    const answers = new Map(attempt.answers.map(({ questionId, optionId }) => [questionId, optionId]));
    return {
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      answeredCount: answers.size,
      total: attempt.questionIds.length,
      questions: attempt.questionIds.flatMap((questionId) => {
        const question = questions.find((item) => item.questionId === questionId);
        if (!question) return [];
        const selectedOptionId = answers.get(questionId);
        return [{
          questionId,
          topic: question.topic,
          prompt: question.prompt,
          selectedOptionId: selectedOptionId ?? null,
          selectedOptionText: question.options.find(({ id }) => id === selectedOptionId)?.text ?? null,
        }];
      }),
    };
  }));

  response.json({
    student: { id: student.id, name: student.name, email: student.email, registeredAt: student.createdAt },
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      status: attempt.status,
      score: attempt.score,
      total: attempt.total,
      percentage: attempt.percentage,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      ...history.find((result) => result.attemptId === attempt.id),
    })),
  });
}

const editableQuestionFields = [
  "topic",
  "difficulty",
  "scenario",
  "prompt",
  "evidence",
  "evidenceLabel",
  "options",
  "correctOptionId",
  "hint",
  "explanation",
  "commonWrongExplanation",
  "commonWrongOptionId",
  "active",
];

function questionChanges(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Provide a question object.");
  }
  const entries = Object.entries(body).filter(([key]) => editableQuestionFields.includes(key));
  if (entries.length !== Object.keys(body).length) {
    throw new HttpError(400, "Question contains unsupported fields.");
  }
  if (!entries.length) throw new HttpError(400, "Provide at least one question field to update.");
  return Object.fromEntries(entries);
}

export async function listQuestions(_request, response) {
  const questions = await Question.find({}).select(
    "+correctOptionId +explanation +commonWrongExplanation +commonWrongOptionId",
  ).sort({ questionId: 1 });
  response.json({ questions });
}

export async function createQuestion(request, response) {
  if (typeof request.body?.questionId !== "string" || !/^[a-z0-9-]{3,80}$/.test(request.body.questionId)) {
    throw new HttpError(400, "Question ID must use 3–80 lowercase letters, numbers, or hyphens.");
  }
  const { questionId, ...questionBody } = request.body;
  const values = questionChanges(questionBody);
  const question = await Question.create({ ...values, questionId });
  response.status(201).json({ question });
}

export async function updateQuestion(request, response) {
  if (typeof request.params.questionId !== "string") throw new HttpError(400, "Invalid question ID.");
  const values = questionChanges(request.body);
  const question = await Question.findOneAndUpdate(
    { questionId: request.params.questionId },
    { $set: values },
    { new: true, runValidators: true },
  ).select("+correctOptionId +explanation +commonWrongExplanation +commonWrongOptionId");
  if (!question) throw new HttpError(404, "Question not found.");
  response.json({ question });
}

export async function archiveQuestion(request, response) {
  const question = await Question.findOneAndUpdate(
    { questionId: request.params.questionId },
    { $set: { active: false } },
    { new: true },
  );
  if (!question) throw new HttpError(404, "Question not found.");
  response.json({ archived: true, questionId: question.questionId });
}
