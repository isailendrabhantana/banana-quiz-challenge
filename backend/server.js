import express from "express";
import session from "express-session";
import FileStoreFactory from "session-file-store";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import { requireAuth } from "./middleware/requireAuth.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 5000);
const FileStore = FileStoreFactory(session);
const sessionsPath = path.join(here, "sessions");
mkdirSync(sessionsPath, { recursive: true });

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.use(session({
  name: "banana.sid",
  store: new FileStore({ path: sessionsPath, retries: 0, logFn: () => {} }),
  secret: process.env.SESSION_SECRET || "development-secret-change-before-deployment",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/quiz", requireAuth, quizRoutes);

const dist = path.resolve(here, "../frontend/dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error." });
});
app.listen(PORT, () => {
  console.log(`Backend ready: http://localhost:${PORT}`);
  if (!process.env.SESSION_SECRET) console.warn("Using development session secret.");
});
