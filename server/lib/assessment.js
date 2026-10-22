export function gradeAnswers(questionRecords, submittedAnswers, questionIds) {
  const selected = new Map(submittedAnswers.map(({ questionId, optionId }) => [questionId, optionId]));
  const byId = new Map(questionRecords.map((question) => [question.questionId, question]));

  const results = questionIds.map((questionId) => {
    const question = byId.get(questionId);
    if (!question) throw new Error(`Question ${questionId} is unavailable.`);
    const selectedOptionId = selected.get(questionId);
    const isCorrect = selectedOptionId === question.correctOptionId;

    return {
      questionId,
      topic: question.topic,
      prompt: question.prompt,
      scenario: question.scenario,
      evidence: question.evidence,
      evidenceLabel: question.evidenceLabel,
      options: question.options,
      selectedOptionId,
      correctOptionId: question.correctOptionId,
      isCorrect,
      explanation: question.explanation,
      commonWrongExplanation: question.commonWrongExplanation,
      commonWrongOptionId: question.commonWrongOptionId,
    };
  });

  const correctCount = results.filter((result) => result.isCorrect).length;
  return {
    results,
    score: correctCount,
    total: questionIds.length,
    percentage: Math.round((correctCount / questionIds.length) * 100),
    correctCount,
    incorrectCount: questionIds.length - correctCount,
  };
}

export function toPublicQuestion(question) {
  const source = typeof question.toObject === "function" ? question.toObject() : question;
  const { correctOptionId, explanation, commonWrongExplanation, ...publicQuestion } = source;
  return publicQuestion;
}
