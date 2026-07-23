"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/notes", label: "Notes", matches: ["/travaux", "/projets", "/notes"] },
  { href: "/profil", label: "Profil", matches: ["/profil"] },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
      <Link
        href="/"
        className="site-wordmark"
      >
        lucas<span>.</span>desf
      </Link>
      <div className="site-nav-links">
        {links.map((link) => {
          const active = link.matches.some(
            (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
          );
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "is-active" : undefined}
              aria-current={active ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      </div>
    </nav>
  );
}
