import test from "node:test";
import assert from "node:assert/strict";
import { gradeAnswers, toPublicQuestion } from "../lib/assessment.js";
import { requireRole } from "../middleware/auth.js";

const questions = [
  {
    questionId: "q-one",
    topic: "HTTP",
    prompt: "Pick one",
    correctOptionId: "b",
    options: [{ id: "a", text: "Wrong" }, { id: "b", text: "Right" }],
    explanation: "Reason",
    commonWrongExplanation: "Why the distractor fails",
    commonWrongOptionId: "a",
  },
  {
    questionId: "q-two",
    topic: "React",
    prompt: "Pick two",
    correctOptionId: "a",
    options: [{ id: "a", text: "Right" }, { id: "b", text: "Wrong" }],
    explanation: "Reason",
    commonWrongExplanation: "Why the distractor fails",
    commonWrongOptionId: "b",
  },
];

test("grading derives score and per-question correctness from trusted records", () => {
  const graded = gradeAnswers(
    questions,
    [{ questionId: "q-one", optionId: "b" }, { questionId: "q-two", optionId: "b" }],
    ["q-one", "q-two"],
  );
  assert.deepEqual(
    { score: graded.score, total: graded.total, percentage: graded.percentage, correctCount: graded.correctCount, incorrectCount: graded.incorrectCount },
    { score: 1, total: 2, percentage: 50, correctCount: 1, incorrectCount: 1 },
  );
  assert.deepEqual(graded.results.map(({ isCorrect }) => isCorrect), [true, false]);
});

test("public question projection never includes answer keys or grading explanations", () => {
  const result = toPublicQuestion(questions[0]);
  assert.equal("correctOptionId" in result, false);
  assert.equal("explanation" in result, false);
  assert.equal("commonWrongExplanation" in result, false);
});

test("teacher endpoints reject student roles and allow teacher roles", () => {
  const middleware = requireRole("teacher");
  let forwardedError;
  middleware({ user: { role: "student" } }, {}, (error) => { forwardedError = error; });
  assert.equal(forwardedError.status, 403);

  let passed = false;
  middleware({ user: { role: "teacher" } }, {}, (error) => {
    assert.equal(error, undefined);
    passed = true;
  });
  assert.equal(passed, true);
});
