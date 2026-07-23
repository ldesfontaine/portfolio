import type { SiteMeta } from "@/lib/types";

export default function Footer({ siteMeta }: { siteMeta: SiteMeta }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
      <div className="site-footer-links">
        <a
          href={siteMeta.github}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a
          href={siteMeta.linkedin}
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
        <a
          href={`mailto:${siteMeta.email}`}
        >
          Email
        </a>
      </div>
      <span className="site-footer-copy">
        © {new Date().getFullYear()} Lucas Desfontaine
      </span>
      </div>
    </footer>
  );
}
