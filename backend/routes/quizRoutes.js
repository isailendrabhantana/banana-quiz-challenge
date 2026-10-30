import express from "express";
import { randomUUID } from "node:crypto";
import { getQuestionWithFallback } from "../services/bananaService.js";
import { quizEvents } from "../services/quizEvents.js";

const router = express.Router();

const TOTAL = 10;
const POINTS = 10;

const DIFFICULTY_LIMITS = Object.freeze({
  easy: 25,
  intermediate: 20,
  hard: 15,
});

const quizzes = new Map();

function getOwnedQuiz(req, res) {
  const quiz = quizzes.get(req.body?.quizId);

  if (!quiz || quiz.userId !== req.session.userId) {
    res.status(404).json({
      message: "Quiz not found. Start a new quiz.",
    });

    return null;
  }

  return quiz;
}

function safeQuestion(q) {
  return {
    quizId: q.id,
    questionNumber: q.questionNumber,
    totalQuestions: TOTAL,
    questionImage: q.current.questionImage,
    score: q.score,
    source: q.current.source,
    difficulty: q.difficulty,
    timeLimitSeconds: q.timeLimitSeconds,
    deadlineAt: q.deadlineAt,
  };
}

function getDifficulty(value) {
  const difficulty = String(value || "").toLowerCase();

  return DIFFICULTY_LIMITS[difficulty] ? difficulty : null;
}

function hasTimedOut(quiz) {
  return Date.now() >= quiz.deadlineAt;
}

function timeoutQuizQuestion(quiz) {
  quiz.answered = true;
  quiz.timedOut = true;
  quiz.completed = quiz.questionNumber === TOTAL;

  quizEvents.emit("quiz:timedout", {
    userId: quiz.userId,
    quizId: quiz.id,
    questionNumber: quiz.questionNumber,
    score: quiz.score,
  });

  if (quiz.completed) {
    quizEvents.emit("quiz:completed", {
      userId: quiz.userId,
      quizId: quiz.id,
      score: quiz.score,
    });
  }
}

router.post("/start", async (req, res) => {
  const difficulty = getDifficulty(req.body?.difficulty);

  if (!difficulty) {
    return res.status(400).json({
      message: "Choose a difficulty: easy, intermediate or hard.",
    });
  }

  const id = randomUUID();

  const current = await getQuestionWithFallback(0);

  const timeLimitSeconds = DIFFICULTY_LIMITS[difficulty];

  const startedAt = Date.now();

  const deadlineAt = startedAt + timeLimitSeconds * 1000;

  const quiz = {
    id,
    userId: req.session.userId,

    score: 0,
    questionNumber: 1,

    answered: false,
    timedOut: false,
    completed: false,

    difficulty,
    timeLimitSeconds,

    startedAt,
    deadlineAt,

    current,
  };

  quizzes.set(id, quiz);

  quizEvents.emit("quiz:started", {
    userId: quiz.userId,
    quizId: id,
    difficulty,
    timeLimitSeconds,
  });

  return res.status(201).json(safeQuestion(quiz));
});

router.post("/answer", (req, res) => {
  const quiz = getOwnedQuiz(req, res);

  if (!quiz) return;

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

  // The server timestamp is authoritative.
  // Changing the browser timer cannot extend the quiz.
  if (hasTimedOut(quiz)) {
    timeoutQuizQuestion(quiz);

    return res.status(408).json({
      timedOut: true,
      score: quiz.score,
      questionNumber: quiz.questionNumber,
      totalQuestions: TOTAL,
      completed: quiz.completed,
      message: "Time is up! You did not receive points for this question.",
    });
  }

  const answer = req.body?.answer;

  if (
    answer === undefined ||
    answer === null ||
    String(answer).trim() === "" ||
    !Number.isFinite(Number(answer))
  ) {
    return res.status(400).json({
      message: "Please enter a valid number.",
    });
  }

  const correct = Number(answer) === quiz.current.solution;

  if (correct) {
    quiz.score += POINTS;
  }

  quiz.answered = true;
  quiz.timedOut = false;
  quiz.completed = quiz.questionNumber === TOTAL;

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

  return res.json({
    correct,
    score: quiz.score,
    questionNumber: quiz.questionNumber,
    totalQuestions: TOTAL,
    completed: quiz.completed,
    timedOut: false,
    message: correct
      ? `Correct! You earned ${POINTS} points.`
      : "Not quite. Try the next puzzle!",
  });
});

router.post("/timeout", (req, res) => {
  const quiz = getOwnedQuiz(req, res);

  if (!quiz) return;

  if (quiz.completed) {
    return res.status(400).json({
      message: "This quiz has already finished.",
    });
  }

  if (quiz.answered) {
    return res.status(409).json({
      message: "This question has already been answered.",
    });
  }

  if (!hasTimedOut(quiz)) {
    return res.status(400).json({
      message: "The timer has not expired yet.",
    });
  }

  timeoutQuizQuestion(quiz);

  return res.json({
    timedOut: true,
    score: quiz.score,
    questionNumber: quiz.questionNumber,
    totalQuestions: TOTAL,
    completed: quiz.completed,
    message: "Time is up! You did not receive points for this question.",
  });
});

router.post("/next", async (req, res) => {
  const quiz = getOwnedQuiz(req, res);

  if (!quiz) return;

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

  const nextNumber = quiz.questionNumber + 1;

  quiz.current = await getQuestionWithFallback(nextNumber - 1);

  quiz.questionNumber = nextNumber;

  quiz.answered = false;
  quiz.timedOut = false;

  quiz.startedAt = Date.now();

  quiz.deadlineAt = quiz.startedAt + quiz.timeLimitSeconds * 1000;

  return res.json(safeQuestion(quiz));
});

export default router;
