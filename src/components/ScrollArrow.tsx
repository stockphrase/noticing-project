"use client";

import styles from "@/app/page.module.css";

export default function ScrollArrow() {
  return (
    <button
      className={styles.scrollHint}
      aria-label="Scroll down"
      onClick={() => document.getElementById("why-noticing")?.scrollIntoView({ behavior: "smooth" })}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 7l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
