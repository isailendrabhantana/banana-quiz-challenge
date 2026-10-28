import express from "express";
import { randomUUID } from "node:crypto";
import { getQuestionWithFallback } from "../services/bananaService.js";
import { quizEvents } from "../services/quizEvents.js";

const router = express.Router();

const TOTAL_QUESTIONS = 10;
const POINTS_PER_QUESTION = 10;

const quizzes = new Map();

function getOwnedQuiz(req, res) {
  const quizId = req.body?.quizId;
  const quiz = quizzes.get(quizId);

  if (!quiz || quiz.userId !== req.session.userId) {
    res.status(404).json({
      message: "Quiz not found. Start a new quiz.",
    });

    return null;
  }

  return quiz;
}

function isValidAnswer(answer) {
  if (answer === undefined || answer === null) {
    return false;
  }

  const value = String(answer).trim();

  if (value === "") {
    return false;
  }

  return /^-?\d+$/.test(value);
}

function safeQuestion(quiz) {
  return {
    quizId: quiz.id,
    questionNumber: quiz.questionNumber,
    totalQuestions: TOTAL_QUESTIONS,
    questionImage: quiz.current.questionImage,
    score: quiz.score,
    source: quiz.current.source,
  };
}

router.post("/start", async (req, res) => {
  try {
    const quizId = randomUUID();
    const current = await getQuestionWithFallback(0);

    const quiz = {
      id: quizId,
      userId: req.session.userId,
      score: 0,
      questionNumber: 1,
      answered: false,
      completed: false,
      current,
    };

    quizzes.set(quizId, quiz);

    quizEvents.emit("quiz:started", {
      userId: quiz.userId,
      quizId: quiz.id,
    });

    res.status(201).json(safeQuestion(quiz));
  } catch (error) {
    console.error("Failed to start quiz:", error);

    res.status(500).json({
      message: "Unable to start the quiz. Please try again.",
    });
  }
});

router.post("/answer", (req, res) => {
  const quiz = getOwnedQuiz(req, res);

  if (!quiz) {
    return;
  }

  if (quiz.completed) {
    return res.status(400).json({
      message: "This quiz has already finished.",
    });
  }

  if (quiz.answered) {
    return res.status(409).json({
      message: "You have already answered this question.",
    });
  }

  const answer = req.body?.answer;

  if (!isValidAnswer(answer)) {
    return res.status(400).json({
      message: "Please enter a valid whole number.",
    });
  }

  const submittedAnswer = Number(answer);
  const correct = submittedAnswer === quiz.current.solution;

  if (correct) {
    quiz.score += POINTS_PER_QUESTION;
  }

  quiz.answered = true;
  quiz.completed = quiz.questionNumber === TOTAL_QUESTIONS;

  quizEvents.emit("quiz:answered", {
    userId: quiz.userId,
    quizId: quiz.id,
    questionNumber: quiz.questionNumber,
    correct,
    score: quiz.score,
  });

  if (quiz.completed) {
    quizEvents.emit("quiz:completed", {
      userId: quiz.userId,
      quizId: quiz.id,
      score: quiz.score,
    });
  }

  res.json({
    correct,
    score: quiz.score,
    questionNumber: quiz.questionNumber,
    totalQuestions: TOTAL_QUESTIONS,
    completed: quiz.completed,
    message: correct
      ? `Correct! You earned ${POINTS_PER_QUESTION} points.`
      : "Not quite. Try the next puzzle!",
  });
});

router.post("/next", async (req, res) => {
  const quiz = getOwnedQuiz(req, res);

  if (!quiz) {
    return;
  }

  if (quiz.completed) {
    return res.status(400).json({
      message: "This quiz has already finished.",
    });
  }

  if (!quiz.answered) {
    return res.status(400).json({
      message: "Submit your current answer first.",
    });
  }

  try {
    const nextQuestionNumber = quiz.questionNumber + 1;

    const current = await getQuestionWithFallback(nextQuestionNumber - 1);

    quiz.current = current;
    quiz.questionNumber = nextQuestionNumber;
    quiz.answered = false;

    res.json(safeQuestion(quiz));
  } catch (error) {
    console.error("Failed to load next question:", error);

    res.status(500).json({
      message: "Unable to load the next question.",
    });
  }
});

export default router;
