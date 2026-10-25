import express from "express";
import { randomUUID } from "node:crypto";
import { getQuestionWithFallback } from "../services/bananaService.js";
import { quizEvents } from "../services/quizEvents.js";

const router = express.Router();
const TOTAL = 10;
const POINTS = 10;
const quizzes = new Map();

function getOwnedQuiz(req, res) {
  const quiz = quizzes.get(req.body?.quizId);
  if (!quiz || quiz.userId !== req.session.userId) {
    res.status(404).json({ message: "Quiz not found. Start a new quiz." });
    return null;
  }
  return quiz;
}
function safeQuestion(q) {
  return { quizId: q.id, questionNumber: q.questionNumber, totalQuestions: TOTAL,
    questionImage: q.current.questionImage, score: q.score, source: q.current.source };
}
router.post("/start", async (req, res) => {
  const id = randomUUID();
  const current = await getQuestionWithFallback(0);
  const quiz = { id, userId: req.session.userId, score: 0, questionNumber: 1, answered: false, completed: false, current };
  quizzes.set(id, quiz);
  quizEvents.emit("quiz:started", { userId: quiz.userId, quizId: id });
  res.status(201).json(safeQuestion(quiz));
});
router.post("/answer", (req, res) => {
  const quiz = getOwnedQuiz(req, res);
  if (!quiz) return;
  if (quiz.completed) return res.status(400).json({ message: "This quiz has already finished." });
  if (quiz.answered) return res.status(409).json({ message: "You have already answered this question." });
  const answer = req.body?.answer;
  if (answer === undefined || answer === null || String(answer).trim() === "" || !Number.isFinite(Number(answer)))
    return res.status(400).json({ message: "Please enter a valid number." });
  const correct = Number(answer) === quiz.current.solution;
  if (correct) quiz.score += POINTS;
  quiz.answered = true;
  quiz.completed = quiz.questionNumber === TOTAL;
  quizEvents.emit("quiz:answered", { userId: quiz.userId, quizId: quiz.id, correct, score: quiz.score });
  if (quiz.completed) quizEvents.emit("quiz:completed", { userId: quiz.userId, quizId: quiz.id, score: quiz.score });
  res.json({ correct, score: quiz.score, questionNumber: quiz.questionNumber, totalQuestions: TOTAL,
    completed: quiz.completed, message: correct ? `Correct! You earned ${POINTS} points.` : "Not quite. Try the next puzzle!" });
});
router.post("/next", async (req, res) => {
  const quiz = getOwnedQuiz(req, res);
  if (!quiz) return;
  if (quiz.completed) return res.status(400).json({ message: "This quiz has already finished." });
  if (!quiz.answered) return res.status(400).json({ message: "Submit your current answer first." });
  const nextNumber = quiz.questionNumber + 1;
  quiz.current = await getQuestionWithFallback(nextNumber - 1);
  quiz.questionNumber = nextNumber;
  quiz.answered = false;
  res.json(safeQuestion(quiz));
});
export default router;
