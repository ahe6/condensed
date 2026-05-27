"use client";

import { useEffect, useRef, useState } from "react";
import { completeLogin } from "../../../src/lib/auth";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const didStart = useRef(false);

  useEffect(() => {
    if (didStart.current) {
      return;
    }

    didStart.current = true;

    async function finishLogin() {
      try {
        await completeLogin(new URLSearchParams(window.location.search));
        window.location.replace("/");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not complete login");
      }
    }

    void finishLogin();
  }, []);

  return (
    <main className="shell narrow-shell">
      <section className="panel">
        <div className="panel-heading">
          <h1>Signing in</h1>
        </div>
        {error ? <p className="error">{error}</p> : <p className="muted-text">Completing Cognito login.</p>}
      </section>
    </main>
  );
}
