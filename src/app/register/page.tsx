"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deriveNameFromEmail } from "@/lib/deriveDisplayName";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [derived, setDerived] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setEmail(val);
    // Auto-derive name when email looks complete
    if (val.includes("@") && val.includes(".")) {
      const { first, last } = deriveNameFromEmail(val);
      if (first || last) {
        setFirstName(first);
        setLastName(last);
        setDerived(true);
      } else {
        setDerived(false);
      }
    } else {
      setDerived(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    setError("");

    const displayName = `${firstName.trim()} ${lastName.trim()}`;
    // Use email local part as username (sanitized)
    const username = email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();

    const res = await fetch("/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, displayName, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      username,
      password,
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
          <p className="small muted" style={{ marginBottom: 24 }}>
            Create an account to claim a spot and begin your field journal.
          </p>

          {error && (
            <div className="notice notice--error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="field">
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="you@dartmouth.edu"
                required
              />
              <span className="helper">
                Must be the email your instructor has on file.
              </span>
            </div>

            {/* Name fields — shown once email is entered */}
            <div className="field">
              <label className="label" htmlFor="firstName">
                First name
                {derived && (
                  <span className="helper" style={{ marginLeft: 8, fontWeight: 400 }}>
                    — derived from your email. Change it if you prefer a different name.
                  </span>
                )}
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Alex"
                required
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Taylor"
                required
              />
            </div>

            {firstName && lastName && (
              <div
                className="notice notice--success small"
                style={{ marginTop: -8 }}
              >
                Your name will appear as <strong>{firstName.trim()} {lastName.trim()}</strong> on the map and your journal.
              </div>
            )}

            <div className="field">
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
