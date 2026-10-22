import "../config/loadEnv.js";
import mongoose from "mongoose";
import Question from "../models/Question.js";
import { assessmentQuestions } from "../data/assessmentQuestions.js";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI must be set in the root .env file before seeding questions.");

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const operations = assessmentQuestions.map((question, index) => ({
    updateOne: {
      filter: { questionId: question.questionId },
      update: { $setOnInsert: { ...question, sequence: index + 1, active: true } },
      upsert: true,
    },
  }));
  await Question.bulkWrite(operations, { ordered: true });
  const seededCount = await Question.countDocuments({
    questionId: { $in: assessmentQuestions.map(({ questionId }) => questionId) },
    active: true,
  });
  if (seededCount !== 10) {
    throw new Error(`Expected 10 active assessment questions, found ${seededCount}.`);
  }
  console.log(`Assessment seed complete: ${seededCount} active questions are available.`);
} finally {
  await mongoose.disconnect();
}
