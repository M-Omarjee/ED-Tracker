import { useState } from "react";
import { validateLogin, DEMO_USERS } from "../lib/auth";

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showDemoCreds, setShowDemoCreds] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const user = validateLogin(username, password);
    if (!user) {
      setError("Invalid username or password.");
      return;
    }
    onLogin(user);
  };

  const useDemo = (u) => {
    setUsername(u.username);
    setPassword("demo123");
    setError("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>ED Tracker</h1>
          <p className="login-tagline">Sign in to access the department</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="primary-btn login-submit">
            Sign in
          </button>
        </form>

        <div className="login-demo">
          <button
            type="button"
            className="link-btn"
            onClick={() => setShowDemoCreds((v) => !v)}
          >
            {showDemoCreds ? "Hide demo accounts" : "Show demo accounts"}
          </button>

          {showDemoCreds && (
            <div className="demo-list">
              <p className="demo-note">
                This is a portfolio demo. Click any account to autofill, then
                Sign in. All passwords are{" "}
                <code>demo123</code>.
              </p>
              <ul>
                {DEMO_USERS.map((u) => (
                  <li key={u.username}>
                    <button
                      type="button"
                      className="demo-user-btn"
                      onClick={() => useDemo(u)}
                    >
                      <span className="demo-user-name">{u.name}</span>
                      <span className="demo-user-role">{u.role}</span>
                      <span className="demo-user-username">
                        @{u.username}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="demo-disclaimer">
                ⚠️ Demo auth only. A production deployment would use a
                backend with bcrypt-hashed passwords and JWT sessions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;