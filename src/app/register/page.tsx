"use client";
// src/app/register/page.tsx

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    // Auto sign-in after successful registration
    await signIn("credentials", {
      username: form.username,
      password: form.password,
      redirect: false,
    });
    router.push("/map");
  }

  return (
    <main className={styles.main}>
      <div className={styles.layout}>
        <div className={`${styles.card} card fade-up`}>
          <div className={styles.brand}>
            <span className="nav-dot" />
            <div>
              <div className={styles.brandTitle}>The Noticing Project</div>
              <div className="faint tiny">Dartmouth College</div>
            </div>
          </div>

          <h1 className={styles.heading}>Join the project</h1>
          <p className={`small muted`} style={{ marginBottom: 24 }}>
            Create an account to claim a spot and begin your field journal.
          </p>

          {error && (
            <div className="notice notice--error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="field">
              <label className="label" htmlFor="displayName">Full name</label>
              <input
                id="displayName"
                type="text"
                value={form.displayName}
                onChange={(e) => update("displayName", e.target.value)}
                placeholder="e.g. Asha Jensen"
                required
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@dartmouth.edu"
                required
              />
              <span className="helper">Must be the email your instructor has on file.</span>
            </div>
            <div className="field">
              <label className="label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(e) =>
                  update("username", e.target.value.toLowerCase().replace(/\s/g, ""))
                }
                placeholder="e.g. ajensen"
                required
              />
              <span className="helper">Shown publicly on your journal and the map.</span>
            </div>
            <div className="field">
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="8+ characters"
                minLength={8}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className={styles.footer}>
            <span className="small muted">Already have an account?</span>{" "}
            <Link href="/login" className="small" style={{ color: "var(--green)" }}>
              Sign in
            </Link>
          </div>
        </div>

        {/* What happens next sidebar */}
        <div className={`${styles.aside} fade-up-2`}>
          <p className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 20 }}>
            After you register
          </p>
          <div className={styles.steps}>
            {[
              { n: "1", text: "Choose a spot anywhere on the Dartmouth campus map" },
              { n: "2", text: "Give it a precise, descriptive name" },
              { n: "3", text: "Return often. Post timestamped observations in text, photos, audio, or video" },
              { n: "4", text: "Your journal is public — others can read your field notes" },
            ].map((s) => (
              <div key={s.n} className={styles.step}>
                <span className={styles.stepN}>{s.n}</span>
                <p className="small muted">{s.text}</p>
              </div>
            ))}
          </div>
          <div className={styles.openNote}>
            <p className="small muted">
              <strong style={{ color: "var(--ink-mid)" }}>Open to the community.</strong>{" "}
              Faculty, staff, and alumni are welcome to participate.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
