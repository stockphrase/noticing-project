"use client";
// src/components/MarkdownBody.tsx
// Renders journal entry text as markdown.
// Uses a lightweight hand-rolled parser — no dependencies needed.
// Supports: **bold**, *italic*, # headings, - lists, > blockquotes,
// [links](url), line breaks, and horizontal rules.

interface Props {
  text: string;
  className?: string;
}

function parseInline(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`(.+?)`/g, "<code>$1</code>")
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function parseMarkdown(text: string): string {
  const lines = text.split("\n");
  const html: string[] = [];
  let inList = false;
  let inBlockquote = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    if (line.startsWith("### ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      if (inBlockquote) { html.push("</blockquote>"); inBlockquote = false; }
      html.push(`<h3>${parseInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      if (inBlockquote) { html.push("</blockquote>"); inBlockquote = false; }
      html.push(`<h2>${parseInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      if (inBlockquote) { html.push("</blockquote>"); inBlockquote = false; }
      html.push(`<h2>${parseInline(line.slice(2))}</h2>`);
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
      if (inList) { html.push("</ul>"); inList = false; }
      if (inBlockquote) { html.push("</blockquote>"); inBlockquote = false; }
      html.push("<hr/>");
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      if (!inBlockquote) { html.push("<blockquote>"); inBlockquote = true; }
      html.push(`<p>${parseInline(line.slice(2))}</p>`);
      continue;
    } else if (inBlockquote) {
      html.push("</blockquote>");
      inBlockquote = false;
    }

    // Unordered list
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) { html.push("<ul>"); inList = true; }
      html.push(`<li>${parseInline(line.slice(2))}</li>`);
      continue;
    } else if (inList) {
      html.push("</ul>");
      inList = false;
    }

    // Empty line — paragraph break
    if (line.trim() === "") {
      html.push("<br/>");
      continue;
    }

    // Regular paragraph line
    html.push(`<p>${parseInline(line)}</p>`);
  }

  if (inList) html.push("</ul>");
  if (inBlockquote) html.push("</blockquote>");

  return html.join("");
}

export default function MarkdownBody({ text, className }: Props) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }}
      style={{ lineHeight: 1.85 }}
    />
  );
}
