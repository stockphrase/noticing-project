// src/app/page.tsx

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

      <section className={styles.hero}>
        <div className={styles.heroInner}>
        <p className={`${styles.eyebrow} mono muted fade-up`}>
          a field journal platform &middot; Dartmouth College
        </p>
        <h1 className={`${styles.headline} fade-up-2`}>
          Slow down.<br />
          Look again.
        </h1>
        <p className={`${styles.sub} fade-up-3`}>
          Claim a single spot on campus. Return to it all term.
          Record what you notice &mdash; in writing, photos, sound, and video.
        </p>
        <div className={`${styles.cta} fade-up-3`}>
          {session?.user ? (
            <Link href="/map" className="btn btn--primary">open the map</Link>
          ) : (
            <>
              <Link href="/register" className="btn btn--primary">claim your spot</Link>
              <Link href="/browse" className="btn">browse observations</Link>
            </>
          )}
        </div>
        {activeTerm && (
          <p className={`${styles.termNote} tiny muted fade-up-3`}>
            {activeTerm.name} is active &mdash;{" "}
            {spotCount} spot{spotCount !== 1 ? "s" : ""} claimed so far
          </p>
        )}
        </div>{/* /heroInner */}
        <button
          className={styles.scrollHint}
          aria-label="Scroll down"
          onClick={() => document.getElementById("why-noticing")?.scrollIntoView({ behavior: "smooth" })}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 7l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>

      <section className={styles.rationale} id="why-noticing">
        <div className={styles.rationaleInner}>
          <h2 className={styles.rationaleTitle}>Why noticing?</h2>
          <div className={styles.rationaleBody}>
            <p>
              We live in what scholars and technologists call an &ldquo;attention economy&rdquo; &mdash;
              an environment in which our focus has become a valuable resource that countless apps,
              advertisements, and platforms compete to capture. When attention is treated as a currency,
              the rhythm of daily life tends toward speed: we glance rather than gaze, skim rather than
              read, and move on before we have fully arrived.
            </p>
            <p>
              This project invites you to step temporarily outside that accelerated rhythm and practice{" "}
              <em>slow looking</em> &mdash; returning again and again to a single, seemingly unremarkable
              place and documenting what reveals itself through patient, persistent observation. The goal
              is not to reject technology or modern life, but to cultivate a complementary skill: the
              ability to direct your attention deliberately, to sit with what you see without rushing
              toward a conclusion, and to discover what emerges when you give a small corner of the world
              your sustained, unhurried, and contemplative gaze.
            </p>
            <p>
              What do you see? What do you see if you look and look and look again? What has changed
              since your last visit? What did you fail to notice before?
            </p>
          </div>
        </div>
      </section>

      <section className={styles.quote}>
        <blockquote className={styles.blockquote}>
          <p>
            &ldquo;Practices of attention and curiosity are inherently open-ended, oriented toward
            something outside of ourselves. Through attention and curiosity, we can suspend our tendency
            toward instrumental understanding and instead sit with the unfathomable fact of their
            existence.&rdquo;
          </p>
          <cite>&mdash; Jenny Odell, <em>How to Do Nothing</em></cite>
        </blockquote>
      </section>

      <section className={styles.how}>
        <div className="container">
          <h2 className={styles.howTitle}>How it works</h2>
          <div className={styles.steps}>
            {[
              {
                n: "01",
                title: "Claim a spot",
                body: "Drop a pin anywhere on the Dartmouth campus map. Name it precisely — not just 'a bench' but 'the bench facing east behind Collis, near the spruce.' Specificity commits you to a place.",
              },
              {
                n: "02",
                title: "Return often",
                body: "Visit multiple times a week. Choose a separate location away from your everyday routine and treat each visit as fieldwork.",
              },
              {
                n: "03",
                title: "Record what you notice",
                body: "Write timestamped observations. Attach photos, a short field recording, or a video. Follow your curiosity — observations may lead to research.",
              },
              {
                n: "04",
                title: "Read each other",
                body: "All journals are public. The map shows where everyone is looking. What does it mean to pay close attention to a place?",
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
