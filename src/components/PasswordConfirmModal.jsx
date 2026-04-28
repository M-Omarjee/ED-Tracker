import { useState, useEffect, useRef } from "react";
import { verifyPassword } from "../lib/auth";

/**
 * Generic re-authentication modal. Used to require a password
 * confirmation before any signed clinical action (note submission,
 * NEWS entry, bloods entry, etc.).
 *
 * Props:
 *   user        - the currentUser object { username, name, role }
 *   action      - short label, e.g. "sign this note"
 *   onCancel    - close without proceeding
 *   onConfirmed - called once password verifies; the parent then
 *                 performs the actual action
 */
function PasswordConfirmModal({ user, action, onCancel, onConfirmed }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Allow Escape to cancel
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setVerifying(true);

    // Brief delay to feel deliberate (not instant) — clinical UX
    setTimeout(() => {
      const ok = verifyPassword(user.username, password);
      if (!ok) {
        setError("Password incorrect. Please try again.");
        setVerifying(false);
        setPassword("");
        inputRef.current?.focus();
        return;
      }
      setVerifying(false);
      onConfirmed();
    }, 120);
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-card"
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detail-header">
          <h2>Verify identity</h2>
          <button onClick={onCancel} type="button">
            Close
          </button>
        </div>

        <p className="confirm-tagline">
          Re-enter your password to {action} as{" "}
          <strong>{user.name}</strong> ({user.role}).
        </p>

        <form onSubmit={handleSubmit} className="confirm-form">
          <label className="login-field">
            <span>Password</span>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={verifying}
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <div className="confirm-actions">
            <button
              type="button"
              className="ghost-btn-dark"
              onClick={onCancel}
              disabled={verifying}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={verifying || !password}
            >
              {verifying ? "Verifying…" : "Verify & sign"}
            </button>
          </div>
        </form>

        <div className="confirm-disclaimer">
          🔒 Clinical entries are signed and cannot be edited or deleted
          once submitted.
        </div>
      </div>
    </div>
  );
}

export default PasswordConfirmModal;