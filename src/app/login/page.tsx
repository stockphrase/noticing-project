"use client";
// src/app/login/page.tsx

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    params.get("error") ? "Incorrect username or password." : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    if (res?.ok) {
      router.push("/map");
    } else {
      setError("Incorrect username or password.");
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <div className={`${styles.card} card fade-up`}>
        <div className={styles.brand}>
          <span className="nav-dot" />
          <div>
            <div className={styles.brandTitle}>The Noticing Project</div>
            <div className={`${styles.brandSub} faint tiny`}>Dartmouth College</div>
          </div>
        </div>

        <h1 className={styles.heading}>Welcome back</h1>
        <p className={`${styles.sub} small muted`}>
          Sign in to add observations and tend to your spot.
        </p>

        {error && <div className="notice notice--error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="field">
            <label className="label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className={styles.footer}>
          <span className="small muted">New here?</span>{" "}
          <Link href="/register" className="small" style={{ color: "var(--green)" }}>
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
