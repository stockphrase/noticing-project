"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function NavClient() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        <span className="nav-dot" />
        <div>
          <div className="nav-title">The Noticing Project</div>
          <div className="nav-sub">Dartmouth College</div>
        </div>
      </Link>

      <div className="nav-right">
        {status === "loading" ? null : user ? (
          <>
            <Link href="/map" className="btn btn--ghost small">map</Link>
            <Link href="/browse" className="btn btn--ghost small">browse</Link>
            <button
              className="btn btn--ghost small"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn--ghost small">sign in</Link>
            <Link href="/register" className="btn btn--primary small">join</Link>
          </>
        )}
      </div>
    </nav>
  );
}