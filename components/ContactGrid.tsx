"use client";

import type { SiteMeta } from "@/lib/types";

type Contact = {
  label: string;
  value: string;
  href: string;
  icon: React.ReactNode;
};

export default function ContactGrid({ siteMeta }: { siteMeta: SiteMeta }) {
  const contacts: Contact[] = [
    {
      label: "Email",
      value: siteMeta.email,
      href: `mailto:${siteMeta.email}`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 7l-10 6L2 7" />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      value: "Lucas Desfontaine",
      href: siteMeta.linkedin,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
    {
      label: "GitHub",
      value: "ldesfontaine",
      href: siteMeta.github,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {contacts.map((c) => (
        <a
          key={c.label}
          href={c.href}
          target={c.href.startsWith("http") ? "_blank" : undefined}
          rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="flex items-center gap-3 rounded-lg px-5 py-4 transition-colors duration-200"
          style={{
            background: "var(--n50)",
            border: "0.5px solid var(--n100)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "var(--accent)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "var(--n100)")
          }
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              background: "var(--card-bg)",
              border: "0.5px solid var(--n200)",
              color: "var(--n500)",
            }}
          >
            {c.icon}
          </div>
          <div className="flex flex-col">
            <span
              className="font-mono text-[10.5px] uppercase"
              style={{ color: "var(--n300)" }}
            >
              {c.label}
            </span>
            <span
              className="text-[13.5px] font-medium"
              style={{ color: "var(--n700)" }}
            >
              {c.value}
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
