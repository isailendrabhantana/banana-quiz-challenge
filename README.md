# Banana Quiz Challenge

Full-stack React + Express quiz project with registration, login/logout, server-managed sessions, password hashing, Banana API integration, per-user quiz ownership, scoring, event-driven backend logging, validation, and a responsive interface.

## Requirements
Node.js 20+ and npm.

## Run locally
From this folder:
```bash
npm run install:all
npm run dev
```
Open the Vite URL shown in the terminal (usually http://localhost:5173). Backend API runs on http://localhost:5000.

Production-style local run:
```bash
npm run install:all
npm run build
npm start
```
Then open http://localhost:5000.

## Features
- Registration with username, email, password validation.
- Passwords hashed using bcryptjs; plaintext passwords are never saved.
- Session cookie is HTTP-only, SameSite=Lax; login regenerates the session.
- Session restore through `GET /api/auth/me`; logout destroys the session.
- Quiz endpoints require authentication and each quiz belongs to its creator.
- Ten questions, 10 points per correct answer, answer lock, next-question guard, final score and replay.
- Banana API is called by the backend. The solution is never returned to the browser.
- If the external API is unavailable, a visible demo puzzle fallback keeps the app usable.
- Node.js EventEmitter logs quiz start, answer, and completion events.
- Automated basic rule tests: `npm test`.

## Storage and deployment notes
For simplicity and portability, user records are stored in `backend/data/users.json`; sessions are stored in `backend/sessions`. Quiz state is in memory and resets when the server restarts. This is a student-project implementation, not production-grade storage. Before deployment, set a strong `SESSION_SECRET`, use HTTPS, secure cookies, and a persistent database/session store. The local fallback secret is only for development.

## Assignment evidence
1. Git/GitHub: initialize Git and make separate meaningful commits; this ZIP does not contain a pre-existing remote GitHub history.
2. Interoperability: show the backend Banana API call and response, then show `/api/quiz/start` returns `questionImage` but not `solution`.
3. Event-driven programming: explain React submit/click events and backend EventEmitter events.
4. Authentication/session: demonstrate register, login, page refresh session restoration, protected quiz endpoints, and logout.
5. Test validation, duplicate email, invalid login, duplicate answer, next-question guard, API fallback, and unauthenticated access.
6. Record your own presentation and voice; acknowledge AI assistance according to your module rules.
