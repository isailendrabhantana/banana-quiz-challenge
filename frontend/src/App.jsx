import { useCallback, useEffect, useState } from "react";

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed.");
    error.data = data;
    throw error;
  }

  return data;
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      if (mode === "register") {
        await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ username, email, password }),
        });

        setNotice("Account created. Log in with your new credentials.");
        setMode("login");
        setPassword("");
      } else {
        const data = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="hero">
        <div className="banana-mark">🍌</div>

        <p className="eyebrow">THINK · SOLVE · SCORE</p>

        <h1>
          Banana Quiz
          <br />
          <span>Challenge</span>
        </h1>

        <p className="hero-copy">
          A little logic, a little fun. Sign in and see how many puzzles you can
          solve.
        </p>

        <div className="pills">
          <span>10 puzzles</span>
          <span>100 points possible</span>
        </div>
      </section>

      <section className="auth-card">
        <div className="tabs">
          <button
            type="button"
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => {
              setMode("login");
              setError("");
              setNotice("");
            }}
          >
            Log in
          </button>

          <button
            type="button"
            className={mode === "register" ? "tab active" : "tab"}
            onClick={() => {
              setMode("register");
              setError("");
              setNotice("");
            }}
          >
            Create account
          </button>
        </div>

        <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>

        <p className="muted">
          {mode === "login"
            ? "Enter your details to continue."
            : "It takes a moment to get started."}
        </p>

        <form className="form" onSubmit={submit}>
          {mode === "register" && (
            <label>
              Username
              <input
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength="2"
                maxLength="40"
                required
                placeholder="Your display name"
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength="8"
              maxLength="128"
              required
              placeholder="At least 8 characters"
            />
          </label>

          {error && (
            <p className="message error" role="alert">
              {error}
            </p>
          )}

          {notice && (
            <p className="message success" role="status">
              {notice}
            </p>
          )}

          <button className="primary wide" type="submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Log in →"
                : "Create account →"}
          </button>
        </form>

        <p className="footnote">Your password is hashed before it is stored.</p>
      </section>
    </main>
  );
}

function DifficultyScreen({ user, onSelect, onLogout }) {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);

    try {
      await api("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({}),
      });

      onLogout();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  const options = [
    {
      value: "easy",
      title: "Easy",
      seconds: 25,
      level: "BEGINNER",
      icon: "🌱",
      description: "Take your time and warm up.",
    },
    {
      value: "intermediate",
      title: "Intermediate",
      seconds: 20,
      level: "MODERATE",
      icon: "⚡",
      description: "A little more pressure.",
    },
    {
      value: "hard",
      title: "Hard",
      seconds: 15,
      level: "EXPERT",
      icon: "🔥",
      description: "Think fast. Beat the clock.",
    },
  ];

  return (
    <main className="quiz-page difficulty-page">
      <nav className="topbar">
        <a className="brand" href="/">
          🍌 Banana Quiz
        </a>

        <div className="user-menu">
          <span className="avatar">
            {user.username.slice(0, 1).toUpperCase()}
          </span>

          <span className="username">{user.username}</span>

          <button className="ghost" onClick={logout} disabled={busy}>
            {busy ? "Logging out…" : "Log out"}
          </button>
        </div>
      </nav>

      <section className="difficulty-card">
        <p className="eyebrow difficulty-eyebrow">
          <span className="eyebrow-dot" />
          CHOOSE YOUR CHALLENGE
        </p>

        <h1>
          How sharp is your <span>mind?</span>
        </h1>

        <p className="difficulty-intro">
          Choose your difficulty and solve each banana puzzle before time runs
          out. Every second counts!
        </p>

        <div className="difficulty-grid">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`difficulty-option difficulty-${option.value}`}
              onClick={() => onSelect(option.value)}
              disabled={busy}
            >
              <span className="difficulty-option-top">
                <span className="difficulty-icon" aria-hidden="true">
                  {option.icon}
                </span>

                <span className="difficulty-level">{option.level}</span>
              </span>

              <span className="difficulty-title">{option.title}</span>

              <span className="difficulty-time">
                {option.seconds}
                <span> sec</span>
              </span>

              <span className="difficulty-description">
                {option.description}
              </span>

              <span className="difficulty-select">
                Start challenge
                <span aria-hidden="true">→</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <footer className="footer difficulty-footer">
        <span aria-hidden="true">⏱</span> One puzzle at a time. Keep going. 🍌
      </footer>
    </main>
  );
}

function QuizScreen({ user, difficulty, onLogout, onChangeDifficulty }) {
  const [quizId, setQuizId] = useState("");
  const [image, setImage] = useState("");
  const [number, setNumber] = useState(1);
  const [total, setTotal] = useState(10);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [answered, setAnswered] = useState(false);
  const [complete, setComplete] = useState(false);
  const [source, setSource] = useState("banana-api");
  const [deadlineAt, setDeadlineAt] = useState(0);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25);
  const [timingOut, setTimingOut] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const applyQuestion = useCallback((data) => {
    setQuizId(data.quizId);
    setImage(data.questionImage);
    setNumber(data.questionNumber);
    setTotal(data.totalQuestions);
    setScore(data.score);
    setSource(data.source || "banana-api");
    setDeadlineAt(data.deadlineAt);
    setTimeLimitSeconds(data.timeLimitSeconds);
    setTimeLeft(data.timeLimitSeconds);
    setAnswer("");
    setFeedback("");
    setAnswered(false);
    setComplete(false);
    setTimingOut(false);
  }, []);

  const start = useCallback(async () => {
    setBusy(true);
    setError("");

    try {
      const data = await api("/api/quiz/start", {
        method: "POST",
        body: JSON.stringify({ difficulty }),
      });

      applyQuestion(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [applyQuestion, difficulty]);

  useEffect(() => {
    start();
  }, [start]);

  const timeoutQuestion = useCallback(async () => {
    if (answered || complete || timingOut || !quizId) return;

    setTimingOut(true);
    setBusy(true);
    setError("");

    try {
      const data = await api("/api/quiz/timeout", {
        method: "POST",
        body: JSON.stringify({ quizId }),
      });

      setScore(data.score);
      setFeedback(data.message);
      setAnswered(true);
      setComplete(data.completed);
    } catch (err) {
      if (
        !String(err.message).toLowerCase().includes("already been answered")
      ) {
        setError(err.message);
      }
    } finally {
      setTimingOut(false);
      setBusy(false);
    }
  }, [answered, complete, timingOut, quizId]);

  useEffect(() => {
    if (!deadlineAt || answered || complete) return;

    const tick = () => {
      const remaining = Math.max(0, deadlineAt - Date.now());

      setTimeLeft(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        timeoutQuestion();
      }
    };

    tick();

    const interval = window.setInterval(tick, 200);

    return () => window.clearInterval(interval);
  }, [deadlineAt, answered, complete, timeoutQuestion]);

  async function submit(e) {
    e.preventDefault();

    if (!answer.trim()) {
      setFeedback("Enter a number before submitting.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const data = await api("/api/quiz/answer", {
        method: "POST",
        body: JSON.stringify({ quizId, answer }),
      });

      setScore(data.score);
      setFeedback(data.message);
      setAnswered(true);
      setComplete(data.completed);
    } catch (err) {
      setError(err.message);

      if (err.message.includes("Time is up")) {
        setAnswered(true);
        setComplete(Boolean(err.data?.completed));
        setFeedback(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    setBusy(true);
    setError("");

    try {
      const data = await api("/api/quiz/next", {
        method: "POST",
        body: JSON.stringify({ quizId }),
      });

      applyQuestion(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);

    try {
      await api("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({}),
      });

      onLogout();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const timerPercent = Math.max(
    0,
    Math.min(100, (timeLeft / timeLimitSeconds) * 100),
  );

  const timerClass =
    timeLeft <= 5
      ? "timer danger"
      : timeLeft <= Math.ceil(timeLimitSeconds / 3)
        ? "timer warning"
        : "timer";

  return (
    <main className="quiz-page">
      <nav className="topbar">
        <a className="brand" href="/">
          🍌 Banana Quiz
        </a>

        <div className="user-menu">
          <span className="avatar">
            {user.username.slice(0, 1).toUpperCase()}
          </span>

          <span className="username">{user.username}</span>

          <button className="ghost" onClick={logout} disabled={busy}>
            Log out
          </button>
        </div>
      </nav>

      <header className="quiz-heading">
        <p className="eyebrow">
          {difficulty.toUpperCase()} MODE · {timeLimitSeconds} SECONDS
        </p>

        <h1>Ready to crack the puzzle?</h1>

        <p className="muted">Every correct answer earns 10 points.</p>
      </header>

      {error && (
        <p className="message error global-error" role="alert">
          {error}
        </p>
      )}

      {busy && !image && !complete ? (
        <section className="quiz-card loading">
          <div className="spinner" />
          <p>Preparing your quiz…</p>
        </section>
      ) : complete ? (
        <section className="quiz-card result">
          <div className="result-emoji">🏆</div>

          <p className="eyebrow">CHALLENGE COMPLETE</p>

          <h2>Look at you go!</h2>

          <p className="muted">You finished all {total} questions.</p>

          <div className="big-score">
            {score}
            <span> / {total * 10}</span>
          </div>

          <p className="muted">
            {score === 100
              ? "Perfect score. Brilliant work!"
              : score >= 70
                ? "Great effort. Keep sharpening those skills!"
                : "Every puzzle is practice. Give it another go!"}
          </p>

          <div className="result-actions">
            <button className="primary" onClick={start} disabled={busy}>
              Play again ↻
            </button>

            <button
              className="ghost"
              onClick={onChangeDifficulty}
              disabled={busy}
            >
              Change difficulty
            </button>
          </div>
        </section>
      ) : (
        <section className="quiz-card">
          <div className="card-top">
            <span>
              QUESTION <strong>{number}</strong>{" "}
              <span className="muted">/ {total}</span>
            </span>

            <span className="score-chip">✦ {score} points</span>
          </div>

          <div className="progress">
            <div
              style={{
                width: `${((number - 1) / total) * 100}%`,
              }}
            />
          </div>

          <div className={timerClass} role="timer" aria-live="polite">
            <span>TIME LEFT</span>
            <strong>{timeLeft}s</strong>
          </div>

          <div className="timer-track">
            <div style={{ width: `${timerPercent}%` }} />
          </div>

          {source === "demo-fallback" && (
            <p className="demo-note">
              Demo puzzle mode — the external Banana API is unavailable.
            </p>
          )}

          {image && (
            <div className="puzzle-frame">
              <img
                className="puzzle-image"
                src={image}
                alt={`Puzzle ${number}`}
              />
            </div>
          )}

          <form className="answer-form" onSubmit={submit}>
            <label htmlFor="answer">What is your answer?</label>

            <div className="answer-row">
              <input
                id="answer"
                type="number"
                step="1"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type a number…"
                required
                disabled={answered || busy}
              />

              <button
                className="primary"
                type="submit"
                disabled={answered || busy}
              >
                {busy ? "Checking…" : "Submit answer"}
              </button>
            </div>
          </form>

          {feedback && (
            <p
              className={
                feedback.startsWith("Correct")
                  ? "message success feedback"
                  : "message feedback"
              }
              role="status"
              aria-live="polite"
            >
              {feedback}
            </p>
          )}

          {answered && !complete && (
            <button className="primary next" onClick={next} disabled={busy}>
              Next puzzle →
            </button>
          )}

          {error && (
            <button className="ghost" onClick={start} disabled={busy}>
              Start a new quiz
            </button>
          )}
        </section>
      )}

      <footer className="footer">One puzzle at a time. Keep going. 🍌</footer>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    api("/api/auth/me")
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="session-loading">
        <div className="spinner" />
        <p>Checking your session…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  if (!difficulty) {
    return (
      <DifficultyScreen
        user={user}
        onSelect={setDifficulty}
        onLogout={() => setUser(null)}
      />
    );
  }

  return (
    <QuizScreen
      user={user}
      difficulty={difficulty}
      onChangeDifficulty={() => setDifficulty(null)}
      onLogout={() => {
        setDifficulty(null);
        setUser(null);
      }}
    />
  );
}
