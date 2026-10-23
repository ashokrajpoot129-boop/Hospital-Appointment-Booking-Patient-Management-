import { useState } from "react";

function Login({ onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onAuthenticated(email.trim());
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <header className="login-welcome">
          <h1>Welcome to Multiple Hospital Login</h1>
        </header>
        <section className="login-card" aria-labelledby="login-heading">
          <div className="login-card-brand">
            <img className="login-brand-logo" src="/logo.jpg" alt="" />
            <span>Multiple Hospital</span>
          </div>
          <div className="login-card-content">
            <h2 id="login-heading">Admin Sign In</h2>
            <p className="login-description">
              Enter your hospital email and password to access your account.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="input-group login-input-group">
                <label htmlFor="login-email">Email Address</label>
                <span className="login-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 20a7 7 0 0 1 14 0" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your hospital email"
                />
              </div>
              <div className="input-group login-input-group">
                <label htmlFor="login-password">Password</label>
                <span className="login-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="10" width="14" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                />
                <button
                  className="password-visibility-button"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.5 0 9 7 9 7a15 15 0 0 1-3.1 3.8M6.2 6.2C4.1 7.6 3 12 3 12s3.5 7 9 7a10 10 0 0 0 3-.5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <button className="login-submit-button" type="submit">
                Sign In <span aria-hidden="true">↗</span>
              </button>
            </form>
            <div className="login-divider"><span>Local demo access</span></div>
            <div className="secure-access">
              Sign in with any email and password. No server is used.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
