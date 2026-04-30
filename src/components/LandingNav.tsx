"use client";
// Discrete anchor links and rotating quote for the landing page hero

import { useState, useEffect } from "react";

const QUOTES = [
  {
    text: "Listen. Listen. Listen. We can never be too attentive to our world.",
    source: "Madison Smartt Bell",
    work: "Zero DB",
  },
  {
    text: "Siddhartha listened. He was now nothing but a listener, completely concentrated on listening, completely empty, he felt, that he had now finished learning to listen. Often before, he had heard all this, these many voices in the river, today it sounded new.",
    source: "Hermann Hesse",
    work: "Siddhartha",
  },
  {
    text: "We're riddled with pointless talk, insane quantities of words and images. Stupidity's never blind or mute. So it's not a problem of getting people to express themselves but of providing little gaps of solitude and silence in which they might eventually find something to say. What a relief to have nothing to say, the right to say nothing, because only then is there a chance of framing the rare, and ever rarer, thing that might be worth saying.",
    source: "Gilles Deleuze",
    work: "Negotiations",
  },
  {
    text: "Practices of attention and curiosity are inherently open-ended, oriented toward something outside of ourselves. Through attention and curiosity, we can suspend our tendency toward instrumental understanding—seeing things or people one-dimensionally as the products of their functions—and instead sit with the unfathomable fact of their existence, which opens up toward us but can never be fully grasped or known.",
    source: "Jenny Odell",
    work: "How to Do Nothing",
  },
  {
    text: "Millions of items of the outward order are present to my senses which never properly enter into my experience. Why? Because they have no interest for me. My experience is what I agree to attend to. Only those items which I notice shape my mind—without selective interest, experience is an utter chaos.",
    source: "William James",
    work: "The Principles of Psychology",
  },
  {
    text: "If we had a keen vision and feeling of all ordinary human life, it would be like hearing the grass grow and the squirrel's heart beat, and we should die of that roar which lies on the other side of silence. As it is, the quickest of us walk about well wadded with stupidity.",
    source: "George Eliot",
    work: "Middlemarch",
  },
  {
    text: "We experience the externalities of the attention economy in little drips, so we tend to describe them with words of mild bemusement like \"annoying\" or \"distracting.\" But this is a grave misreading of their nature. In the longer term, they can accumulate and keep us from living the lives we want to live, or, even worse, undermine our capacities for reflection and self-regulation, making it harder, in the words of Harry Frankfurt, to \"want what we want to want.\"",
    source: "James Williams",
    work: "",
  },
];

export function RotatingQuote() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % QUOTES.length);
        setFading(false);
      }, 600);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const q = QUOTES[idx];

  return (
    <blockquote
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 0.6s ease",
        maxWidth: 680,
        margin: "0 auto",
        padding: "0 24px",
        fontFamily: "var(--font-serif)",
        fontStyle: "italic",
        fontSize: 17,
        lineHeight: 1.8,
        color: "var(--ink-mid)",
      }}
    >
      <p style={{ marginBottom: 0 }}>&ldquo;{q.text}&rdquo;</p>
      <cite style={{ display: "block", marginTop: 16, fontSize: 13, fontStyle: "normal", color: "var(--ink-faint)", fontFamily: "var(--font-sans)" }}>
        &mdash; {q.source}{q.work ? <>, <em>{q.work}</em></> : ""}
      </cite>
    </blockquote>
  );
}

export function HeroNavLinks() {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div style={{
      position: "absolute",
      bottom: 64,
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      alignItems: "center",
      gap: 14,
      whiteSpace: "nowrap",
    }}>
      <button
        style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--green)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline", textDecorationColor: "var(--green)", textUnderlineOffset: 3, letterSpacing: "0.04em", textTransform: "uppercase" }}
        onClick={() => scrollTo("why-noticing")}
      >
        Why Noticing?
      </button>
      <span style={{ color: "var(--ink-faint)", fontSize: 11 }} aria-hidden="true">·</span>
      <button
        style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--green)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline", textDecorationColor: "var(--green)", textUnderlineOffset: 3, letterSpacing: "0.04em", textTransform: "uppercase" }}
        onClick={() => scrollTo("how-it-works")}
      >
        How It Works
      </button>
    </div>
  );
}
