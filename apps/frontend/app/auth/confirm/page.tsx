"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { confirmSignUp, isAuthConfigured, resendSignUpConfirmation, startLogin } from "../../../src/lib/auth";

export default function AuthConfirmPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"confirm" | "resend" | null>(null);

  useEffect(() => {
    setEmail(new URLSearchParams(window.location.search).get("email") ?? "");
  }, []);

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("confirm");
    setStatus(null);
    setError(null);

    try {
      await confirmSignUp(email.trim(), code.trim());
      setStatus("Account confirmed. Sign in to continue.");
      setCode("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not confirm account");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleResend() {
    setPendingAction("resend");
    setStatus(null);
    setError(null);

    try {
      await resendSignUpConfirmation(email.trim());
      setStatus("Confirmation code sent.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not resend confirmation code");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="shell narrow-shell">
      <section className="panel">
        <div className="panel-heading">
          <h1>Confirm Account</h1>
          <Link className="nav-link" href="/">
            Home
          </Link>
        </div>

        {!isAuthConfigured() ? (
          <div className="empty-state compact">Cognito is not configured</div>
        ) : (
          <form className="auth-form" onSubmit={handleConfirm}>
            <label>
              Email
              <input
                autoComplete="email"
                inputMode="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Confirmation Code
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </label>

            <div className="auth-actions">
              <button type="submit" disabled={pendingAction === "confirm"}>
                Confirm
              </button>
              <button className="secondary" type="button" disabled={!email || pendingAction === "resend"} onClick={handleResend}>
                Resend
              </button>
              <button className="secondary" type="button" onClick={() => void startLogin()}>
                Sign In
              </button>
            </div>

            {status ? <p className="notice">{status}</p> : null}
            {error ? <p className="error">{error}</p> : null}
          </form>
        )}
      </section>
    </main>
  );
}
