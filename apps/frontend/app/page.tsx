"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiStatus, User, apiBaseUrl, createUser, getReadiness, listUsers } from "../src/lib/api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [users]
  );

  async function refreshUsers() {
    const nextUsers = await listUsers();
    setUsers(nextUsers);
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        await getReadiness();
        const nextUsers = await listUsers();

        if (isMounted) {
          setStatus("online");
          setUsers(nextUsers);
          setError(null);
        }
      } catch (caught) {
        if (isMounted) {
          setStatus("offline");
          setError(caught instanceof Error ? caught.message : "API unavailable");
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createUser({
        email,
        name: name.trim() || undefined
      });
      setEmail("");
      setName("");
      await refreshUsers();
      setStatus("online");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create user");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="shell">
      <section className="topbar" aria-label="Workspace status">
        <div>
          <p className="eyebrow">Tele</p>
          <h1>Development Console</h1>
        </div>
        <div className={`status ${status}`}>
          <span aria-hidden="true" />
          {status}
        </div>
      </section>

      <section className="summary-grid" aria-label="Environment summary">
        <div className="metric">
          <span>API</span>
          <strong>{apiBaseUrl}</strong>
        </div>
        <div className="metric">
          <span>Users</span>
          <strong>{users.length}</strong>
        </div>
        <div className="metric">
          <span>Database</span>
          <strong>{status === "online" ? "ready" : "pending"}</strong>
        </div>
      </section>

      <section className="workspace">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <h2>Create User</h2>
          </div>

          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
            />
          </label>

          <label>
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Optional"
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating" : "Create"}
          </button>

          {error ? <p className="error">{error}</p> : null}
        </form>

        <section className="panel list-panel" aria-label="Users">
          <div className="panel-heading">
            <h2>Users</h2>
            <button className="secondary" type="button" onClick={() => void refreshUsers()}>
              Refresh
            </button>
          </div>

          <div className="user-list">
            {sortedUsers.length === 0 ? (
              <div className="empty">No users</div>
            ) : (
              sortedUsers.map((user) => (
                <article className="user-row" key={user.id}>
                  <div>
                    <strong>{user.name ?? "Unnamed"}</strong>
                    <span>{user.email}</span>
                  </div>
                  <time dateTime={user.createdAt}>{formatDate(user.createdAt)}</time>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

