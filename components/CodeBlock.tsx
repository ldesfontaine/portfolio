"use client";

import { useState } from "react";

export default function CodeBlock({
  filename,
  language,
  children,
}: {
  filename: string;
  language: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="code-block">
      <div className="code-block-head">
        <span>
          {filename}
        </span>
        <div>
          <span>{language}</span>
          <button type="button" onClick={copy} aria-live="polite">
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      </div>
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
}
