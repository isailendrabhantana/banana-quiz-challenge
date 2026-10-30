import { EventEmitter } from "node:events";

export const quizEvents = new EventEmitter();

function logEvent(eventName, details) {
  const timestamp = new Date().toISOString();

  console.log(`[event] ${timestamp} ${eventName}`, details);
}

quizEvents.on("quiz:started", (event) => {
  logEvent("quiz:started", {
    user: event.userId,
    quiz: event.quizId,
    difficulty: event.difficulty,
    timeLimitSeconds: event.timeLimitSeconds,
  });
});

quizEvents.on("quiz:answered", (event) => {
  logEvent("quiz:answered", {
    user: event.userId,
    quiz: event.quizId,
    question: event.questionNumber,
    correct: event.correct,
    score: event.score,
  });
});

quizEvents.on("quiz:timedout", (event) => {
  logEvent("quiz:timedout", {
    user: event.userId,
    quiz: event.quizId,
    question: event.questionNumber,
    score: event.score,
  });
});

quizEvents.on("quiz:completed", (event) => {
  logEvent("quiz:completed", {
    user: event.userId,
    quiz: event.quizId,
    score: event.score,
  });
});
