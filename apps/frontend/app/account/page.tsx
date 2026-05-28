"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { User, getMe, updateMe } from "../../src/lib/api";
import { getSession, isAuthConfigured, signOut, startLogin } from "../../src/lib/auth";
import { formatDateTime } from "../../src/lib/format";

export default function AccountPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: ""
  });
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadAccount();
  }, []);

  async function loadAccount() {
    setIsLoading(true);
    setError(null);
    setNeedsSignIn(false);

    if (!isAuthConfigured()) {
      setCurrentUser(null);
      setError("Auth is not configured");
      setIsLoading(false);
      return;
    }

    if (!getSession()) {
      setCurrentUser(null);
      setNeedsSignIn(true);
      setIsLoading(false);
      return;
    }

    try {
      const user = await getMe();

      setCurrentUser(user);
      setProfileForm({
        name: user.name ?? "",
        phone: user.phone ?? ""
      });
    } catch (caught) {
      setCurrentUser(null);
      setError(caught instanceof Error ? caught.message : "Could not load account");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("profile");
    setError(null);

    try {
      const user = await updateMe({
        name: profileForm.name.trim() || null,
        phone: profileForm.phone.trim() || null
      });
      setCurrentUser(user);
      setProfileForm({
        name: user.name ?? "",
        phone: user.phone ?? ""
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update profile");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="shell">
      <section className="topbar" aria-label="Account navigation">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Account</h1>
        </div>
        <div className="nav-actions">
          <Link className="nav-link" href="/">
            Shop
          </Link>
        </div>
      </section>

      {error ? <p className="error global-error">{error}</p> : null}

      {needsSignIn ? (
        <section className="panel account-sign-in" aria-label="Sign in">
          <div>
            <p className="eyebrow">Sign in required</p>
            <h2>Manage your account</h2>
          </div>
          <div className="auth-actions">
            <button type="button" onClick={() => void startLogin()}>
              Sign In
            </button>
            <Link className="nav-link" href="/auth/confirm">
              Confirm Account
            </Link>
          </div>
        </section>
      ) : null}

      {!currentUser && isLoading ? (
        <section className="panel">
          <div className="empty-state compact">Loading account</div>
        </section>
      ) : null}

      {currentUser ? (
        <>
          <section className="summary-grid" aria-label="Account summary">
            <div className="metric wide">
              <span>Signed In</span>
              <strong>{currentUser.email}</strong>
            </div>
            <div className="metric">
              <span>Name</span>
              <strong>{currentUser.name ?? "Not Set"}</strong>
            </div>
            <div className="metric">
              <span>Phone</span>
              <strong>{currentUser.phone ?? "Not Set"}</strong>
            </div>
            <div className="metric">
              <span>Customer Since</span>
              <strong>{formatDateTime(currentUser.createdAt)}</strong>
            </div>
          </section>

          <section className="account-layout">
            <section className="panel account-profile" aria-label="Profile">
              <div className="panel-heading">
                <h2>Profile</h2>
              </div>
              <dl className="order-meta">
                <div>
                  <dt>Email</dt>
                  <dd>{currentUser.email}</dd>
                </div>
                <div>
                  <dt>Name</dt>
                  <dd>{currentUser.name ?? "Not set"}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{currentUser.phone ?? "Not set"}</dd>
                </div>
                <div>
                  <dt>Customer Since</dt>
                  <dd>{formatDateTime(currentUser.createdAt)}</dd>
                </div>
              </dl>
              <form className="checkout-form" onSubmit={handleProfileSubmit}>
                <label>
                  <span>Name</span>
                  <input
                    value={profileForm.name}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                    placeholder="Customer name"
                  />
                </label>
                <label>
                  <span>Phone</span>
                  <input
                    value={profileForm.phone}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        phone: event.target.value
                      }))
                    }
                    placeholder="555-0100"
                  />
                </label>
                <button type="submit" disabled={pendingAction === "profile"}>
                  {pendingAction === "profile" ? "Saving" : "Save Profile"}
                </button>
              </form>
            </section>

            <section className="panel account-actions-panel" aria-label="Account actions">
              <div className="panel-heading">
                <h2>Account Tools</h2>
              </div>
              <div className="account-action-list">
                <Link className="nav-link account-action-link" href="/orders">
                  <span>Your Orders</span>
                  <strong>View order history and tracking</strong>
                </Link>
                <Link className="nav-link account-action-link" href="/addresses">
                  <span>Addresses</span>
                  <strong>Manage shipping and billing addresses</strong>
                </Link>
                <button className="secondary account-sign-out-button" type="button" onClick={signOut}>
                  Sign Out
                </button>
              </div>
            </section>
          </section>
        </>
      ) : null}
    </main>
  );
}
