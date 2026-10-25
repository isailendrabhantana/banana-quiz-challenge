import { EventEmitter } from "node:events";
export const quizEvents = new EventEmitter();
quizEvents.on("quiz:started", e => console.log(`[event] quiz:started user=${e.userId} quiz=${e.quizId}`));
quizEvents.on("quiz:answered", e => console.log(`[event] quiz:answered correct=${e.correct} score=${e.score}`));
quizEvents.on("quiz:completed", e => console.log(`[event] quiz:completed score=${e.score}`));
