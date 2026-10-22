import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    id: { type: String, enum: ["a", "b", "c", "d"], required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, unique: true, index: true },
    sequence: { type: Number, default: 100, index: true },
    topic: { type: String, required: true, trim: true, maxlength: 100 },
    difficulty: { type: String, enum: ["foundational", "intermediate", "advanced"], required: true },
    scenario: { type: String, required: true, trim: true, maxlength: 3000 },
    prompt: { type: String, required: true, trim: true, maxlength: 1000 },
    evidence: { type: String, default: "", maxlength: 4000 },
    evidenceLabel: { type: String, default: "Evidence", maxlength: 100 },
    options: {
      type: [optionSchema],
      validate: {
        validator: (options) => options.length === 4 && new Set(options.map((item) => item.id)).size === 4,
        message: "Each question must have exactly four unique answer options.",
      },
      required: true,
    },
    correctOptionId: { type: String, enum: ["a", "b", "c", "d"], required: true, select: false },
    hint: { type: String, required: true, maxlength: 500 },
    explanation: { type: String, required: true, maxlength: 1200, select: false },
    commonWrongExplanation: { type: String, required: true, maxlength: 800, select: false },
    commonWrongOptionId: { type: String, enum: ["a", "b", "c", "d"], required: true, select: false },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

questionSchema.index({ active: 1, questionId: 1 });
questionSchema.pre("validate", function validateAnswerReferences(next) {
  const optionIds = new Set(this.options.map(({ id }) => id));
  if (!optionIds.has(this.correctOptionId)) {
    this.invalidate("correctOptionId", "Correct answer must reference one of the four options.");
  }
  if (!optionIds.has(this.commonWrongOptionId) || this.commonWrongOptionId === this.correctOptionId) {
    this.invalidate("commonWrongOptionId", "Common wrong answer must reference a different option.");
  }
  next();
});

export default mongoose.model("Question", questionSchema);
