// src/app/page.tsx
// Landing page — project introduction, invitation to join.

import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

export default async function HomePage() {
  const session = await auth();
  const activeTerm = await prisma.term.findFirst({ where: { status: "active" } });
  const spotCount = activeTerm
    ? await prisma.spot.count({ where: { termId: activeTerm.id } })
    : 0;

  return (
    <main className={styles.main}>
      {/* Hero */}
      <section className={styles.hero}>
        <p className={`${styles.eyebrow} mono muted fade-up`}>
          a field journal platform
        </p>
        <h1 className={`${styles.headline} fade-up-2`}>
          Slow down.<br />
          Look again.
        </h1>
        <p className={`${styles.sub} fade-up-3`}>
          Claim a single spot on the Dartmouth campus. Return to it all term.
          Record what you notice — in text, photos, sound, and video.
        </p>
        <div className={`${styles.cta} fade-up-3`}>
          {session?.user ? (
            <Link href="/map" className="btn btn--primary">
              open the map
            </Link>
          ) : (
            <>
              <Link href="/register" className="btn btn--primary">
                claim your spot
              </Link>
              <Link href="/browse" className="btn">
                browse observations
              </Link>
            </>
          )}
        </div>
        {activeTerm && (
          <p className={`${styles.termNote} tiny muted fade-up-3`}>
            {activeTerm.name} is active &mdash;{" "}
            {spotCount} spot{spotCount !== 1 ? "s" : ""} claimed so far
          </p>
        )}
      </section>

      {/* Pull quote */}
      <section className={styles.quote}>
        <blockquote className={styles.blockquote}>
          <p>
            "Practices of attention and curiosity are inherently open-ended,
            oriented toward something outside of ourselves."
          </p>
          <cite>— Jenny Odell, <em>How to Do Nothing</em></cite>
        </blockquote>
      </section>

      {/* How it works */}
      <section className={styles.how}>
        <div className="container">
          <h2 className={styles.howTitle}>How it works</h2>
          <div className={styles.steps}>
            {[
              {
                n: "01",
                title: "Claim a spot",
                body: "Drop a pin anywhere on the Dartmouth campus map. Name it specifically — not just 'a bench' but 'the bench facing east behind Collis, near the spruce.'",
              },
              {
                n: "02",
                title: "Return often",
                body: "Visit your spot multiple times a week. Bring nothing but attention. The value is in the returning.",
              },
              {
                n: "03",
                title: "Record what you notice",
                body: "Write timestamped observations. Attach photos, a short audio recording, or a video. Follow your curiosity wherever it leads.",
              },
              {
                n: "04",
                title: "Read each other",
                body: "All journals are public. The map shows where everyone is looking.",
              },
            ].map((s) => (
              <div key={s.n} className={styles.step}>
                <span className={`${styles.stepN} mono faint`}>{s.n}</span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={`${styles.stepBody} small muted`}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
