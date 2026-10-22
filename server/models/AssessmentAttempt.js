import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    optionId: { type: String, enum: ["a", "b", "c", "d"], required: true },
    savedAt: { type: Date, default: Date.now },
    correct: { type: Boolean, select: false },
  },
  { _id: false },
);

const attemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assessmentVersion: { type: String, required: true, default: "fullstack-2026-v1" },
    questionIds: { type: [String], required: true, validate: (ids) => ids.length === 10 },
    answers: { type: [answerSchema], default: [] },
    resultSnapshot: { type: [mongoose.Schema.Types.Mixed], default: undefined, select: false },
    score: { type: Number, min: 0, max: 10, default: null },
    total: { type: Number, default: 10 },
    percentage: { type: Number, min: 0, max: 100, default: null },
    correctCount: { type: Number, min: 0, max: 10, default: null },
    incorrectCount: { type: Number, min: 0, max: 10, default: null },
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress", index: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

attemptSchema.index({ student: 1, status: 1, submittedAt: -1 });
attemptSchema.index(
  { student: 1, assessmentVersion: 1 },
  { unique: true, partialFilterExpression: { status: "in_progress" } },
);

export default mongoose.model("AssessmentAttempt", attemptSchema);
