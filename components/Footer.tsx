"use client";

import type { SiteMeta } from "@/lib/types";

export default function Footer({ siteMeta }: { siteMeta: SiteMeta }) {
  return (
    <footer style={{ borderTop: "0.5px solid var(--n100)" }}>
      <div className="mx-auto max-w-[820px] px-5 flex items-center justify-between py-6">
      <div className="flex items-center gap-4">
        <a
          href={siteMeta.github}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs transition-colors duration-200"
          style={{ color: "var(--n400)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--accent)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--n400)")
          }
        >
          GitHub
        </a>
        <a
          href={siteMeta.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs transition-colors duration-200"
          style={{ color: "var(--n400)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--accent)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--n400)")
          }
        >
          LinkedIn
        </a>
        <a
          href={`mailto:${siteMeta.email}`}
          className="font-mono text-xs transition-colors duration-200"
          style={{ color: "var(--n400)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--accent)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--n400)")
          }
        >
          Email
        </a>
      </div>
      <span
        className="font-mono text-[11px]"
        style={{ color: "var(--n300)" }}
      >
        {new Date().getFullYear()}
      </span>
      </div>
    </footer>
  );
}
