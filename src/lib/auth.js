/**
 * Demo authentication for ED-Tracker portfolio.
 *
 * IMPORTANT: This is intentionally simplified for portfolio purposes.
 * Passwords are stored in cleartext in this file. A production deployment
 * would use:
 *   - A real backend (Vercel KV, Postgres, etc.)
 *   - bcrypt-hashed passwords
 *   - JWT or session-cookie based authentication with refresh
 *   - HTTPS-only secure cookies
 *
 * The architecture here (login -> session -> attributed actions -> logout)
 * is the same shape as a real implementation. Only the credential check
 * is simplified.
 */

export const DEMO_USERS = [
    {
      username: "drpatel",
      password: "demo123",
      name: "Dr A. Patel",
      role: "Doctor",
    },
    {
      username: "drwilliams",
      password: "demo123",
      name: "Dr S. Williams",
      role: "Doctor",
    },
    {
      username: "nursekhan",
      password: "demo123",
      name: "Nurse F. Khan",
      role: "Nurse",
    },
    {
      username: "hcasmith",
      password: "demo123",
      name: "HCA J. Smith",
      role: "HCA",
    },
  ];
  
  const SESSION_KEY = "ed-tracker-session-v1";
  
  /**
   * Validate a login attempt against the demo user list.
   * @returns The user object (without password) on success, or null.
   */
  export function validateLogin(username, password) {
    const u = String(username || "").trim().toLowerCase();
    const p = String(password || "");
    const match = DEMO_USERS.find(
      (user) => user.username === u && user.password === p
    );
    if (!match) return null;
    // Strip password before returning — we never want it in app state
    const { password: _pw, ...safe } = match;
    return safe;
  }
  
  /**
   * Read the persisted session from localStorage, or null.
   */
  export function loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.username || !parsed.name || !parsed.role) return null;
      return parsed;
    } catch (err) {
      console.warn("Failed to load session", err);
      return null;
    }
  }
  
  export function saveSession(user) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (err) {
      console.warn("Failed to save session", err);
    }
  }
  
  export function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (err) {
      console.warn("Failed to clear session", err);
    }
  }