import { FormEvent, useEffect, useState } from "react";

import { api } from "../lib/api";
import type { CoordinatorSession } from "../types";

export function LoginPage() {
  const [session, setSession] = useState<CoordinatorSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void api<CoordinatorSession>("/api/auth/session")
      .then((currentSession) => {
        if (active) {
          setSession(currentSession);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load sign-in security information.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (session?.isAuthenticated) {
      window.location.replace("/");
    }
  }, [session]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!session?.requestToken) {
      setError(
        "Sign-in security information is unavailable. Reload and try again.",
      );
      return;
    }

    const form = new FormData(event.currentTarget);
    setSubmitting(true);

    try {
      await api<null>("/api/auth/login", {
        method: "POST",
        headers: { "X-CSRF-TOKEN": session.requestToken },
        body: JSON.stringify({
          username: String(form.get("username") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });

      const currentSession = await api<CoordinatorSession>("/api/auth/session");
      if (!currentSession.isAuthenticated) {
        throw new Error("Sign-in could not be completed. Please try again.");
      }

      window.location.assign("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <a className="brand login-brand" href="/">
          <span className="brand-mark">O</span>
          <span>
            OpenSlot<span className="brand-dot">.</span>
          </span>
        </a>
        <p className="eyebrow">COORDINATOR ACCESS</p>
        <h1>Welcome back.</h1>
        <p className="login-copy">
          Sign in to manage appointment availability.
        </p>

        {error && (
          <div className="message error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={(event) => void submit(event)}>
          <label>
            Username
            <input
              name="username"
              required
              maxLength={100}
              autoComplete="username"
              autoFocus
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              maxLength={200}
              autoComplete="current-password"
            />
          </label>
          <button
            className="button button-primary full"
            type="submit"
            disabled={loading || submitting || !session?.requestToken}
          >
            {loading ? "Loading…" : submitting ? "Signing in…" : "Log in"}
          </button>
        </form>

        <a className="login-back" href="/">
          Back to appointment availability
        </a>
      </section>
    </main>
  );
}
