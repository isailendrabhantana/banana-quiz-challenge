import express from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { createUser, findUserByEmail, findUserById } from "../storage/userStore.js";

const router = express.Router();
const publicUser = u => ({ id: u.id, username: u.username, email: u.email, createdAt: u.createdAt });

router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    if (typeof username !== "string" || username.trim().length < 2 || username.trim().length > 40)
      return res.status(400).json({ message: "Username must be 2–40 characters." });
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return res.status(400).json({ message: "Enter a valid email address." });
    if (typeof password !== "string" || password.length < 8 || password.length > 128)
      return res.status(400).json({ message: "Password must be 8–128 characters." });

    const cleanEmail = email.trim().toLowerCase();
    if (await findUserByEmail(cleanEmail))
      return res.status(409).json({ message: "An account with this email already exists." });

    const user = {
      id: randomUUID(), username: username.trim(), email: cleanEmail,
      passwordHash: await bcrypt.hash(password, 12), createdAt: new Date().toISOString()
    };
    await createUser(user);
    res.status(201).json({ message: "Account created. You can now log in.", user: publicUser(user) });
  } catch (error) {
    if (error.code === "EMAIL_EXISTS") return res.status(409).json({ message: error.message });
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password)
      return res.status(400).json({ message: "Enter your email and password." });
    const user = await findUserByEmail(email.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: "Invalid email or password." });

    req.session.regenerate(error => {
      if (error) return next(error);
      req.session.userId = user.id;
      req.session.save(saveError => {
        if (saveError) return next(saveError);
        res.json({ message: "Login successful.", user: publicUser(user) });
      });
    });
  } catch (error) { next(error); }
});

router.get("/me", async (req, res, next) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "You are not logged in." });
    const user = await findUserById(req.session.userId);
    if (!user) return req.session.destroy(() => res.status(401).json({ message: "Account not found. Please log in again." }));
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post("/logout", (req, res) => {
  if (!req.session) return res.json({ message: "Logged out." });
  req.session.destroy(error => {
    if (error) return res.status(500).json({ message: "Unable to log out." });
    res.clearCookie("banana.sid", {
      httpOnly: true, sameSite: "lax",
      secure: process.env.NODE_ENV === "production", path: "/"
    });
    res.json({ message: "Logged out successfully." });
  });
});
export default router;
